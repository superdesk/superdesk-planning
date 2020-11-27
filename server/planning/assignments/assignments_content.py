# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Creates content based on the assignment"""

from copy import deepcopy

from eve.utils import config
from flask import request

from superdesk import get_resource_service, Resource, Service
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow
from superdesk.metadata.item import get_schema

from apps.archive.common import BYLINE
from apps.auth import get_user_id, get_user
from apps.templates.content_templates import get_item_from_template

from planning.planning_article_export import get_desk_template
from planning.common import ASSIGNMENT_WORKFLOW_STATE, get_coverage_type_name, get_next_assignment_status,\
    get_coverage_for_assignment, get_archive_items_for_assignment
from planning.planning_notifications import PlanningNotifications
from planning.archive import create_item_from_template


FIELDS_TO_COPY = ('anpa_category', 'subject', 'urgency', 'place')
FIELDS_TO_OVERRIDE = [
    'urgency',
    'slugline',
    'ednote',
    'abstract',
    'headline',
    'ednote',
    'language',
]


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
    language = planning_data.get('language')

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

            if not item.get('flags'):
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

    # Apply the language after stripping non-content-profile fields
    # as the language field may not be in the content-profile
    if language:
        item['language'] = language

    return item


class AssignmentsContentService(Service):

    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs, **kwargs):
        ids = []
        archive_service = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            item = get_item_from_assignment(assignment, doc.pop('template_name', None))
            item[config.VERSION] = 1
            item.setdefault('type', 'text')
            item['assignment_id'] = assignment[config.ID_FIELD]

            if assignment.get('scheduled_update_id'):
                # get the latest archive item to be updated
                archive_item = self.get_latest_news_item_for_coverage(assignment)

                if not archive_item:
                    raise SuperdeskApiError.badRequestError('Archive item not found to create a rewrite.')

                # create a rewrite
                request.view_args['original_id'] = archive_item.get(config.ID_FIELD)
                ids = get_resource_service('archive_rewrite').post([{'desk_id': str(item.get('task').get('desk'))}])
                item = archive_service.find_one(_id=ids[0], req=None)
                item['task']['user'] = get_user_id()

                # link the rewrite
                get_resource_service('assignments_link').post([{
                    'assignment_id': assignment[config.ID_FIELD],
                    'item_id': ids[0],
                    'reassign': True
                }])
            else:
                # create content
                item = create_item_from_template(item, FIELDS_TO_OVERRIDE)

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

            if not assignment.get('scheduled_update_id'):
                # set the assignment to in progress
                assignments_service.patch(assignment[config.ID_FIELD], updates)
                assignments_service.publish_planning(assignment['planning_item'])

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

        return ids

    def get_latest_news_item_for_coverage(self, assignment):
        coverage = get_coverage_for_assignment(assignment)
        previous_items = []

        assignment_id = (coverage.get('assigned_to') or {}).get('assignment_id')
        if len(coverage.get('scheduled_updates')) == 0:
            previous_items = get_archive_items_for_assignment(assignment_id)
        else:
            previous_items = get_archive_items_for_assignment(assignment_id)
            for s in coverage.get('scheduled_updates'):
                new_items = get_archive_items_for_assignment((s.get('assigned_to') or {}).get('assignment_id'))
                if len(new_items) > 0:
                    previous_items = new_items

        if len(previous_items) > 0:
            return previous_items[0]

        return None

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

        # Handle schedule_updates validation
        if assignment.get('scheduled_update_id'):
            # Make sure all previous content is linked
            coverage = get_coverage_for_assignment(assignment)

            allowed_states = [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENT_WORKFLOW_STATE.COMPLETED]
            if (coverage.get('assigned_to') or {}).get('state') not in allowed_states:
                raise SuperdeskApiError.badRequestError('Coverage not linked to news item yet.')

            # Since scheduled_updates are cronologically indexed, check all previous scheduled_updates
            for s in coverage.get('scheduled_updates'):
                if s.get('scheduled_update_id') == assignment['scheduled_update_id']:
                    break

                if (s.get('assigned_to') or {}).get('state') not in allowed_states:
                    raise SuperdeskApiError.badRequestError('Previous scheduled update not linked to news item yet.')


class AssignmentsContentResource(Resource):
    endpoint_name = 'assignments_content'
    resource_title = endpoint_name
    url = 'assignments/content'
    schema = get_schema(versioning=True)
    schema.update({
        'assignment_id': {
            'type': 'string',
            'required': True
        },
        'template_name': {
            'type': 'string',
            'required': False
        }
    })
    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
