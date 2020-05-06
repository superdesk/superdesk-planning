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
from jinja2 import Template, TemplateNotFound
from superdesk.errors import SuperdeskApiError
from superdesk.celery_app import celery
from planning.common import WORKFLOW_STATE, get_assignment_acceptance_email_address
from superdesk.emails import send_email
from flask import current_app as app, render_template
from flask_mail import Attachment
from apps.archive.common import get_user
from eve.utils import config

try:
    from slackclient import SlackClient
    slack_client_installed = True
except ImportError:
    slack_client_installed = False

logger = logging.getLogger(__name__)


class PlanningNotifications():
    """
    Class that wraps the mechanics of notifications from the planning module.
    """

    def notify_assignment(self, coverage_status=None, target_user=None,
                          target_desk=None, target_desk2=None, message='',
                          meta_message='', contact_id=None, **data):
        """
        Send notification to the client regarding the changes in assigment detals

        :param target_user: Single user that the message is targeted towards, or if a target_desk the user will be
        excluded from the desk message
        :param target_desk: Target the users of this desk
        :param target_desk2: Target the union of the users of this desk and the target_desk
        :param message: The message text template or name of a text template
        :param meta_message: The template message with additional information
        :param data: The parameters for the message template
        :return:
        """
        # if the coverage is in 'draft' state, no notifications
        if coverage_status == WORKFLOW_STATE.DRAFT:
            return

        # Attempt to load the template file, if that fails, just use the message
        try:
            (source, filename, uptodate) = app.jinja_loader.get_source(environment=app.jinja_env,
                                                                       template=message + '.txt')
        except TemplateNotFound:
            logger.warn('Failed to load the planning notification template {}.txt'.format(message))
            return

        if target_desk is None and target_user is not None:
            add_activity(ACTIVITY_UPDATE, can_push_notification=True, resource='assignments', msg=source,
                         notify=[target_user], **data)
        elif target_desk is not None:
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=target_desk)
            if not desk:
                logger.warn('Unable to find desk {} for notification'.format(target_desk))
                return
            members = desk.get('members', [])
            if target_desk2 is not None:
                desk = superdesk.get_resource_service('desks').find_one(req=None, _id=target_desk2)
                members = members + [x for x in desk.get('members', []) if x not in members]

            for member in members:
                if get_user() and str(member.get('user', '')) == str(get_user().get(config.ID_FIELD)):
                    continue
                add_activity(ACTIVITY_UPDATE, can_push_notification=True, resource='assignments', msg=source,
                             notify=[member.get('user')], **data)

        # determine if a Slack Bot has been configured
        if slack_client_installed and app.config.get('SLACK_BOT_TOKEN'):
            args = {'token': app.config.get('SLACK_BOT_TOKEN'), 'target_user': target_user, 'target_desk': target_desk,
                    'target_desk2': target_desk2, 'message': _get_slack_message_string(source, data)}
            self._notify_slack.apply_async(kwargs=args, serializer="eve/json")

        # send email notification to user
        if (target_user or contact_id) and not data.get('no_email', False):
            args = {
                'target_user': target_user,
                'contact_id': contact_id,
                'source': source,
                'meta_message': meta_message,
                'data': data
            }
            self._notify_email.apply_async(kwargs=args, serializer="eve/json")

    def user_update(self, updates, original):
        """
        Superdesk user has been updated

        If the update includes the Slack username then check that that user can be found in the Slack workspace

        :param updates:
        :param original:
        :return:
        """
        if slack_client_installed and app.config.get('SLACK_BOT_TOKEN'):
            # If there is a change to the slack username but not the slack user id as well we invalidate the stored
            # slack user id and try to validate the new username
            if 'slack_username' in updates and updates.get('slack_username', '') != original.get('slack_username', '') \
                    and 'slack_user_id' not in updates:
                if updates.get('slack_username', None):
                    sc = SlackClient(token=app.config['SLACK_BOT_TOKEN'])
                    slack_users = sc.api_call('users.list')
                    if slack_users.get('ok', False):
                        slack_user = next((u for u in slack_users.get('members') if
                                           u.get('name') == updates.get('slack_username', '')), False)
                        if slack_user:
                            updates['slack_user_id'] = slack_user.get('id')
                            updates['slack_username'] = slack_user.get('name')
                        else:
                            raise SuperdeskApiError.badRequestError(message='Unable to find matching Slack user')
                else:
                    updates['slack_user_id'] = None
                    updates['slack_username'] = None

    @celery.task(bind=True)
    def _notify_slack(self, token, target_user, target_desk, target_desk2, message):
        sc = _get_slack_client(token)
        if target_desk is None and target_user is not None:
            _send_to_slack_user(sc, target_user, message)
        if target_desk is not None:
            _send_to_slack_desk_channel(sc, target_desk, message)
        if target_desk2 is not None:
            _send_to_slack_desk_channel(sc, target_desk2, message)

    @celery.task(bind=True)
    def _notify_email(self, target_user, contact_id, source, meta_message, data):
        _send_user_email(target_user, contact_id, source, meta_message, data)


def _get_slack_client(token):
    return SlackClient(token=token)


def _send_to_slack_desk_channel(sc, desk_id, message):
    """
    Send the passed message to the Slack channel associated with the desk if one is configured

    :param sc:
    :param desk_id:
    :param message:
    :param data:
    :return:
    """
    desk = superdesk.get_resource_service('desks').find_one(req=None, _id=desk_id)
    channel_id = desk.get('slack_channel_name')
    if channel_id:
        response = sc.api_call('chat.postMessage', as_user=True, channel=channel_id,
                               text=message, link_names=True,)
        if not response.get('ok', False):
            logger.warn('Failure response from slack post message call {}'.format(response))
            raise Exception('Failure response from slack post message call {}'.format(response))


def _get_slack_message_string(message, data):
    """
    Render the message to a string, the user that instigated the message is appended to the message

    :param message:
    :param data:
    :return: The message with the data applied
    """
    user = get_user()
    template = Template(message)
    if data.get('omit_user', False):
        return template.render(data)
    return template.render(data) + ' by ' + user.get('display_name', 'Unknown')


def _get_email_message_string(message, meta_message, data):
    """
    Render the message to a string

    :param message:
    :param meta_message:
    :param data:
    :return: The message with the data applied
    """
    template_string = Template(message).render(data)
    try:
        template_meta_string = render_template(meta_message + '.txt', **data) if meta_message else ''
    except Exception:
        logger.exception('Failed to apply meta text template: {}'.format(meta_message))
        template_meta_string = None

    if template_meta_string:
        return template_string + '\n\n' + template_meta_string
    else:
        return template_string


def _get_email_message_html(message, meta_message, data):
    """
    Render the message to a html string

    :param message:
    :param meta_message:
    :param data:
    :return: The message with the data applied
    """
    template_string = Template(message).render(data)
    try:
        template_meta_string = render_template(meta_message + '.html', **data) if meta_message else ''
    except Exception:
        logger.exception('Failed to apply meta html template: {}'.format(meta_message))
        template_meta_string = None

    if template_meta_string:
        return template_string + '<br><br>' + template_meta_string
    else:
        return template_string


def _send_user_email(user_id, contact_id, source, meta_message, data):
    """
    Send a notification to the user email

    :param user_id:
    :param text_message:
    :param html_message:
    :return:
    """
    email_address = None

    if contact_id:
        contact = superdesk.get_resource_service('contacts').find_one(req=None, _id=contact_id)
        email_address = next(iter(contact.get('contact_email') or []), None)
        data['recepient'] = contact
    elif user_id:
        user = superdesk.get_resource_service('users').find_one(req=None, _id=user_id)
        data['recepient'] = user
        if not user:
            return

        # Check if the user has email notifications enabled
        preferences = superdesk.get_resource_service('preferences').get_user_preference(user.get('_id'))
        email_notification = preferences.get('email:notification', {}) if isinstance(preferences, dict) else {}

        if not email_notification.get('enabled', False):
            return

        email_address = user.get('email')

    if not email_address:
        return

    admins = app.config['ADMINS']

    data['subject'] = 'Superdesk assignment' + ': {}'.format(data.get('slugline') if data.get('slugline') else '')
    data['system_reciepient'] = get_assignment_acceptance_email_address()
    html_message = _get_email_message_html(source, meta_message, data)
    text_message = _get_email_message_string(source, meta_message, data)

    # Determine if there are any files attached to the event and send them as attachments
    attachments = []
    if data.get('event') and data.get('event', {}).get('files'):
        for file_id in data.get('event', {}).get('files'):
            event_file = superdesk.get_resource_service('events_files').find_one(req=None, _id=file_id)
            media = app.media.get(event_file['media'], resource='events_files')
            fp = media.read()
            attachments.append(Attachment(filename=media.name, content_type=media.content_type, data=fp))

    if data.get('assignment') and (data['assignment'].get('planning', {})).get('files'):
        for file_id in data['assignment']['planning']['files']:
            assignment_file = superdesk.get_resource_service('planning_files').find_one(req=None, _id=file_id)
            if assignment_file:
                media = app.media.get(assignment_file['media'], resource='planning_files')
                fp = media.read()
                attachments.append(Attachment(filename=media.name, content_type=media.content_type, data=fp))
            else:
                logger.error('File {} attached to assignment {} not found'.format(file_id,
                                                                                  data['assignment']['assignment_id']))

    if data.get('assignment') and (data['assignment'].get('planning', {})).get('xmp_file'):
        file_id = data['assignment']['planning']['xmp_file']
        xmp_file = superdesk.get_resource_service('planning_files').find_one(req=None, _id=file_id)
        if xmp_file:
            media = app.media.get(xmp_file['media'], resource='planning_files')
            fp = media.read()
            attachments.append(Attachment(filename=media.name, content_type=media.content_type, data=fp))
        else:
            logger.error('XMP File {} attached to assignment {} not found'.format(data['assignment']['xmp_file'],
                                                                                  data['assignment'][
                                                                                      'assignment_id']))

    send_email(subject=data['subject'],
               sender=admins[0],
               recipients=[email_address],
               text_body=text_message,
               html_body=html_message,
               attachments=attachments)


def _send_to_slack_user(sc, user_id, message):
    """
    Send the Slack message to the user identified by the user_id

    :param sc:
    :param user_id:
    :param message:
    :return:
    """
    user = superdesk.get_resource_service('users').find_one(req=None, _id=user_id)
    if not user:
        return
    # Check if the user has enabled Slack notifications
    preferences = superdesk.get_resource_service('preferences').get_user_preference(user.get('_id'))
    send_slack = preferences.get('slack:notification', {}) if isinstance(preferences, dict) else {}
    if not send_slack.get('enabled', False):
        return

    user_token = _get_slack_user_id(sc, user)
    # Need to open a direct IM channel to the target user
    if user_token:
        im = sc.api_call('conversations.open', users=user_token, return_im=True)
        if im.get('ok', False):
            sent = sc.api_call('chat.postMessage', as_user=False, channel=im.get('channel', {}).get('id'),
                               text=message, link_names=True)
            if not sent.get('ok', False):
                logger.warn('Failure response from slack post message call {}'.format(sent))
                raise Exception('Failure response from slack post message call {}'.format(sent))
        else:
            logger.warn('Failed to open IM channel to username: {}'.format(user.get('username', '')))
            raise Exception('Failed to open IM channel to username: {}'.format(user.get('username', '')))


def _get_slack_user_id(sc, user):
    """
    Attempt to derive a slack user id for the passed user

    :param sc:
    :param user:
    :return:
    """

    # See if there is a slack_user_id set for the user, simple just return it.
    user_token = user.get('slack_user_id', False)
    if user_token:
        return user_token

    # Get a list all the Slack users available in the workspace
    slack_users = sc.api_call('users.list')
    if slack_users.get('ok', False):
        # If there is a Slack username defined for the superdesk user look for that user in slack
        slack_user = next((u for u in slack_users.get('members') if u.get('name') == user.get('slack_username')),
                          False)
        if slack_user:
            # Set the slack user id for this user
            _update_user_slack_details(user, slack_user)
            return slack_user.get('id')

        # Look for a slack user with the same name as the superdesk username
        slack_user = next((u for u in slack_users.get('members') if u.get('name') == user.get('username')), False)
        if slack_user:
            _update_user_slack_details(user, slack_user)
            return slack_user.get('id')

        # Look for a slack user with the same email address
        slack_user = next(
            (u for u in slack_users.get('members') if u.get('profile', {}).get('email') == user.get('email')),
            False)
        if slack_user:
            _update_user_slack_details(user, slack_user)
            return slack_user.get('id')
    logger.warn(msg='Unable to match a slack user for : {}'.format(user.get('username')))
    return None


def _update_user_slack_details(user, slack_user):
    """
    Update the user with the details of the users slack account

    :param user:
    :param slack_user:
    :return:
    """
    slack_details = {'slack_user_id': slack_user.get('id'), 'slack_username': slack_user.get('name')}
    superdesk.get_resource_service('users').system_update(user.get('_id'), slack_details, user)
