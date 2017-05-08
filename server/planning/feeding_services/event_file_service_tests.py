from mock import patch
from planning.feeding_services.event_file_service import EventFileFeedingService
from planning.tests import TestCase


os = object()
get_sorted_files = object()


class EventFileFeedingServiceTestCase(TestCase):

    def setUp(self):
        super().setUp()

    @patch('planning.feeding_services.event_file_service.os')
    @patch('planning.feeding_services.event_file_service.get_sorted_files')
    def test_update(self, mock_os, mock_get_sorted_files):
        with self.app.app_context():

            service = EventFileFeedingService()
            provider = {
                'feed_parser': 'ics20',
                'config': {
                    'path': '/test_file_drop'
                }
            }
            mock_get_sorted_files.return_value = ['file1.txt', 'file2.txt', 'file3.txt']
            mock_os.path.isfile.return_value = True

            events = list(service._update(provider, None))
            self.assertEqual(len(events), 0)
