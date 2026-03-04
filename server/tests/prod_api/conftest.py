import os
import pytest
from pathlib import Path
from flask import json
from eve.methods.common import parse

from planning.assignments.assignments import assignments_schema
from planning.prod_api.assignments.resource import AssignmentsResource
from planning.planning.planning import planning_schema
from planning.prod_api.planning.resource import PlanningResource

from prod_api.conftest import get_test_prodapi_app, teardown_app


@pytest.fixture(scope="function")
def prodapi_app(request):
    extra_config = getattr(request, "param", {})
    extra_config["PRODAPI_AUTH_ENABLED"] = False

    # patch Assignment, Planning schemas so elasticsearch will get initialised.
    # this will not happen in a production environment as the index/types should already be created
    AssignmentsResource.schema = assignments_schema
    PlanningResource.schema = planning_schema

    app = get_test_prodapi_app(extra_config)

    def test_app_teardown():
        teardown_app(app)

    request.addfinalizer(test_app_teardown)

    return app


@pytest.fixture(scope="function")
def prodapi_app_with_data(prodapi_app):
    """
    Override the base fixture to use planning fixtures instead of the superdesk-core ones.
    """

    # fill with data from our fixtures
    with prodapi_app.app_context():
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
def prodapi_app_with_data_client(prodapi_app):
    """Test client for prod api with filled data"""

    client = prodapi_app.test_client()

    with prodapi_app.app_context():
        yield client
