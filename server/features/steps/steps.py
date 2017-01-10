# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests.steps import *  # noqa
from superdesk.tests.steps import then, step_impl_then_get_existing, get_json_data
import json


@then('we get a list with {total_count} items')
def step_impl_list(context, total_count):
    step_impl_then_get_existing(context)
    data = get_json_data(context.response)
    assert len(data['_items']) == int(total_count), len(data['_items'])


@then('we get field {field} exactly')
def step_impl_exactly(context, field):
    data = get_json_data(context.response)
    # if it's a list, takes the first item
    if '_items' in data and len(data['_items']) > 0:
        data = data['_items'][0]
    # field must be present
    assert field in data, 'Field %s is not present in %s' % (field, data)
    expected_value = json.loads(context.text)
    # check field value
    assert data[field] == expected_value, 'Field %s is not equal to %s but %s' % (field, expected_value, data[field])


@then('we store "{tag}" with first item')
def steip_impl_store_first_item_to_ctx(context, tag):
    data = get_json_data(context.response)
    first_item = data['_items'][0]
    setattr(context, tag, first_item)
