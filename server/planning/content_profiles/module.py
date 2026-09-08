from quart_babel import lazy_gettext

import superdesk
from superdesk.core.resources import ResourceConfig, RestEndpointConfig, MongoResourceConfig, MongoIndexOptions
from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules
from superdesk.factory.app import SuperdeskApp

from planning.types import PlanningProfileResource
from planning.common import get_config_event_related_item_search_provider_name

from .service import PlanningTypesAsyncService
from .rest_endpoints import PlanningProfilesRestEndpoints


def init_app(app: SuperdeskApp) -> None:
    superdesk.privilege(
        name="planning_manage_content_profiles",
        label=lazy_gettext("Planning - Manage Content Profiles"),
        description=lazy_gettext("Ability to edit Event/Planning Content Profiles"),
    )

    event_related_item_search_provider_name = get_config_event_related_item_search_provider_name()
    if event_related_item_search_provider_name:
        app.client_config.setdefault("planning", {})[
            "event_related_item_search_provider_name"
        ] = event_related_item_search_provider_name


planning_types_resource_config = ResourceConfig(
    name="planning_types",
    data_class=PlanningProfileResource,
    service=PlanningTypesAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="item_type_1_name_1",
                keys=[("type", 1), ("name", 1)],
                unique=True,
            ),
        ]
    ),
    rest_endpoints=RestEndpointConfig(
        endpoints_class=PlanningProfilesRestEndpoints,
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PATCH"],
        enable_cors=True,
        auth=http_method_privilege_based_rules(
            {
                "POST": "planning_manage_content_profiles",
                "PATCH": "planning_manage_content_profiles",
            }
        ),
    ),
)
