from typing import assert_never
import logging

from quart_babel import gettext

from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.errors import SuperdeskApiError

from planning.types import AgendasResourceModel, PlanningProfileResource, UpdateMethods, PostStates
from planning.types.unified import UnifiedPlanningResource, RelatedEventLink, RelatedEventLinkType
from planning.utils import get_planning_event_link_method
from planning.common import unique_items_in_order, update_post_item
from planning.content_profiles.utils import is_field_enabled, is_post_planning_with_event_enabled

from .common import get_related_event_links, get_first_related_event_id, get_recurring_timeline, ItemUpdateRequest
from .notifications import notify_related_events_changed


logger = logging.getLogger(__name__)


async def on_create_planning(planning: UnifiedPlanningResource, items: list[UnifiedPlanningResource]) -> None:
    first_event = await _set_planning_event_info(planning)
    # await self._set_coverage(doc)

    if first_event and planning.update_method is not None:
        new_plans = await _add_planning_to_event_series(planning, first_event)
        if len(new_plans):
            items.extend(new_plans)


async def on_planning_created(planning: UnifiedPlanningResource, parent_event: UnifiedPlanningResource | None) -> None:
    # TODO-UNIFIED: Send `<type>_created` signal here, before auto-posting
    # planning_created.send(self, item=planning.to_dict())
    post_planning_with_event = await is_post_planning_with_event_enabled()

    if post_planning_with_event and parent_event and parent_event.pubstatus == PostStates.USABLE:
        original = planning.to_dict()
        updates = original.copy()
        updates["pubstatus"] = PostStates.USABLE
        await update_post_item(updates, original)


async def on_planning_update(req: ItemUpdateRequest) -> None:
    pass


async def on_planning_updated(updates: dict, original: UnifiedPlanningResource) -> None:
    updates["related_events_changed"] = await notify_related_events_changed(updates, original)

    if await update_post_item(updates, original.to_dict()):
        new_planning = await UnifiedPlanningResource.get_service().find_by_id(original.id)
        if not new_planning:
            raise SuperdeskApiError.badRequestError(gettext("Planning not found"))

        updates["_etag"] = new_planning.etag


async def _set_planning_event_info(planning: UnifiedPlanningResource) -> UnifiedPlanningResource | None:
    event_id = get_first_related_event_id(planning, RelatedEventLinkType.PRIMARY)
    if not event_id:
        return None

    planning_type = await PlanningProfileResource.get_service().find_one(type="planning")
    if planning_type is None:
        raise SuperdeskApiError.badRequestError(gettext("Planning type 'planning' not found"))
    planning_type_dict = planning_type.to_dict()

    event = await UnifiedPlanningResource.get_service().find_by_id(event_id)
    if not event:
        logger.warning(
            "Failed to find linked event for planning",
            extra=dict(
                event_id=event_id,
                plan_id=planning.id,
            ),
        )
        return None

    if event.recurrence_id:
        planning.recurrence_id = event.recurrence_id

    # Populate headline using name
    if not planning.headline and event.name and is_field_enabled("headline", planning_type_dict):
        planning.headline = event.name

    if event.time_to_be_confirmed:
        planning.time_to_be_confirmed = True

    return event


async def validate_create_planning(planning: UnifiedPlanningResource) -> None:
    _validate_event_links(planning)
    await _validate_agendas(planning)


async def validate_update_planning(original: UnifiedPlanningResource, updates: dict) -> None:
    planning = original.clone_with(updates)
    _validate_event_links(planning)
    await _validate_agendas(planning)


def _validate_event_links(planning: UnifiedPlanningResource) -> None:
    if not planning.related_events:
        return

    ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR = gettext("Only 1 primary linked event is allowed")
    event_link_method = get_planning_event_link_method()

    if event_link_method == "one_primary":
        if len(planning.related_events) > 1:
            raise SuperdeskApiError.badRequestError(ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR)
        elif planning.related_events[0].link_type != RelatedEventLinkType.PRIMARY:
            raise SuperdeskApiError.badRequestError(gettext("Only primary event links are allowed"))
    elif event_link_method == "many_secondary":
        for link in planning.related_events:
            if link.link_type != RelatedEventLinkType.SECONDARY:
                raise SuperdeskApiError.badRequestError(gettext("Only secondary event links are allowed"))
    elif event_link_method == "one_primary_many_secondary":
        primary_links = get_related_event_links(planning, RelatedEventLinkType.PRIMARY)
        secondary_links = get_related_event_links(planning, RelatedEventLinkType.SECONDARY)
        if len(primary_links) > 1:
            raise SuperdeskApiError.badRequestError(ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR)
        elif len(primary_links) + len(secondary_links) != len(planning.related_events):
            raise SuperdeskApiError.badRequestError(gettext("Missing events link type"))
    else:
        assert_never(event_link_method)


async def _validate_agendas(planning: UnifiedPlanningResource) -> None:
    if not planning.agendas:
        return

    agenda_service = AgendasResourceModel.get_service()
    for agenda_id in planning.agendas:
        agenda = await agenda_service.find_by_id(agenda_id)
        if not agenda:
            raise SuperdeskApiError.badRequestError(gettext(f"Agenda {agenda_id} does not exist"))
        if not agenda.is_enabled:
            raise SuperdeskApiError.badRequestError(gettext(f"Agenda '{agenda.name}' is not enabled"))

    # Remove duplicate Agendas
    planning.agendas = unique_items_in_order(planning.agendas)


async def _add_planning_to_event_series(
    planning: UnifiedPlanningResource, event: UnifiedPlanningResource
) -> list[UnifiedPlanningResource]:
    if planning.update_method not in [UpdateMethods.FUTURE, UpdateMethods.ALL]:
        return []
    elif not event.recurrence_id:
        # Not a series of Events, can safely return
        return []

    planning.planning_recurrence_id = generate_guid(type=GUID_NEWSML)
    planning_date_relative = planning.dates.start - event.dates.start
    items: list[UnifiedPlanningResource] = []
    historic, past, future = await get_recurring_timeline(event)
    event_series = future if planning.update_method == UpdateMethods.FUTURE else historic + past + future

    for series_entry in event_series:
        if series_entry.id == event.id:
            # This is the Event that was provided
            # We assume a Planning item was already created for this Event
            continue

        new_plan = planning.clone()

        # Set the Planning & Event IDs for the new item
        new_plan.guid = new_plan.id = generate_guid(type=GUID_NEWSML)
        new_plan.related_events = [
            RelatedEventLink(
                _id=series_entry.id, recurrence_id=event.recurrence_id, link_type=RelatedEventLinkType.PRIMARY
            )
        ]
        new_plan.recurrence_id = event.recurrence_id

        # Set the Planning date/time relative to the Event start date/time
        new_plan.dates.start = series_entry.dates.start + planning_date_relative
        for coverage in new_plan.coverages or []:
            # TODO-UNIFIED: Original code removes the `coverage_id` here, maybe so it's seen as a new coverage
            coverage.original_coverage_id = coverage.coverage_id
            if coverage.assigned_to:
                coverage.assigned_to.assignment_id = None

            # Set the scheduled date/time relative to the Event start date/time
            coverage_date_relative = coverage.planning.scheduled - event.dates.start
            coverage.planning.scheduled = series_entry.dates.start + coverage_date_relative

        # TODO-UNIFIED:
        # await self._set_coverage(new_plan)
        # self.set_planning_schedule(new_plan)
        items.append(new_plan)

    return items
