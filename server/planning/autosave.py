# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning - Planning Autosaves"""

from superdesk import Service
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import ITEM_TYPE


class AutosaveService(Service):
    """Service class for the Autosave model."""

    def on_create(self, docs):
        for doc in docs:
            AutosaveService._validate(doc)
            doc.pop('expired', None)

    def on_delete(self, doc):
        if doc.get(ITEM_TYPE) == 'event':
            get_resource_service('events').delete_event_files(None, doc)

    @staticmethod
    def _validate(doc):
        """Validate the autosave to ensure it contains user/session"""

        if 'lock_user' not in doc:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User not supplied")

        if 'lock_session' not in doc:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User Session not supplied")

    def on_session_end(self, user_id, session_id):
        self.delete(lookup={
            'lock_user': str(user_id),
            'lock_session': str(session_id)
        })
