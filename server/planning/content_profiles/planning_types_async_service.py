from typing import Any
from copy import deepcopy

from superdesk.core.resources import AsyncResourceService
from superdesk.core.resources.cursor import ElasticsearchResourceCursorAsync
from superdesk.core.types import SearchRequest, ProjectedFieldArg, SortParam

from planning.common import planning_link_updates_to_coverage, get_config_event_related_item_search_provider_name
from planning.types import PlanningTypesResourceModel
from .profiles import DEFAULT_PROFILES


class PlanningTypesAsyncService(AsyncResourceService[PlanningTypesResourceModel]):
    """Planning types async service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    async def find_one(
        self,
        req: SearchRequest | None = None,
        projection: ProjectedFieldArg | None = None,
        use_mongo: bool = False,
        version: int | None = None,
        **lookup,
    ) -> PlanningTypesResourceModel | None:
        """
        Overrides the `find_one` method to merge default planning type configurations
        with database entries. If no entry exists in the database, it returns a default
        planning type configuration.
        """
        try:
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

            planning_type = await super().find_one(search_request)

            # lookup name from either **lookup of planning_item(if lookup has only '_id')
            lookup_name = lookup.get("name")
            if not lookup_name and planning_type:
                lookup_name = planning_type.name

            default_planning_type = deepcopy(
                next(
                    (ptype for ptype in DEFAULT_PROFILES if ptype.get("name") == lookup_name),
                    {},
                )
            )
            if not planning_type:
                self._remove_unsupported_fields(default_planning_type)
                return PlanningTypesResourceModel(**default_planning_type)

            self.merge_planning_type(planning_type.to_dict(), default_planning_type)
            return planning_type
        except IndexError:
            return None

    async def find(
        self,
        req: SearchRequest | dict,
        page: int = 1,
        max_results: int = 25,
        sort: SortParam | None = None,
        projection: ProjectedFieldArg | None = None,
        use_mongo: bool = False,
    ) -> ElasticsearchResourceCursorAsync[PlanningTypesResourceModel]:
        """
        Overrides the base `find` to return a cursor containing planning types
        with default configurations merged into the results from the database. If a planning
        type is not present in the database, a default configuration is added.
        """

        if isinstance(req, SearchRequest):
            req = {
                "where": req.where,
                "page": req.page,
                "max_results": req.max_results,
                "sort": req.sort,
                "projection": req.projection,
            }

        cursor = await super().find(req, page, max_results, sort, projection, use_mongo)
        planning_types = await cursor.to_list_raw()
        merged_planning_types = []

        for default_planning_type in deepcopy(DEFAULT_PROFILES):
            planning_type = next(
                (p for p in planning_types if p.get("name") == default_planning_type.get("name")),
                None,
            )

            # If nothing is defined in database for this planning_type, use default
            if planning_type is None:
                self._remove_unsupported_fields(default_planning_type)
                merged_planning_types.append(default_planning_type)
            else:
                self.merge_planning_type(planning_type, default_planning_type)
                merged_planning_types.append(planning_type)

        return ElasticsearchResourceCursorAsync(data_class=PlanningTypesResourceModel, hits=merged_planning_types)

    def merge_planning_type(self, planning_type: dict[str, Any], default_planning_type: dict[str, Any]):
        # Update schema fields with database schema fields
        default_type: dict[str, Any] = {"schema": {}, "editor": {}}
        updated_planning_type = deepcopy(default_planning_type or default_type)

        updated_planning_type.setdefault("groups", {})
        updated_planning_type["groups"].update(planning_type.get("groups", {}))

        if planning_type["name"] == "advanced_search":
            updated_planning_type["schema"].update(planning_type.get("schema", {}))
            updated_planning_type["editor"]["event"].update((planning_type.get("editor") or {}).get("event"))
            updated_planning_type["editor"]["planning"].update((planning_type.get("editor") or {}).get("planning"))
            updated_planning_type["editor"]["combined"].update((planning_type.get("editor") or {}).get("combined"))
        elif planning_type["name"] in ["event", "planning", "coverage"]:
            for config_type in ["editor", "schema"]:
                planning_type.setdefault(config_type, {})
                for field, options in updated_planning_type[config_type].items():
                    # If this field is none, then it is of type `schema.NoneField()`
                    # no need to copy any schema
                    if updated_planning_type[config_type][field]:
                        updated_planning_type[config_type][field].update(planning_type[config_type].get(field) or {})
        else:
            updated_planning_type["editor"].update(planning_type.get("editor", {}))
            updated_planning_type["schema"].update(planning_type.get("schema", {}))

        planning_type["schema"] = updated_planning_type["schema"]
        planning_type["editor"] = updated_planning_type["editor"]
        planning_type["groups"] = updated_planning_type["groups"]
        self._remove_unsupported_fields(planning_type)

    def _remove_unsupported_fields(self, planning_type: dict[str, Any]):
        # Disable Event ``related_items`` field
        # if ``EVENT_RELATED_ITEM_SEARCH_PROVIDER_NAME`` config is not set
        if planning_type.get("name") == "event" and not get_config_event_related_item_search_provider_name():
            planning_type["editor"].pop("related_items", None)
            planning_type["schema"].pop("related_items", None)

        # Disable Coverage ``no_content_linking`` field
        # if ``PLANNING_LINK_UPDATES_TO_COVERAGES`` config is not ``True``
        if planning_type.get("name") == "coverage" and not planning_link_updates_to_coverage():
            planning_type["editor"].pop("no_content_linking", None)
            planning_type["schema"].pop("no_content_linking", None)
