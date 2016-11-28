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


@then('we get a list with {total_count} items')
def step_impl_list(context, total_count):
    step_impl_then_get_existing(context)
    data = get_json_data(context.response)
    assert len(data['_items']) == int(total_count), len(data['_items'])
