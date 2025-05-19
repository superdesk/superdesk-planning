from behave.api.async_step import async_run_until_complete  # noqa

from superdesk.tests.publish_steps import *  # noqa
from superdesk.tests.steps import *  # noqa

import json
from typing import Any

from behave import given, when
from superdesk.tests.steps import *


@given('content api resource "{resource}"')
@async_run_until_complete
async def step_impl_given_(context, resource):
    data = apply_placeholders(context, context.text)
    items = [parse(item, resource) for item in json.loads(data)]
    if is_user_resource(resource):
        for item in items:
            item.setdefault("needs_activation", False)

    await post_items(resource, items, use_eve=True)
    context.data = items
    context.resource = resource
    try:
        setattr(context, resource, items[-1])
    except KeyError:
        pass
