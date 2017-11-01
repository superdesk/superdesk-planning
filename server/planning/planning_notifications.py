# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning"""
import logging
from superdesk.activity import add_activity, ACTIVITY_UPDATE
import superdesk

logger = logging.getLogger(__name__)


class PlanningNotifications():
    """
    Class that wraps the mechanics of notifications from the planning module.
    """

    def notify_assignment(self, target_user=None, target_desk=None, target_desk2=None, message='', **data):
        """
        Send notification to the client regarding the changes in assigment detals

        :param target_user: Single user that the message is targeted towards, or if a target_desk the user will be
        excluded from the desk message
        :param target_desk: Target the users of this desk
        :param target_desk2: Target the union of the users of this desk and the target_desk
        :param message: The message text template
        :param data: The parameters for the message template
        :return:
        """
        if target_desk is None and target_user is not None:
            add_activity(ACTIVITY_UPDATE, can_push_notification=True, resource='assignments', msg=message,
                         notify=[target_user], **data)
        elif target_desk is not None:
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=target_desk)
            members = desk.get('members', [])
            if target_desk2 is not None:
                desk = superdesk.get_resource_service('desks').find_one(req=None, _id=target_desk2)
                members = members + [x for x in desk.get('members', []) if x not in members]

            for member in members:
                if target_user is not None and str(member.get('user', '')) == target_user:
                    continue
                add_activity(ACTIVITY_UPDATE, can_push_notification=True, resource='assignments', msg=message,
                             notify=[member.get('user')], **data)
