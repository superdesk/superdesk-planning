# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import current_app

from superdesk import Service, Resource, get_backend, get_resource_service
from apps.prepopulate.app_prepopulate import get_default_user, set_logged_user


def init_app(app):
    if app.config.get('SUPERDESK_TESTING'):
        PlanningPrepopulateResource(
            PlanningPrepopulateResource.endpoint_name,
            app=app,
            service=PlanningPrepopulateService(
                PlanningPrepopulateResource.endpoint_name,
                backend=get_backend()
            )
        )


class PlanningPrepopulateResource(Resource):
    endpoint_name = url = 'planning_prepopulate'
    resource_methods = public_methods = ['POST']
    schema = {
        'resource': {
            'type': 'string',
            'required': True
        },
        'items': {
            'type': 'list',
            'schema': {
                'type': 'dict'
            }
        },
    }


class PlanningPrepopulateService(Service):
    def create(self, docs, **kwargs):
        ids = []
        user = get_default_user()
        set_logged_user(user['username'], user['password'])
        for doc in docs:
            resource = doc.get('resource')
            service = get_resource_service(doc.get('resource'))
            for item in doc.get('items') or []:
                current_app.data.mongo._mongotize(item, resource)
                ids.extend(
                    service.post([item])
                )
        return ids
