# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.errors import SuperdeskApiError
from superdesk import Command, command, get_resource_service
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock, remove_locks
from eve.utils import config, ParsedRequest
from flask import json
from superdesk.notification import push_notification


class DeleteMarkedAssignments(Command):
    """
    Delete `Assignments` that are marked for delete  `{'_to_delete': True}`.

    Example:
    ::

        $ python manage.py planning:delete_assignments

    """

    log_msg = ''

    def run(self):
        now = utcnow()
        self.log_msg = 'Delete Marked Assignments Time: {}.'.format(now)
        logger.info('{} Starting to delete marked assignments at.'.format(self.log_msg))

        lock_name = get_lock_id('planning', 'delete_assignments')
        if not lock(lock_name, expire=610):
            logger.info('{} Delete marked assignments task is already running'.format(self.log_msg))
            return

        try:
            self._delete_marked_assignments()
        except Exception as e:
            logger.exception(e)

        unlock(lock_name)

        logger.info('{} Completed deleting marked assignments.'.format(self.log_msg))
        remove_locks()

    def _delete_marked_assignments(self):
        logger.info('{} Starting to delete marked assignments'.format(self.log_msg))
        assignments_service = get_resource_service('assignments')

        query = {
            'query': {
                'filtered': {
                    'filter': {
                        'bool': {
                            'must': {
                                'term': {'_to_delete': True}
                            },
                        }
                    }
                }
            }
        }
        req = ParsedRequest()
        req.args = {'source': json.dumps(query)}
        assignments_to_delete = assignments_service.get(req=req, lookup=None)
        failed_assignments = []
        assignments_deleted = []

        for assignment in assignments_to_delete:
            assign_id = assignment.get(config.ID_FIELD)
            try:
                assignments_service.delete_action(lookup={'_id': assign_id})
                assignments_deleted.append(
                    {
                        'id': assign_id,
                        'slugline': assignment.get('planning', {}).get('slugline'),
                        'type': assignment.get('planning', {}).get('g2_content_type')
                    }
                )
            except SuperdeskApiError as e:
                logger.exception(e)
                failed_assignments.append(assign_id)

        logger.info('{} {} Assignments deleted: {}'.format(self.log_msg,
                                                           len(assignments_deleted),
                                                           str(assignments_deleted)))

        if len(assignments_deleted) > 0:
            push_notification(
                'assignments:delete',
                items=assignments_deleted
            )

        if len(failed_assignments) > 0:
            logger.info(
                '{} {} assignments failed deletion: {}'.format(self.log_msg,
                                                               len(failed_assignments),
                                                               str(failed_assignments)))


command('planning:delete_assignments', DeleteMarkedAssignments())
