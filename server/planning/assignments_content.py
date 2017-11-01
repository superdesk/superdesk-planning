# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Creates content based on the assignment"""

import superdesk
from eve.utils import config
from apps.archive.common import insert_into_versions
from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template
from planning.planning_export import get_desk_template
from superdesk.errors import SuperdeskApiError
from .common import ASSIGNMENT_WORKFLOW_STATE

FIELDS_TO_COPY = ('anpa_category', 'subject', 'urgency')


def get_item_from_assignment(assignment, template=None):
    """Get the item from assignment

    :param dict assignment: Assignment document
    :param string template string: name of template to use
    :return dict: item
    """
    item = {}
    if not assignment:
        return item

    desk_id = assignment.get('assigned_to').get('desk')
    desk = superdesk.get_resource_service('desks').find_one(req=None, _id=desk_id)
    if template is not None:
        template = superdesk.get_resource_service('content_templates').find_one(req=None, template_name=template)
    else:
        template = get_desk_template(desk)
    item = get_item_from_template(template)

    slugline = (assignment.get('planning') or {}).get('slugline')

    if slugline:
        item['slugline'] = slugline

    ednote = (assignment.get('planning') or {}).get('ednote')

    planning_item = assignment.get('planning_item')
    # we now merge planning data if they are set
    if planning_item is not None:
        planning = superdesk.get_resource_service('planning').find_one(req=None, _id=planning_item)
        if planning is not None:
            for field in FIELDS_TO_COPY:
                if planning.get(field):
                    item[field] = planning[field]
            # when creating planning item from news item, we use headline for description_text
            # so we are doing the opposite here
            if planning.get('description_text'):
                item['headline'] = planning['description_text']
            elif planning.get('headline'):
                item['headline'] = planning['headline']

            if (planning.get('flags') or {}).get('marked_for_not_publication') or False:
                item['flags'] = {'marked_for_not_publication': True}

    if ednote:
        item['ednote'] = ednote

    item['task'] = {
        'desk': desk['_id'],
        'user': get_user_id(),
        'stage': desk['working_stage'],
    }

    return item


class AssignmentsContentService(superdesk.Service):

    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = superdesk.get_resource_service('archive')
        assignments_service = superdesk.get_resource_service('assignments')
        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            item = get_item_from_assignment(assignment, doc.pop('template_name', None))
            item[config.VERSION] = 1
            item.setdefault('type', 'text')
            item.setdefault('slugline', 'Planning')
            item['assignment_id'] = assignment[config.ID_FIELD]

            # create content
            ids = production.post([item])
            insert_into_versions(doc=item)

            # create delivery references
            superdesk.get_resource_service('delivery').post([{
                'item_id': item[config.ID_FIELD],
                'assignment_id': assignment[config.ID_FIELD],
                'planning_id': assignment['planning_item'],
                'coverage_id': assignment['coverage_item']
            }])

            # set the assignment to in progress
            assignments_service.patch(assignment[config.ID_FIELD],
                                      {
                                          'assigned_to': {
                                              'user': str(item.get('task').get('desk')),
                                              'desk': str(item.get('task').get('desk')),
                                              'state': ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
                                          }}
                                      )
            doc.update(item)
            ids.append(doc['_id'])
        return ids

    def _validate(self, doc):
        """Validate the doc for content creation"""
        assignment = superdesk.get_resource_service('assignments').find_one(req=None,
                                                                            _id=doc.get('assignment_id'))
        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        if assignment.get('assigned_to').get('state') != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            raise SuperdeskApiError.badRequestError('Assignment workflow started. Cannot create content.')

        delivery = superdesk.get_resource_service('delivery').find_one(req=None,
                                                                       assignment_id=assignment.get(config.ID_FIELD))
        if delivery:
            raise SuperdeskApiError.badRequestError('Content already exists for the assignment. '
                                                    'Cannot create content.')


class AssignmentsContentResource(superdesk.Resource):
    endpoint_name = 'assignments_content'
    resource_title = endpoint_name
    url = 'assignments/content'
    schema = {
        'assignment_id': {
            'type': 'string',
            'required': True
        },
        'template_name': {
            'type': 'string',
            'required': False
        }
    }
    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
