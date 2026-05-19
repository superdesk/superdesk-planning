import json
import pytest

from copy import deepcopy
from pathlib import Path

from eve.methods.common import parse

from prod_api.conftest import *  # noqa
from prod_api.conftest import get_test_prodapi_app

from planning.events.events_schema import events_schema
from planning.planning.planning_schema import planning_schema
from planning.prod_api.events import EventsResource
from planning.prod_api.planning import PlanningResource


# Copy schemas onto ProdAPI resources so elastic mapping is correct, otherwise certain queries will fail
# This will not happen in a production environment, as the index/types should already be created
EventsResource.schema = deepcopy(events_schema)
PlanningResource.schema = deepcopy(planning_schema)


@pytest.fixture(scope="function")
async def prodapi_app_with_data(request):
    """Prod API app with data loaded from this repository's local fixture set."""

    extra_config = deepcopy(getattr(request, "param", {}))
    extra_config["PRODAPI_AUTH_ENABLED"] = False
    app = await get_test_prodapi_app(extra_config)

    async with app.app_context():
        fixtures_dir = Path(__file__).parent / "tests" / "fixtures"
        for fixture_file in sorted(x for x in fixtures_dir.iterdir() if x.is_file()):
            resource = fixture_file.stem
            values = json.loads(fixture_file.read_text())
            docs = []
            for value in values:
                doc = parse(value, resource)
                docs.append(doc)
            app.data.insert(resource=resource, docs=docs)

    return app
