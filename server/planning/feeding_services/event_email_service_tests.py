import imaplib
from mock import Mock, patch
from planning.feeding_services.event_email_service import EventEmailFeedingService
from planning.tests import TestCase


class EventEmailFeedingServiceTestCase(TestCase):

    def setUp(self):
        super().setUp()

    @patch('planning.feeding_services.event_email_service.imaplib')
    def test_update(self, mock_imaplib):
        with self.app.app_context():

            service = EventEmailFeedingService()
            provider = {
                'feed_parser': 'ics20',
                'config': {
                    'server': 'imap.test.server',
                    'port': '993',
                    'user': 'test_user',
                    'password': 'test_pass',
                    'mailbox': 'INBOX',
                    'filter': '(UNSEEN)',
                }
            }
            mock_conn = Mock(spec=imaplib.IMAP4)
            mock_imaplib.IMAP4_SSL.return_value = mock_conn
            mock_conn.login.return_value = ('OK', [])
            mock_conn.select.return_value = ('OK', [])
            mock_conn.search.return_value = ('OK', ['(UNSEEN SUBJECT "test subject")'])
            mock_conn.fetch.return_value = ('OK', [('1 (RFC822 {858569}', 'body of the message', ')')])
            mock_conn.store.return_value = ('OK', [])
            events = list(service._update(provider, None))
            self.assertEqual(len(events), 0)
