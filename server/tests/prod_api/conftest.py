from copy import deepcopy

from prod_api.conftest import *  # noqa

from planning.events.events_schema import events_schema
from planning.planning.planning_schema import planning_schema
from planning.prod_api.events import EventsResource
from planning.prod_api.planning import PlanningResource


# Copy schemas onto ProdAPI resources so elastic mapping is correct, otherwise certain queries will fail
# This will not happen in a production environment, as the index/types should already be created
EventsResource.schema = deepcopy(events_schema)
PlanningResource.schema = deepcopy(planning_schema)
