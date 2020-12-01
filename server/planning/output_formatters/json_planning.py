# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.publish.formatters import Formatter
import superdesk
import json
from superdesk.utils import json_serialize_datetime_objectId
from copy import deepcopy
from superdesk import get_resource_service
from planning.common import ASSIGNMENT_WORKFLOW_STATE, WORKFLOW_STATE
from superdesk.metadata.item import CONTENT_STATE
from .utils import expand_contact_info


class JsonPlanningFormatter(Formatter):
    """
    Simple json output formatter a sample output formatter for planning items
    """

    def __init__(self):
        """
        Set format type and no export or preview
        """
        self.format_type = 'json_planning'
        self.can_preview = False
        self.can_export = False

    # fields to be removed from the planning item
    remove_fields = ('lock_time', 'lock_action', 'lock_session', 'lock_user', '_etag', '_current_version',
                     'original_creator', 'version_creator', '_planning_schedule', 'files', '_updates_schedule')

    # fields to be removed from coverage
    remove_coverage_fields = ('original_creator', 'version_creator', 'assigned_to', 'flags')
    remove_coverage_planning_fields = ('contact_info', 'files', 'xmp_file')

    def can_format(self, format_type, article):
        if article.get('flags', {}).get('marked_for_not_publication', False):
            return False
        return format_type == self.format_type and article.get('type') == 'planning'

    def format(self, item, subscriber, codes=None):
        pub_seq_num = superdesk.get_resource_service('subscribers').generate_sequence_number(subscriber)
        output_item = self._format_item(item)
        return [(pub_seq_num, json.dumps(output_item, default=json_serialize_datetime_objectId))]

    def _format_item(self, item):
        """Format the item to json event"""
        output_item = deepcopy(item)
        for f in self.remove_fields:
            output_item.pop(f, None)
        for coverage in output_item.get('coverages', []):
            self._expand_coverage_contacts(coverage)

            deliveries, workflow_state = self._expand_delivery(coverage)
            if workflow_state:
                coverage['workflow_status'] = self._get_coverage_workflow_state(workflow_state)

            coverage['deliveries'] = deliveries
            for f in self.remove_coverage_fields:
                coverage.pop(f, None)

            for key in self.remove_coverage_planning_fields:
                if key in (coverage.get('planning') or {}):
                    coverage['planning'].pop(key, None)

        output_item['agendas'] = self._expand_agendas(item)
        return output_item

    def _get_coverage_workflow_state(self, assignment_state):
        if assignment_state in {ASSIGNMENT_WORKFLOW_STATE.SUBMITTED, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS}:
            return WORKFLOW_STATE.ACTIVE
        else:
            return assignment_state

    def _expand_agendas(self, item):
        """
        Given an item it will scan any agendas, look them up and return the expanded values, if enabled

        :param item:
        :return: Array of expanded agendas
        """
        remove_agenda_fields = {'_etag', '_type', 'original_creator', '_updated', '_created', 'is_enabled'}
        expanded = []
        for agenda in item.get('agendas', []):
            agenda_details = get_resource_service('agenda').find_one(req=None, _id=agenda)
            if agenda_details and agenda_details.get('is_enabled'):
                for f in remove_agenda_fields:
                    agenda_details.pop(f, None)
                expanded.append(agenda_details)
        return expanded

    def _expand_delivery(self, coverage):
        """Find any deliveries associated with the assignment

        :param assignment_id:
        :return:
        """
        assigned_to = coverage.pop('assigned_to', None) or {}
        coverage['coverage_provider'] = assigned_to.get('coverage_provider')
        assignment_id = assigned_to.get('assignment_id')

        if not assignment_id:
            return [], None

        assignment = superdesk.get_resource_service('assignments').find_one(req=None, _id=assignment_id)
        if not assignment:
            return [], None

        if assignment.get('assigned_to').get('state') not in [ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
                                                              ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS]:
            return [], assignment.get('assigned_to').get('state')

        delivery_service = get_resource_service('delivery')
        remove_fields = ('coverage_id', 'planning_id', '_created', '_updated', 'assignment_id', '_etag')
        deliveries = list(delivery_service.get(req=None, lookup={'coverage_id': coverage.get('coverage_id')}))

        # Check to see if in this delivery chain, whether the item has been published at least once
        item_never_published = True
        for delivery in deliveries:
            for f in remove_fields:
                delivery.pop(f, None)
            if delivery.get('item_state') == CONTENT_STATE.PUBLISHED:
                item_never_published = False

        if item_never_published:
            deliveries = []

        return deliveries, assignment.get('assigned_to').get('state')

    def _expand_coverage_contacts(self, coverage):
        if (coverage.get('assigned_to') or {}).get('contact'):
            expanded_contacts = expand_contact_info([coverage['assigned_to']['contact']])
            if expanded_contacts:
                coverage['coverage_provider_contact_info'] = {
                    'first_name': expanded_contacts[0]['first_name'],
                    'last_name': expanded_contacts[0]['last_name']
                }

        if (coverage.get('assigned_to') or {}).get('user'):
            user = get_resource_service('users').find_one(req=None, _id=coverage['assigned_to']['user'])
            if user:
                coverage['assigned_user'] = {
                    'first_name': user.get('first_name'),
                    'last_name': user.get('last_name')
                }
