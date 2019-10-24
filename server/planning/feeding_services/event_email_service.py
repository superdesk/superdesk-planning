# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import imaplib
import email
import io
import logging

from superdesk.errors import IngestEmailError, ParserError
from superdesk.io.feeding_services import FeedingService
from superdesk.upload import url_for_media
from superdesk.media.media_operations import process_file_from_stream


logger = logging.getLogger(__name__)


class EventEmailFeedingService(FeedingService):
    """
    Feeding Service class which can read the article(s) from a configured mail box.
    """

    NAME = 'event_email'
    ERRORS = [IngestEmailError.emailError().get_error_description(),
              IngestEmailError.emailLoginError().get_error_description()]

    label = 'Event email'

    fields = [
        {
            'id': 'server', 'type': 'text', 'label': 'Email Server',
            'placeholder': 'Email Server', 'required': True,
            'errors': {6003: 'Server not found.', 6002: 'Unexpected server response'}
        },
        {
            'id': 'port', 'type': 'text', 'label': 'Email Server Port',
            'placeholder': 'Email Server Port', 'required': True,
            'default': '993'
        },
        {
            'id': 'user', 'type': 'text', 'label': 'User',
            'placeholder': 'User', 'required': True
        },
        {
            'id': 'password', 'type': 'password', 'label': 'Password',
            'placeholder': 'Password', 'required': True,
            'errors': {6000: 'Authentication error.'}
        },
        {
            'id': 'mailbox', 'type': 'text', 'label': 'Mailbox',
            'placeholder': 'Mailbox', 'required': True,
            'errors': {6004: 'Authentication error.'}
        },
        {
            'id': 'formatted', 'type': 'boolean', 'label': 'Formatted Email Parser',
            'required': True
        },
        {
            'id': 'filter', 'type': 'text', 'label': 'Filter',
            'placeholder': 'Filter', 'required': True
        }
    ]

    """
    Defines the collection service to be used with this ingest feeding service.
    """
    service = 'events'

    def _update(self, provider, update):
        config = provider.get('config', {})
        server = config.get('server', '')
        port = int(config.get('port', 993))

        try:
            imap = imaplib.IMAP4_SSL(host=server, port=port)
            try:
                imap.login(config.get('user', None), config.get('password', None))
            except imaplib.IMAP4.error:
                raise IngestEmailError.emailLoginError(imaplib.IMAP4.error, provider)

            rv, data = imap.select(config.get('mailbox', None), readonly=False)
            if rv == 'OK':
                rv, data = imap.search(None, config.get('filter', '(UNSEEN)'))
                if rv == 'OK':
                    new_items = []
                    for num in data[0].split():
                        rv, data = imap.fetch(num, '(RFC822)')
                        if rv == 'OK':
                            try:
                                logger.info('Ingesting events from email')
                                parser = self.get_feed_parser(provider, data)
                                for response_part in data:
                                    if isinstance(response_part, tuple):
                                        if isinstance(response_part[1], bytes):
                                            msg = email.message_from_bytes(response_part[1])
                                        else:
                                            msg = email.message_from_string(response_part[1])
                                        # this will loop through all the available multiparts in email
                                        for part in msg.walk():
                                            # parse attached files only
                                            if part.get('Content-Disposition') is None:
                                                continue
                                            fileName = part.get_filename()
                                            if bool(fileName):
                                                attachment = part.get_payload(decode=True)
                                                content = io.BytesIO(attachment)
                                                res = process_file_from_stream(content, part.get_content_type())
                                                file_name, content_type, metadata = res
                                                logger.info('Ingesting events with {} parser'.format(
                                                    parser.__class__.__name__
                                                ))
                                                if getattr(parser, 'parse_email'):
                                                    try:
                                                        new_items.append(
                                                            parser.parse_email(content, content_type, provider)
                                                        )
                                                    except ParserError.parseMessageError:
                                                        continue
                                                else:
                                                    new_items.append(parser.parse(data, provider))
                                rv, data = imap.store(num, '+FLAGS', '\\Seen')
                            except IngestEmailError:
                                continue
                imap.close()
            imap.logout()
        except IngestEmailError:
            raise
        except Exception as ex:
            raise IngestEmailError.emailError(ex, provider)
        return new_items

    def prepare_href(self, href, mimetype=None):
        return url_for_media(href, mimetype)
