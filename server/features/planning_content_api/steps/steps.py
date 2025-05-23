from behave import when
from behave.api.async_step import async_run_until_complete

from superdesk.tests import token_to_basic_auth_header
from superdesk.tests.steps import unique_headers, apply_placeholders, get_prefixed_url


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
