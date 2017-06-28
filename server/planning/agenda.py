# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning - Agenda"""

import re
import superdesk
from superdesk import get_resource_service
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from apps.archive.common import set_original_creator, get_user
from superdesk.errors import SuperdeskApiError
from superdesk.users.services import current_user_has_privilege
from superdesk.notification import push_notification
from .planning import planning_schema
from eve.utils import config


class AgendaService(superdesk.Service):
    """Service class for the Agenda model"""

    def on_create(self, docs):
        """Set default metadata"""
        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            doc['planning_type'] = 'agenda'
            set_original_creator(doc)
            self._validate_unique_agenda(doc, {})

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'agenda:created',
                item=str(doc[config.ID_FIELD]),
                user=str(doc.get('original_creator', ''))
            )

    def on_update(self, updates, original):
        if 'name' in updates and not current_user_has_privilege('planning_agenda_management'):
            raise SuperdeskApiError.forbiddenError('Insufficient privileges to update agenda.')

        user = get_user()
        if user and user.get(config.ID_FIELD):
            updates['version_creator'] = user[config.ID_FIELD]

        self._validate_unique_agenda(updates, original)

    def on_updated(self, updates, original):
        push_notification(
            'agenda:updated',
            item=str(original[config.ID_FIELD]),
            user=str(updates.get('version_creator', ''))
        )

    def on_deleted(self, doc):
        # Make sure to remove the associated plannings from this agenda
        if 'planning_items' in doc:
            planning_service = get_resource_service('planning')
            planning_service.delete({'_id': {'$in': doc['planning_items']}})

    def _validate_unique_agenda(self, updates, original):
        """Validate unique name for agenda

        :param dict updates:
        :param dict original:
        :raises SuperdeskApiError.badRequestError: If Agenda name is not unique
        """
        name = updates.get('name', original.get('name'))
        if name:
            query = {
                'planning_type': 'agenda',
                'name': re.compile('^{}$'.format(re.escape(name.strip())), re.IGNORECASE)
            }

            if original:
                query[superdesk.config.ID_FIELD] = {'$ne': original.get(superdesk.config.ID_FIELD)}

            cursor = self.get_from_mongo(req=None, lookup=query)
            if cursor.count():
                raise SuperdeskApiError.badRequestError(message='Agenda with name {} already exists.'.format(name),
                                                        payload={'name': {'unique': 1}})


class AgendaResource(superdesk.Resource):
    url = 'agenda'
    schema = planning_schema
    datasource = {
        'source': 'planning',
        'search_backend': 'elastic',
        'elastic_filter': {'term': {'planning_type': 'agenda'}}
    }

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT']
    public_methods = ['GET']

    # PATCH is set to `planning` so that planning_items may be updated when adding new planning items
    # This check is done in the on_update method of the service
    privileges = {
        'POST': 'planning_agenda_management',
        'PATCH': 'planning'
    }
