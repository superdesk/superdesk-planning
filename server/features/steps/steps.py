# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests.publish_steps import * # noqa
from superdesk.tests.steps import (then, when, step_impl_then_get_existing, get_json_data,
                                   assert_200, unique_headers, get_prefixed_url,
                                   if_match, assert_404, apply_placeholders, get_res, set_placeholder,
                                   DATETIME_FORMAT, json_match)
from flask import json
from planning.common import get_local_end_of_day
from wooper.assertions import assert_equal


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


@then('we store "{tag}" with {index} item')
def steip_impl_store_indexed_item_to_ctx(context, tag, index):
    data = get_json_data(context.response)
    item = data['_items'][int(index) - 1]
    setattr(context, tag, item)


@then('we store "{tag}" from patch')
def step_imp_store_item_from_patch(context, tag):
    data = get_json_data(context.response)
    setattr(context, tag, data)


@then('we store "{tag}" from last duplicated item')
def step_imp_store_last_duplicate_item(context, tag):
    data = get_json_data(context.response)
    new_id = data['duplicate_to'][-1]
    setattr(context, tag, {'id': new_id})


@then('we store "{tag}" from last rescheduled item')
def step_imp_store_last_duplicate_item(context, tag):
    data = get_json_data(context.response)
    new_id = data['reschedule_to']
    setattr(context, tag, {'id': new_id})


@then('we get an event file reference')
def step_impl_then_get_event_file(context):
    assert_200(context.response)
    data = get_json_data(context.response)
    url = '/upload-raw/%s' % data['filemeta']['media_id']
    headers = [('Accept', 'application/json')]
    headers = unique_headers(headers, context.headers)
    response = context.client.get(get_prefixed_url(context.app, url), headers=headers)
    assert_200(response)
    assert len(response.get_data()), response
    fetched_data = get_json_data(context.response)
    context.fetched_data = fetched_data


@then('we can delete that event file')
def step_impl_we_delete_event_file(context):
    url = '/events_files/%s' % context.fetched_data['_id']
    context.headers.append(('Accept', 'application/json'))
    headers = if_match(context, context.fetched_data.get('_etag'))
    response = context.client.delete(get_prefixed_url(context.app, url), headers=headers)
    assert_200(response)
    response = context.client.get(get_prefixed_url(context.app, url), headers=headers)
    assert_404(response)


@when('we spike {resource} "{item_id}"')
def step_impl_when_spike_resource(context, resource, item_id):
    data = context.text or {}
    resource = apply_placeholders(context, resource)
    item_id = apply_placeholders(context, item_id)

    item_url = '/{}/{}'.format(resource, item_id)
    spike_url = '/{}/spike/{}'.format(resource, item_id)

    res = get_res(item_url, context)
    headers = if_match(context, res.get('_etag'))

    context.response = context.client.patch(get_prefixed_url(context.app, spike_url),
                                            data=json.dumps(data), headers=headers)


@when('we unspike {resource} "{item_id}"')
def step_impl_when_unspike_resource(context, resource, item_id):
    data = context.text or {}
    resource = apply_placeholders(context, resource)
    item_id = apply_placeholders(context, item_id)

    item_url = '/{}/{}'.format(resource, item_id)
    unspike_url = '/{}/unspike/{}'.format(resource, item_id)

    res = get_res(item_url, context)
    headers = if_match(context, res.get('_etag'))

    context.response = context.client.patch(get_prefixed_url(context.app, unspike_url),
                                            data=json.dumps(data), headers=headers)


@when('we perform {action} on {resource} "{item_id}"')
def step_imp_when_action_resource(context, action, resource, item_id):
    data = context.text or {}
    resource = apply_placeholders(context, resource)
    item_id = apply_placeholders(context, item_id)

    item_url = '/{}/{}'.format(resource, item_id)
    action_url = '/{}/{}/{}'.format(resource, action, item_id)

    res = get_res(item_url, context)
    headers = if_match(context, res.get('_etag'))

    context.response = context.client.patch(get_prefixed_url(context.app, action_url),
                                            data=json.dumps(data), headers=headers)


@then('we get text in "{field}"')
def then_we_get_text_in_response_field(context, field):
    response = get_json_data(context.response)[field]
    assert context.text in response, response


@then('we store assignment id in "{tag}" from coverage {index}')
def then_we_store_assignment_id(context, tag, index):
    index = int(index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverage are not defined.'
    coverage = response.get('coverages')[index]
    assignment_id = coverage.get('assigned_to', {}).get('assignment_id')
    set_placeholder(context, tag, assignment_id)


@then('we store coverage id in "{tag}" from coverage {index}')
def then_we_store_assignment_id(context, tag, index):
    index = int(index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverage are not defined.'
    coverage = response.get('coverages')[index]
    coverage_id = coverage.get('coverage_id')
    set_placeholder(context, tag, coverage_id)


@then('the assignment not created for coverage {index}')
def then_we_store_assignment_id(context, index):
    index = int(index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverage are not defined.'
    coverage = response.get('coverages')[index]
    assert not coverage.get('assigned_to', {}).get('assignment_id'), 'Coverage has an assignment'


@then('assignment {index} is scheduled for end of today')
def then_assignment_scheduled_for_end_of_day(context, index):
    index = int(index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverages are not defined'
    coverage = response.get('coverages')[index]
    eod = get_local_end_of_day().strftime(DATETIME_FORMAT)
    assert coverage['planning']['scheduled'] == eod, 'Coverage is not schedule to end of day'


@then('we get array of {field} by {fid}')
def then_we_get_array_of_by(context, field, fid):
    response = get_json_data(context.response)
    assert field in response, '{} field not defined'.format(field)
    assert len(response.get(field)), '{} field not defined'.format(field)
    context_data = json.loads(apply_placeholders(context, context.text))

    for row in response[field]:
        if row[fid] not in context_data.keys():
            continue

        assert_equal(
            json_match(
                context_data[row[fid]],
                row
            ),
            True,
            msg=str(row) + '\n != \n' + str(context_data[row[fid]])
        )
