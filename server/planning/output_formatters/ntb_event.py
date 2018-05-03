
from lxml import etree
from planning.common import POST_STATE
from superdesk.publish.formatters import Formatter
from superdesk.utc import get_date, utc_to_local, utcnow


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
        ntb_id.text = self._format_id(item.get('firstcreated'))
        service = etree.SubElement(doc, 'service')
        service.text = self.SERVICE

        if item.get('pubstatus') == POST_STATE.CANCELLED:
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
        priority = etree.SubElement(doc, 'priority')
        priority.text = str(item.get('priority', self.PRIORITY))
        content = etree.SubElement(doc, 'content')
        content.text = item.get('definition_long', item.get('definition_short'))
        self._format_category(doc, item)
        self._format_subjects(doc, item)
        self._format_location(doc, item)

    def _format_subjects(self, doc, item):
        subjects = etree.SubElement(doc, 'subjects')
        for subject in item.get('subject', []):
            subject_elem = etree.SubElement(subjects, 'subject')
            subject_elem.text = subject.get('name')

    def _format_category(self, doc, item):
        category = etree.SubElement(doc, 'category')
        if item.get('anpa_category'):
            category.text = item['anpa_category'][0].get('name')

    def _format_location(self, doc, item):
        geo = etree.SubElement(doc, 'geo')
        location = etree.SubElement(doc, 'location')
        latitude = etree.SubElement(geo, 'latitude')
        longitude = etree.SubElement(geo, 'longitude')
        if item.get('location'):
            item_loc = item['location'][0]
            location.text = item_loc.get('name', '')
            if item_loc.get('location'):
                item_geo = item_loc.get('location', {})
                latitude.text = str(item_geo.get('lat', ''))
                longitude.text = str(item_geo.get('lon', ''))

    def _format_time(self, time, tz=None):
        local_time = self._get_local_time(time, tz)
        return local_time.strftime('%Y-%m-%dT%H:%M:%S')

    def _format_id(self, time):
        local_time = self._get_local_time(time)
        return 'NBRP{}_hh_00'.format(local_time.strftime('%y%m%d_%H%M%S'))

    def _get_local_time(self, time, tz=None):
        if time is None:
            time = utcnow()
        if tz is None:
            tz = self.TIMEZONE
        return utc_to_local(tz, get_date(time))
