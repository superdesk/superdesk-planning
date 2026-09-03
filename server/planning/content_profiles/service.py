from copy import deepcopy

from bson import ObjectId

from superdesk.core.resources import AsyncResourceService
from superdesk.core.resources.cursor import InMemoryCursorAsync
from superdesk.core.types import SearchRequest, ProjectedFieldArg, SortParam

from planning.common import planning_link_updates_to_coverage, get_config_event_related_item_search_provider_name
from planning.types import PlanningProfileResource, PlanningProfileType, DEFAULT_PROFILE_ID
from .profiles import DEFAULT_PROFILES


class PlanningTypesAsyncService(AsyncResourceService[PlanningProfileResource]):
    """Planning types async service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    async def on_create(self, docs: list[PlanningProfileResource]) -> None:
        # Make sure that if a Profile is attempted to be created that uses the ``DEFAULT_PROFILE_ID``
        # that we generate a new unique one (no profile should be stored in DB with ``_id=DEFAULT_PROFILE_ID``
        for profile in docs:
            if profile.id == DEFAULT_PROFILE_ID:
                profile.id = ObjectId()

    async def find_by_id_raw(
        self,
        item_id: str | ObjectId,
        version: int | None = None,
        projection: ProjectedFieldArg | None = None,
        use_elastic: bool = False,
    ) -> dict | None:

        profile = await super().find_by_id_raw(item_id, version, projection, use_elastic)
        item_type = profile.get("type") if profile else None

        merged_profile, _ = _get_merged_profile(profile, item_type)
        return merged_profile

    async def find_one_raw(
        self,
        req: SearchRequest | None = None,
        *,
        projection: ProjectedFieldArg | None = None,
        use_mongo: bool = False,
        version: int | None = None,
        **lookup,
    ) -> dict | None:
        """
        Overrides the `find_one` method to merge default planning type configurations
        with database entries. If no entry exists in the database, it returns a default
        planning type configuration.
        """

        search_request = (
            req
            if req is not None
            else SearchRequest(
                where=lookup,
                page=1,
                max_results=1,
                projection=projection,
                use_mongo=use_mongo,
                version=version,
            )
        )

        profile = await super().find_one_raw(search_request)

        # lookup type from either **lookup of planning_item(if lookup has only 'name')
        item_type: str | None = lookup.get("type")
        if not item_type and profile:
            item_type = profile.get("type")

        merged_profile, _ = _get_merged_profile(profile, item_type)
        return merged_profile

    async def find(
        self,
        req: SearchRequest | dict,
        page: int = 1,
        max_results: int = 25,
        sort: SortParam | None = None,
        projection: ProjectedFieldArg | None = None,
        use_mongo: bool = False,
    ) -> InMemoryCursorAsync[PlanningProfileResource]:
        """
        Overrides the base `find` to return a cursor containing planning types
        with default configurations merged into the results from the database. If a planning
        type is not present in the database, a default configuration is added.
        """

        search_request = (
            req
            if isinstance(req, SearchRequest)
            else SearchRequest(
                where=req,
                page=page,
                max_results=max_results,
                sort=sort,
                projection=projection,
            )
        )

        cursor = await super().find(search_request, use_mongo=True)
        profiles = await cursor.to_list_raw()
        populated_types: set[PlanningProfileType] = set()
        merged_profiles: list[dict] = []

        for profile in profiles:
            merged_profile, profile_type = _get_merged_profile(profile, profile.get("type"))
            if merged_profile and profile_type:
                merged_profiles.append(merged_profile)
                populated_types.add(profile_type)

        for item_type, default_profile in deepcopy(DEFAULT_PROFILES).items():
            if item_type in populated_types:
                # We already have a profile for this item type
                # no need to add it here
                continue

            default_profile_dict = default_profile.to_dict()
            _remove_unsupported_fields(default_profile_dict)
            merged_profiles.append(default_profile_dict)

        return InMemoryCursorAsync(PlanningProfileResource, merged_profiles)


def _get_merged_profile(
    profile: dict | None, item_type: str | None
) -> tuple[dict, PlanningProfileType] | tuple[None, None]:
    default_profile: dict | None = None
    profile_type: PlanningProfileType | None = None
    try:
        profile_type = PlanningProfileType(item_type)
        if profile_type and DEFAULT_PROFILES.get(profile_type):
            default_profile = DEFAULT_PROFILES[profile_type].to_dict()
    except ValueError:
        pass

    if not profile and profile_type and default_profile:
        _remove_unsupported_fields(default_profile)
        return default_profile, profile_type
    elif profile and profile_type:
        if default_profile:
            _merge_planning_type(profile, default_profile)
        return profile, profile_type
    else:
        return None, None


def _merge_planning_type(profile: dict, default_profile: dict):
    """Merge database content profile with default coverage profile to add any new fields.

    This method ensures that database content profiles get any new fields from the default
    coverage profile while preserving existing customizations. For each field in the default
    profile's editor and schema sections:
    - If the field doesn't exist in the database profile, it's added from the default
    - If the field exists in both, they're merged with database values taking precedence

    Args:
        content_profile (dict): The content profile from the database to be updated
        default_coverage_profile (dict): The default coverage profile to merge from
    """

    # Update schema fields with database schema fields
    updated_profile = deepcopy(default_profile)
    updated_profile.setdefault("schema", {})
    updated_profile.setdefault("editor", {})
    updated_profile.setdefault("groups", {})
    updated_profile["groups"].update(profile.get("groups", {}))

    if profile["type"] == "advanced_search":
        updated_profile["schema"].update(profile.get("schema", {}))
        updated_profile["editor"]["event"].update((profile.get("editor") or {}).get("event"))
        updated_profile["editor"]["planning"].update((profile.get("editor") or {}).get("planning"))
        updated_profile["editor"]["combined"].update((profile.get("editor") or {}).get("combined"))
        updated_profile["editor"]["assignments"].update((profile.get("editor") or {}).get("assignments", {}))
    elif profile["type"] in ["event", "planning", "coverage"]:
        for config_type in ["editor", "schema"]:
            profile.setdefault(config_type, {})

            # Merge fields from default profile
            for field, options in updated_profile[config_type].items():
                if not updated_profile[config_type][field]:
                    # If this field is none, then it is of type `schema.NoneField()`
                    # no need to copy any schema
                    continue
                elif field in profile[config_type]:
                    options.update(profile[config_type][field])

            # Copy fields from provided profile that aren't in the default profile
            for field, options in profile[config_type].items():
                if field not in updated_profile[config_type]:
                    updated_profile[config_type][field] = options

    else:
        updated_profile["editor"].update(profile.get("editor", {}))
        updated_profile["schema"].update(profile.get("schema", {}))

    profile["schema"] = updated_profile["schema"]
    profile["editor"] = updated_profile["editor"]
    profile["groups"] = updated_profile["groups"]
    _remove_unsupported_fields(profile)


def _remove_unsupported_fields(planning_type: dict):
    # Disable Event ``related_items`` field
    # if ``EVENT_RELATED_ITEM_SEARCH_PROVIDER_NAME`` config is not set
    if planning_type.get("type") == "event" and not get_config_event_related_item_search_provider_name():
        planning_type["editor"].pop("related_items", None)
        planning_type["schema"].pop("related_items", None)

    # Disable Coverage ``no_content_linking`` field
    # if ``PLANNING_LINK_UPDATES_TO_COVERAGES`` config is not ``True``
    if planning_type.get("type") == "coverage" and not planning_link_updates_to_coverage():
        planning_type["editor"].pop("no_content_linking", None)
        planning_type["schema"].pop("no_content_linking", None)
