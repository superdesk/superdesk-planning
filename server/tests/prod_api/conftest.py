import os
import pytest
from pathlib import Path
from copy import deepcopy

from eve.methods.common import parse

from superdesk.core import json

from prod_api.conftest import get_test_prodapi_app, teardown_app

from planning.events.events_schema import events_schema
from planning.planning.planning_schema import planning_schema
from planning.prod_api.events import EventsResource
from planning.prod_api.planning import PlanningResource
from planning.assignments.assignments import assignments_schema
from planning.prod_api.assignments.resource import AssignmentsResource


@pytest.fixture(scope="function")
async def prodapi_app(request):
    extra_config = getattr(request, "param", {})
    extra_config["PRODAPI_AUTH_ENABLED"] = False

    # Copy schemas onto ProdAPI resources so elastic mapping is correct, otherwise certain queries will fail
    # This will not happen in a production environment, as the index/types should already be created
    EventsResource.schema = deepcopy(events_schema)
    AssignmentsResource.schema = deepcopy(assignments_schema)
    PlanningResource.schema = deepcopy(planning_schema)

    app = await get_test_prodapi_app(extra_config)

    def test_app_teardown():
        teardown_app(app)

    request.addfinalizer(test_app_teardown)

    return app


@pytest.fixture(scope="function")
async def prodapi_app_with_data(prodapi_app):
    """
    Override the base fixture to use planning fixtures instead of the superdesk-core ones.
    """

    # fill with data from our fixtures
    async with prodapi_app.app_context():
        p = Path(os.path.join(os.path.dirname(__file__), "tests/fixtures"))
        for fixture_file in sorted(p.iterdir()):
            if fixture_file.is_file():
                with fixture_file.open() as f:
                    resource = fixture_file.stem
                    values = json.load(f)
                    docs = [parse(value, resource) for value in values]
                    prodapi_app.data.insert(resource=resource, docs=docs)

    return prodapi_app


@pytest.fixture(scope="function")
async def prodapi_app_with_data_client(prodapi_app):
    """Test client for prod api with filled data"""

    client = prodapi_app.test_client()

    async with prodapi_app.app_context():
        yield client
