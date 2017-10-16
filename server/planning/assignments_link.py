# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import Resource, Service, get_resource_service
from superdesk.errors import SuperdeskApiError
from eve.utils import config


class AssignmentsLinkService(Service):
    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            item = production.find_one(req=None, _id=doc.pop('item_id'))

            production.system_update(
                item[config.ID_FIELD],
                {'assignment_id': assignment[config.ID_FIELD]},
                item
            )

            get_resource_service('delivery').post([{
                'item_id': item[config.ID_FIELD],
                'assignment_id': assignment[config.ID_FIELD],
                'planning_id': assignment['planning_item'],
                'coverage_id': assignment['coverage_item']
            }])

            doc.update(item)
            ids.append(doc[config.ID_FIELD])
        return ids

    def _validate(self, doc):
        assignment = get_resource_service('assignments').find_one(
            req=None,
            _id=doc.get('assignment_id')
        )

        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        item = get_resource_service('archive').find_one(
            req=None,
            _id=doc.get('item_id')
        )

        if not item:
            raise SuperdeskApiError.badRequestError('Content item not found.')

        delivery = get_resource_service('delivery').find_one(
            req=None,
            assignment_id=assignment.get(config.ID_FIELD)
        )

        if delivery:
            raise SuperdeskApiError.badRequestError(
                'Content already exists for the assignment. Cannot create content.'
            )


class AssignmentsLinkResource(Resource):
    endpoint_name = resource_title = 'assignments_link'
    url = 'assignments/link'
    schema = {
        'assignment_id': {
            'type': 'string',
            'required': True
        },
        'item_id': {
            'type': 'string',
            'required': True
        }
    }

    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
