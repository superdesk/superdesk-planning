
from lxml import etree
from planning.common import POST_STATE, WORKFLOW_STATE
from superdesk.publish.formatters import Formatter
from superdesk.utc import get_date, utc_to_local, utcnow
from superdesk import get_resource_service


DELETE_STATES = {WORKFLOW_STATE.CANCELLED, WORKFLOW_STATE.POSTPONED}


class NTBEventFormatter(Formatter):

    ENCODING = 'iso-8859-1'
    SERVICE = 'newscalendar'
    TIMEZONE = 'Europe/Oslo'
    PRIORITY = '5'

    def can_format(self, format_type, article):
        return format_type == 'ntb_event' and article.get('type') == 'event'

    def format(self, item, subscriber, codes=None):
        doc = etree.Element('document')
        self._format_doc(doc, item)
        xml = etree.tostring(doc, pretty_print=True, xml_declaration=True, encoding=self.ENCODING)
        return [{
            'published_seq_num': None,
            'formatted_item': xml.decode(self.ENCODING),
            'encoded_item': xml,
        }]

    def _format_doc(self, doc, item):
        ntb_id = etree.SubElement(doc, 'ntbId')
        ntb_id.text = self._format_id(item)
        service = etree.SubElement(doc, 'service')
        service.text = self.SERVICE

        if item.get('pubstatus') == POST_STATE.CANCELLED or item.get('state') in DELETE_STATES:
            doc.set('DeleteRequest', 'true')
            return

        published = etree.SubElement(doc, 'publiseres')
        published.text = 'True'
        title = etree.SubElement(doc, 'title')
        title.text = item.get('name')
        time = etree.SubElement(doc, 'time')
        time.text = self._format_time(item.get('versioncreated'))
        dates = item.get('dates', {})
        time_start = etree.SubElement(doc, 'timeStart')
        time_start.text = self._format_time(dates.get('start'), dates.get('tz'))
        time_end = etree.SubElement(doc, 'timeEnd')
        time_end.text = self._format_time(dates.get('end'), dates.get('tz'))
        self._format_alldayevent(doc, dates)
        priority = etree.SubElement(doc, 'priority')
        priority.text = str(item.get('priority', self.PRIORITY))
        content = etree.SubElement(doc, 'content')
        content.text = item.get('definition_short', '')
        self._format_category(doc, item)
        self._format_subjects(doc, item)
        self._format_location(doc, item)
        self._format_contactweb(doc, item)
        self._format_contact_info(doc, item)

    def _format_subjects(self, doc, item):
        subjects = etree.SubElement(doc, 'subjects')
        for subject in item.get('subject', []):
            if 'subject' in subject.get('scheme', 'subject'):
                subject_elem = etree.SubElement(subjects, 'subject')
                subject_elem.text = subject.get('name')

    def _format_category(self, doc, item):
        category = etree.SubElement(doc, 'category')
        for subject in item.get('subject', []):
            if subject.get('scheme') == 'category':
                category.text = subject.get('name')
                return

    def _format_location(self, doc, item):
        geo = etree.SubElement(doc, 'geo')
        location = etree.SubElement(doc, 'location')
        latitude = etree.SubElement(geo, 'latitude')
        longitude = etree.SubElement(geo, 'longitude')
        if item.get('location'):
            item_loc = item['location'][0]

            location_chunks = []
            location_chunks.append(item_loc.get('name', ''))
            if 'address' in item_loc:
                location_chunks.append(item_loc['address'].get('line', [''])[0])
                location_chunks.append(item_loc['address'].get('area', ''))
                location_chunks.append(item_loc['address'].get('locality', ''))
                location_chunks.append(item_loc['address'].get('postal_code', ''))
                location_chunks.append(item_loc['address'].get('country', ''))
            # join non empty chunks together
            location.text = ', '.join([chunk for chunk in location_chunks if chunk]).replace('\n', ' ')

            if item_loc.get('location'):
                item_geo = item_loc.get('location', {})
                latitude.text = str(item_geo.get('lat', ''))
                longitude.text = str(item_geo.get('lon', ''))

    def _format_time(self, time, tz=None):
        local_time = self._get_local_time(time, tz if tz else self.TIMEZONE)
        return local_time.strftime('%Y-%m-%dT%H:%M:%S')

    def _format_id(self, item):
        if item.get('duplicate_from'):
            time = item.get('_created')
        else:
            time = item.get('firstcreated')

        local_time = self._get_local_time(time)
        return 'NBRP{}_hh_00'.format(local_time.strftime('%y%m%d_%H%M%S'))

    def _format_alldayevent(self, doc, dates):
        """
        Checks if the event is all day or not and sets `alldayevent` tag.

        :param etree.Element doc: The xml document for publishing
        :param dict dates: Event dates
        """
        local_start_time = self._get_local_time(dates.get('start'), dates.get('tz'))
        local_end_time = self._get_local_time(dates.get('end'), dates.get('tz'))
        _pattern = '%H:%M'
        is_all_day_event = (local_start_time.strftime(_pattern) == '00:00' and
                            local_end_time.strftime(_pattern) == '23:59')
        alldayevent = etree.SubElement(doc, 'alldayevent')
        alldayevent.text = str(is_all_day_event)

    def _format_contactweb(self, doc, item):
        """
        Checks if event contains external links, if so, adds `contactweb` tag with only first link included.

        :param etree.Element doc: The xml document for publishing
        :param dict item: Event item
        """
        if item.get('links'):
            contactweb = etree.SubElement(doc, 'contactweb')
            contactweb.text = item.get('links')[0]

    def _get_local_time(self, time, tz=None):
        if time is None:
            time = utcnow()
        if not tz:
            tz = self.TIMEZONE
        return utc_to_local(tz, get_date(time))

    def _format_contact_info(self, doc, item):
        """
        Checks if event contains contacts/phone/email, if so, adds `contactname`, `contactphone` and `contactmail` tags

        :param etree.Element doc: The xml document for publishing
        :param item:
        """
        if len(item.get('event_contact_info', [])) > 0:
            # find first public contact
            contact_details = get_resource_service('contacts').find_one(
                req=None,
                _id={'$in': item['event_contact_info']},
                public=True
            )

            if contact_details:
                firstName = contact_details.get('first_name', '')
                lastName = contact_details.get('last_name', '')
                organisation = contact_details.get('organisation', '')

                name = firstName + lastName if firstName == '' or lastName == '' else firstName + ' ' + lastName
                name = name + organisation if name == '' or organisation == '' else name + ', ' + organisation

                if not name == '':
                    contactname = etree.SubElement(doc, 'contactname')
                    contactname.text = name

                # Remove any none public contact phone
                phones = [p for p in contact_details.get('contact_phone', []) if p.get('public')]
                if len(phones) > 0:
                    contactphone = etree.SubElement(doc, 'contactphone')
                    contactphone.text = phones[0]['number']

                if len(contact_details.get('contact_email', [])) > 0:
                    contactmail = etree.SubElement(doc, 'contactmail')
                    contactmail.text = contact_details['contact_email'][0]
