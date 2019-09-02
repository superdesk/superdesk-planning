# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Creates content based on the assignment"""

import superdesk
from copy import deepcopy
from eve.utils import config
from apps.archive.common import insert_into_versions, BYLINE
from apps.auth import get_user_id, get_user
from apps.templates.content_templates import get_item_from_template
from planning.planning_article_export import get_desk_template
from superdesk.errors import SuperdeskApiError
from planning.common import ASSIGNMENT_WORKFLOW_STATE, get_coverage_type_name, get_next_assignment_status
from superdesk.utc import utcnow
from planning.planning_notifications import PlanningNotifications
from superdesk import get_resource_service


FIELDS_TO_COPY = ('anpa_category', 'subject', 'urgency', 'place')


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
    desk = get_resource_service('desks').find_one(req=None, _id=desk_id)
    if template is not None:
        template = get_resource_service('content_templates').find_one(req=None, template_name=template)
    else:
        template = get_desk_template(desk)
    item = get_item_from_template(template)

    planning_data = assignment.get('planning') or {}
    slugline = planning_data.get('slugline')

    if slugline:
        item['slugline'] = slugline

    user = get_user()
    if user and user.get(BYLINE):
        item[BYLINE] = user[BYLINE]

    ednote = planning_data.get('ednote')

    planning_item = assignment.get('planning_item')
    # we now merge planning data if they are set
    if planning_item is not None:
        planning = get_resource_service('planning').find_one(req=None, _id=planning_item)
        if planning is not None:
            for field in FIELDS_TO_COPY:
                if planning.get(field):
                    item[field] = deepcopy(planning[field])

            if assignment.get('description_text'):
                item['abstract'] = "<p>{}</p>".format(assignment['description_text'])

            if planning.get('headline'):
                item['headline'] = planning['headline']

            if not item['flags']:
                item['flags'] = {}

            item['flags']['marked_for_not_publication'] = \
                (planning.get('flags') or {}).get('marked_for_not_publication') or False

    if ednote:
        item['ednote'] = ednote

    genre = planning_data.get('genre')
    if genre:
        item['genre'] = deepcopy(genre)

    keyword = planning_data.get('keyword', [])
    if len(keyword) > 0:
        item['keywords'] = keyword

    item['task'] = {
        'desk': desk['_id'],
        'user': get_user_id(),
        'stage': desk['working_stage'],
    }

    # Load default content profile of the desk to the item
    content_profile_id = template['data'].get('profile', desk.get('default_content_profile', None))
    if content_profile_id:
        content_profiles = get_resource_service('content_types').find({'_id': content_profile_id})
        # Pop those items not in the content_profile
        if content_profiles.count() > 0:
            content_profile = content_profiles.next()
            for key in content_profile.get('schema').keys():
                if content_profile['schema'][key] is None:
                    item.pop(key, None)

    return item


class AssignmentsContentService(superdesk.Service):

    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            item = get_item_from_assignment(assignment, doc.pop('template_name', None))
            item[config.VERSION] = 1
            item.setdefault('type', 'text')
            item['assignment_id'] = assignment[config.ID_FIELD]

            # create content
            ids = production.post([item])
            insert_into_versions(doc=item)

            # create delivery references
            get_resource_service('delivery').post([{
                'item_id': item[config.ID_FIELD],
                'assignment_id': assignment[config.ID_FIELD],
                'planning_id': assignment['planning_item'],
                'coverage_id': assignment['coverage_item']
            }])

            updates = {'assigned_to': deepcopy(assignment.get('assigned_to'))}
            updates['assigned_to']['user'] = str(item.get('task').get('user'))
            updates['assigned_to']['desk'] = str(item.get('task').get('desk'))
            updates['assigned_to']['state'] = get_next_assignment_status(updates, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS)
            updates['assigned_to']['assignor_user'] = str(item.get('task').get('user'))
            updates['assigned_to']['assigned_date_user'] = utcnow()

            # set the assignment to in progress
            assignments_service.patch(assignment[config.ID_FIELD], updates)
            doc.update(item)
            ids.append(doc['_id'])

            # Send notification that the work has commenced to the user who assigned the task
            # Get the id of the user who assigned the task
            assignor = assignment.get('assigned_to', {}).get('assignor_user',
                                                             assignment.get('assigned_to', {}).get('assignor_desk'))

            if str(assignor) != str(item.get('task').get('user')):
                # Determine the display name of the assignee
                assigned_to_user = get_resource_service('users').find_one(req=None,
                                                                          _id=str(item.get('task').get('user')))
                assignee = assigned_to_user.get('display_name') if assigned_to_user else 'Unknown'
                PlanningNotifications().notify_assignment(target_desk=None,
                                                          target_user=assignor,
                                                          message='assignment_commenced_msg',
                                                          assignee=assignee,
                                                          coverage_type=get_coverage_type_name(item.get('type', '')),
                                                          slugline=item.get('slugline'),
                                                          omit_user=True,
                                                          assignment_id=assignment[config.ID_FIELD],
                                                          is_link=True,
                                                          no_email=True)
            # Save history
            get_resource_service('assignments_history').on_item_start_working(updates, assignment)
            # publishing planning item
            assignments_service.publish_planning(assignment['planning_item'])
        return ids

    def _validate(self, doc):
        """Validate the doc for content creation"""
        assignment_service = get_resource_service('assignments')
        assignment = assignment_service.find_one(req=None,
                                                 _id=doc.get('assignment_id'))
        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        assignment_service.validate_assignment_action(assignment)
        if assignment.get('assigned_to').get('state') != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            raise SuperdeskApiError.badRequestError('Assignment workflow started. Cannot create content.')

        delivery = get_resource_service('delivery').find_one(req=None,
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
