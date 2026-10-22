import json

import pytest
from flask import url_for


@pytest.mark.parametrize("resource", ["events", "planning"])
async def test_fetch_from_unified_storage(prodapi_app, resource):
    async with prodapi_app.test_request_context("/"):
        response = await prodapi_app.test_client().get(
            url_for(f"{resource}|resource", source=json.dumps({"query": {"match_none": {}}}))
        )

        assert response.status_code == 200
        assert (await response.get_json())["_items"] == []
