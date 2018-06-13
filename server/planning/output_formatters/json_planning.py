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
from planning.common import WORKFLOW_STATE
from bson.objectid import ObjectId


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
    remove_fields = ('lock_time', 'lock_action', 'lock_session', 'lock_user', '_etag', 'version_creator',
                     'original_creator', 'version_creator', 'internal_note', '_planning_schedule')

    # fields to be removed from coverage
    remove_coverage_fields = ('original_creator', 'version_creator', 'assigned_to')

    def can_format(self, format_type, article):
        if article.get('flags', {}).get('marked_for_not_publication', False):
            return False
        return format_type == self.format_type and article.get('type') == 'planning'

    def format(self, item, subscriber, codes=None):
        pub_seq_num = superdesk.get_resource_service('subscribers').generate_sequence_number(subscriber)
        output_item = deepcopy(item)
        for f in self.remove_fields:
            output_item.pop(f, None)
        # Remove any coverage items that are in draft state
        output_item['coverages'][:] = [x for x in output_item['coverages'] if
                                       WORKFLOW_STATE.DRAFT != x.get('workflow_status')]
        for coverage in output_item.get('coverages', []):
            assigned_to = self._expand_assignment(coverage.get('assigned_to', {}))
            for f in self.remove_coverage_fields:
                coverage.pop(f, None)
            coverage['assignment'] = assigned_to

        output_item['agendas'] = self._expand_agendas(item)

        return [(pub_seq_num, json.dumps(output_item, default=json_serialize_datetime_objectId))]

    def _expand_agendas(self, item):
        """
        Given an item it will scan any agendas, look them up and return the expanded values, if enabled

        :param item:
        :return: Array of expanded agendas
        """
        remove_agenda_fields = {'_etag', '_type', 'original_creator'}
        expanded = []
        for agenda in item.get('agendas', []):
            agenda_details = get_resource_service('agenda').find_one(req=None, _id=agenda)
            if agenda_details and agenda_details.get('is_enabled'):
                for f in remove_agenda_fields:
                    agenda_details.pop(f, None)
                expanded.append(agenda_details)
        return expanded

    def _expand_assignment(self, assigned_to):
        """
        Expand the assigned_to item ny looking up the assignment removing the none required fields and returning it

        :param assigned_to:
        :return:
        """
        assignment_remove_fields = ('user', 'desk', 'assignor_user', 'assignor_desk', '_etag', 'original_creator',
                                    'lock_action', 'lock_user', 'lock_time', 'lock_session', 'version_creator')
        assignment_id = assigned_to.get('assignment_id')
        assignment = superdesk.get_resource_service('assignments').find_one(req=None, _id=assignment_id)
        if assignment:
            for f in assignment_remove_fields:
                assignment.pop(f, None)
                assignment.get('assigned_to', {}).pop(f, None)
            assignment['deliveries'] = self._expand_delivery(assignment_id)
        return assignment

    def _expand_delivery(self, assignment_id):
        """
        Find any deliveries associated with the assignment

        :param assignment_id:
        :return:
        """
        delivery_service = get_resource_service('delivery')
        deliveries = list(delivery_service.get(req=None, lookup={'assignment_id': ObjectId(assignment_id)}))
        for delivery in deliveries:
            delivery.pop('_etag', None)
        return deliveries
