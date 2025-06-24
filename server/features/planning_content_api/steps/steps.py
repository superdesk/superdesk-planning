from behave import when
from behave.api.async_step import async_run_until_complete

from superdesk.tests import token_to_basic_auth_header, utils as test_utils
from superdesk.tests.steps import apply_placeholders, get_prefixed_url

from features.steps.steps import *  # noqa


@when('we get capi "{url}"')
@async_run_until_complete
async def step_impl_get_capi(context, url):
    url = apply_placeholders(context, url)
    async with context.capi.app_context():
        context.response = await context.capi_client.get(
            get_prefixed_url(context.capi, url), headers=getattr(context, "capi_headers", [])
        )


@when('we set capi auth token to "{token}"')
def step_impl_login_capi(context, token):
    token = apply_placeholders(context, token)
    context.capi_headers = [
        token_to_basic_auth_header(token),
        ("Content-Type", "application/json"),
    ]


@when("we configure planning for publishing to capi")
@async_run_until_complete
async def setup_capi_publishing(context):
    async with context.app.app_context():
        fc_ids = await test_utils.post_items(
            "filter_conditions",
            [
                {"name": "Sports", "field": "anpa_category", "operator": "in", "value": "sports"},
                {"name": "Finance", "field": "anpa_category", "operator": "in", "value": "finance"},
            ],
        )
        cf_ids = await test_utils.post_items(
            "content_filters",
            [
                {"name": "sports-only", "content_filter": [{"expression": {"fc": [fc_ids[0]]}}]},
                {"name": "finance-only", "content_filter": [{"expression": {"fc": [fc_ids[1]]}}]},
            ],
        )
        product_ids = await test_utils.post_items(
            "products",
            [
                {
                    "name": "sports",
                    "codes": "sp1,sp2",
                    "product_type": "both",
                    "content_filter": {"filter_id": cf_ids[0], "filter_type": "permitting"},
                },
                {
                    "name": "finance",
                    "codes": "fn1,fn2",
                    "product_type": "both",
                    "content_filter": {"filter_id": cf_ids[1], "filter_type": "permitting"},
                },
            ],
        )
        subscriber_ids = await test_utils.post_items(
            "subscribers",
            [
                {
                    "name": "Sports Subscriber",
                    "subscriber_type": "digital",
                    "email": "sports_api@test.com",
                    "is_active": True,
                    "api_products": [product_ids[0]],
                },
                {
                    "name": "All Subscriber",
                    "subscriber_type": "digital",
                    "email": "public_api@test.com",
                    "is_active": True,
                    "api_products": [product_ids[0], product_ids[1]],
                },
            ],
        )
        token_ids = await test_utils.post_items(
            "subscriber_token",
            [
                {"subscriber": subscriber_ids[0], "expiry_days": 64},
                {"subscriber": subscriber_ids[1], "expiry_days": 128},
            ],
        )
        for index, token_id in enumerate(token_ids):
            setattr(context, f"subscriber_token_{index}", {"_id": token_id})
