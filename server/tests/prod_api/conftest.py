import os
import pytest
from pathlib import Path
from flask import json
from eve.methods.common import parse

from prod_api.conftest import get_test_prodapi_app, teardown_app


@pytest.fixture(scope="function")
def prodapi_app_with_data(request):
    """
    Override the base fixture to use planning fixtures instead of the superdesk-core ones.
    """
    extra_config = getattr(request, "param", {})
    extra_config["PRODAPI_AUTH_ENABLED"] = False
    app = get_test_prodapi_app(extra_config)

    # fill with data from our fixtures
    with app.app_context():
        p = Path(os.path.join(os.path.dirname(__file__), "tests/fixtures"))
        for fixture_file in sorted(p.iterdir()):
            if fixture_file.is_file():
                with fixture_file.open() as f:
                    resource = fixture_file.stem
                    values = json.load(f)
                    docs = [parse(value, resource) for value in values]
                    app.data.insert(resource=resource, docs=docs)

    def test_app_teardown():
        teardown_app(app)

    request.addfinalizer(test_app_teardown)

    return app


@pytest.fixture(scope="function")
def prodapi_app_with_data_client(prodapi_app_with_data):
    """Test client for prod api with filled data"""

    client = prodapi_app_with_data.test_client()

    with prodapi_app_with_data.app_context():
        yield client
