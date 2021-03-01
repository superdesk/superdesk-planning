# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import os
import pytz
from datetime import time
from flask import json
from datetime import datetime, timedelta
from copy import deepcopy

from superdesk.tests.publish_steps import * # noqa
from superdesk.tests.steps import (then, when, step_impl_then_get_existing, get_json_data,
                                   assert_200, unique_headers, get_prefixed_url,
                                   if_match, assert_404, apply_placeholders, get_res, set_placeholder,
                                   DATETIME_FORMAT, json_match, post_data)
from superdesk.io import get_feeding_service
from superdesk.io.commands.update_ingest import LAST_ITEM_UPDATE
from superdesk.utc import utcnow, utc_to_local
from superdesk import get_resource_service, etree
from superdesk.io.feed_parsers import XMLFeedParser
from wooper.assertions import assert_equal


def get_local_end_of_day(context, day=None, timezone=None):
    tz = pytz.timezone(timezone or context.app.config['DEFAULT_TIMEZONE'])
    day = day or utc_to_local(tz.zone, utcnow())

    return tz.localize(
        datetime.combine(day, time(23, 59, 59)), is_dst=None
    ).astimezone(pytz.utc)


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

    # Remove blank lines to make testing easier
    response_text = '\n'.join([
        line
        for line in response.split('\n')
        if len(line)
    ])

    assert context.text.strip() in response_text, '"{}" not in "{}"'.format(
        context.text.strip(),
        response_text
    )


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


@then('we store scheduled_update id in "{tag}" from scheduled_update {index} of coverage {coverage_index}')
def then_we_store_assignment_id(context, tag, index, coverage_index):
    index = int(index)
    coverage_index = int(coverage_index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverage are not defined.'
    coverage = response.get('coverages')[coverage_index]
    assert len(coverage.get('scheduled_updates')), 'scheduled_updates are not defined.'
    scheduled_update = coverage['scheduled_updates'][index]
    set_placeholder(context, tag, scheduled_update.get('scheduled_update_id'))


@then('we store assignment id in "{tag}" from scheduled_update {index} of coverage {coverage_index}')
def then_we_store_assignment_id(context, tag, index, coverage_index):
    index = int(index)
    coverage_index = int(coverage_index)
    response = get_json_data(context.response)
    coverage = (response.get('coverages') or [])[coverage_index]
    assert len(coverage.get('scheduled_updates')), 'scheduled_updates are not defined.'
    scheduled_update = coverage['scheduled_updates'][index]
    set_placeholder(context, tag, scheduled_update.get('assigned_to', {}).get('assignment_id'))


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
    eod = get_local_end_of_day(context).strftime(DATETIME_FORMAT)
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


@then('planning item has current date')
def then_item_has_current_date(context):
    response = get_json_data(context.response)
    assert "planning_date" in response, 'planning_date field not defined'
    response_date_time = datetime.strptime(response["planning_date"], DATETIME_FORMAT)
    assert response_date_time.date() == get_local_end_of_day(context).date(), 'Planning Item has not got current date'


@then('coverage {index} has current date')
def then_coverage_has_current_date(context, index):
    index = int(index)
    response = get_json_data(context.response)
    assert len(response.get('coverages')), 'Coverages are not defined'
    coverage = response.get('coverages')[index]
    response_date_time = datetime.strptime(coverage['planning']['scheduled'], DATETIME_FORMAT)
    assert response_date_time.date() == get_local_end_of_day(context).date(), \
        'Coverage is not schedule for current date'


@then('versioned file exists "{path}"')
def then_versioned_file_exists(context, path):
    path = apply_placeholders(context, path)
    assert os.path.isfile(path), '{} is not a file'.format(path)


@then('store versioned json file from "{path}"')
def then_versioned_file_exists(context, path):
    path = apply_placeholders(context, path)
    assert os.path.isfile(path), '{} is not a file'.format(path)
    file_name = os.path.basename(path)
    with open(path, 'r') as json_file:
        data = json.load(json_file)
        set_placeholder(context, file_name, data)


@then('we get transmitted item "{path}"')
def then_get_transmitted_item(context, path):
    path = apply_placeholders(context, path)
    path = path.replace(':', '-')
    assert os.path.isfile(path), '{} is not a file'.format(path)
    with open(path, 'r') as json_file:
        data = json.load(json_file)
        json_file.close()
    context_data = json.loads(apply_placeholders(context, context.text))
    assert json_match(context_data, data)


@when('we fetch events from "{provider_name}" ingest "{guid}"')
def step_impl_fetch_from_provider_ingest(context, provider_name, guid):
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        ingest_provider_service = get_resource_service('ingest_providers')
        provider = ingest_provider_service.find_one(name=provider_name, req=None)

        provider_service = get_feeding_service(provider['feeding_service'])
        file_path = os.path.join(provider.get('config', {}).get('path', ''), guid)
        feeding_parser = provider_service.get_feed_parser(provider)
        if isinstance(feeding_parser, XMLFeedParser):
            with open(file_path, 'rb') as f:
                xml_string = etree.etree.fromstring(f.read())
                parsed = feeding_parser.parse(xml_string, provider)
        else:
            parsed = feeding_parser.parse(file_path, provider)

        items = [parsed] if not isinstance(parsed, list) else parsed

        for item in items:
            item['versioncreated'] = utcnow()
            item['expiry'] = utcnow() + timedelta(minutes=20)

        failed = context.ingest_items(items, provider, provider_service)
        assert len(failed) == 0, failed

        provider = ingest_provider_service.find_one(name=provider_name, req=None)
        ingest_provider_service.system_update(provider['_id'], {LAST_ITEM_UPDATE: utcnow()}, provider)

        for item in items:
            set_placeholder(context, '{}.{}'.format(provider_name, item['guid']), item['_id'])


@when('we duplicate event "{event_id}"')
def step_impl_when_we_duplicate_event(context, event_id):
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        events_service = get_resource_service('events')
        original_event = events_service.find_one(req=None, _id=event_id)
        duplicate_event = deepcopy(original_event)

        for key, value in original_event.items():
            if key.startswith('_'):
                duplicate_event.pop(key, None)

        for key in ['state', 'firstcreated', 'versioncreated', 'ingest_provider', 'guid']:
            duplicate_event.pop(key, None)

        duplicate_event['duplicate_from'] = event_id
        duplicate_event['dates']['start'] = "2099-01-02"
        duplicate_event['dates']['end'] = "2099-01-03"
        duplicate_event['unique_id'] = 456
        duplicate_event['definition_short'] = 'duplicate'
        duplicate_event['name'] = 'duplicate'

        context.text = json.dumps(duplicate_event)
        item = post_data(context, '/events')
        set_placeholder(context, 'DUPLICATE_EVENT_ID', item['_id'])


@when('we set auto workflow on')
def then_set_auto_workflow(context):
    context.app.config['PLANNING_AUTO_ASSIGN_TO_WORKFLOW'] = True


@when('we set PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS')
def then_set_xmp_mapping(context):
    ABS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
    BEHAVE_TESTS_FIXTURES_PATH = ABS_PATH + '/steps/fixtures'
    context.app.settings['BEHAVE_TESTS_FIXTURES_PATH'] = BEHAVE_TESTS_FIXTURES_PATH
    context.app.config['PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS'] = True


@when('we set PLANNING_XMP_ASSIGNMENT_MAPPING')
def then_set_xmp_mapping(context):
    ABS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
    BEHAVE_TESTS_FIXTURES_PATH = ABS_PATH + '/steps/fixtures'
    context.app.settings['BEHAVE_TESTS_FIXTURES_PATH'] = BEHAVE_TESTS_FIXTURES_PATH
    context.app.config['PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS'] = True
    context.app.config['PLANNING_XMP_ASSIGNMENT_MAPPING'] = {
        'xpath': '//x:xmpmeta/rdf:RDF/rdf:Description',
        'namespaces': {
            'x': 'adobe:ns:meta/',
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'photoshop': 'http://ns.adobe.com/photoshop/1.0/'
        },
        'atribute_key': '{http://ns.adobe.com/photoshop/1.0/}TransmissionReference'
    }


@when('we set PLANNING_XMP_SLUGLINE_MAPPING')
def then_set_xmp_mapping(context):
    ABS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
    BEHAVE_TESTS_FIXTURES_PATH = ABS_PATH + '/steps/fixtures'
    context.app.settings['BEHAVE_TESTS_FIXTURES_PATH'] = BEHAVE_TESTS_FIXTURES_PATH
    context.app.config['PLANNING_USE_XMP_FOR_PIC_SLUGLINE'] = True
    context.app.config['PLANNING_XMP_SLUGLINE_MAPPING'] = {
        'xpath': '//x:xmpmeta/rdf:RDF/rdf:Description/dc:title/rdf:Alt/rdf:li',
        'namespaces': {
            'x': 'adobe:ns:meta/',
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'photoshop': 'http://ns.adobe.com/photoshop/1.0/',
            'dc': 'http://purl.org/dc/elements/1.1/',
        }
    }


@when('we set PLANNING_USE_XMP_FOR_PIC_SLUGLINE')
def then_set_xmp_mapping(context):
    ABS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
    BEHAVE_TESTS_FIXTURES_PATH = ABS_PATH + '/steps/fixtures'
    context.app.settings['BEHAVE_TESTS_FIXTURES_PATH'] = BEHAVE_TESTS_FIXTURES_PATH
    context.app.config['PLANNING_USE_XMP_FOR_PIC_SLUGLINE'] = True


@then('we have string {check_string} in media stream')
def step_impl_then_get_media_stream(context, check_string):
    assert_200(context.response)
    data = get_json_data(context.response)
    url = '/upload-raw/%s' % data['filemeta']['media_id']
    headers = [('Content - Type', 'application / octet - stream')]
    headers = unique_headers(headers, context.headers)
    response = context.client.get(get_prefixed_url(context.app, url), headers=headers)
    assert_200(response)
    assert len(response.get_data()), response
    check_string = apply_placeholders(context, check_string)
    assert check_string in str(response.stream.response.data)


@then('we get the following order')
def step_impl_then_get_response_order(context):
    assert_200(context.response)
    response_data = (get_json_data(context.response) or {}).get('_items')
    ids = [
        item['_id']
        for item in response_data
    ]
    expected_order = json.loads(context.text)

    assert ids == expected_order, '{} != {}'.format(','.join(ids), ','.join(expected_order))
