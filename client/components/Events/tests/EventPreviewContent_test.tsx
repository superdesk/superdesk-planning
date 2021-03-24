import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';

import {appConfig} from 'appConfig';

import {EventPreviewContent} from '../EventPreviewContent';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore, eventUtils, timeUtils} from '../../../utils';

import {FileInput, LinkInput} from '../../UI/Form';

describe('<EventPreviewContent />', () => {
    let astore = getTestActionStore();

    astore.init();
    const storeContact = astore.initialState.contacts.contacts[0];

    astore.initialState.events.events.e1 = {
        ...astore.initialState.events.events.e1,
        definition_short: 'description',
        definition_long: 'long description',
        internal_note: 'internal note',
        place: [{
            country: 'Australia',
            group: 'Australia',
            name: 'ACT',
            qcode: 'ACT',
            state: 'Australian Capital Territory',
            world_region: 'Oceania',
        }],
        anpa_category: [{
            name: 'cat1',
            qcode: 'qcode1',
        }],
        occur_status: {
            name: 'Planned, occurs certainly',
            qcode: 'eocstat:eos5',
        },
        location: {
            name: 'location',
            formatted_address: 'address',
        },
        calendars: [{
            name: 'Sport',
            qcode: 'sport',
        }],
        subject: [{
            name: 'sub1',
            qcode: 'qcode1',
        }],
        files: ['file1'],
        links: ['https://www.google.com'],
        event_contact_info: [storeContact._id],
    };

    astore.initialState.planning.plannings.p2.original_creator =
        astore.initialState.users[0];
    astore.initialState.main.previewId = 'e1';
    astore.initialState.main.previewType = 'event';
    astore.initialState.files = {
        files: {
            file1: {
                filemeta: {media_id: 'file1'},
                media: {
                    name: 'file1.jpg',
                    length: 1024,
                    content_type: 'video/ogg',
                },
                _id: 'file1',
            },
        },
    };

    const getWrapper = () => {
        const store = createTestStore({initialState: astore.initialState});

        return mount(
            <Provider store={store}>
                <EventPreviewContent />
            </Provider>
        );
    };

    const verifyDataRow = (row, label, value = null) => {
        expect(row.find('label').text()).toBe(label);

        if (value != null) {
            expect(row.find('p').text()).toBe(value);
        }
    };

    beforeEach(() => {
        sinon.stub(timeUtils, 'localTimeZone').returns(appConfig.defaultTimezone);
    });

    afterEach(() => {
        restoreSinonStub(timeUtils.localTimeZone);
    });

    it('renders an event with all its details', () => {
        const wrapper = getWrapper();

        const dateString = eventUtils.getDateStringForEvent(
            astore.initialState.events.events.e1,
            false,
            true,
            false
        );

        expect(wrapper.find('EventPreviewContentComponent').length).toBe(1);
        const dataRows = wrapper.find('.form__row');

        verifyDataRow(dataRows.at(0), 'Slugline:', 'test slugline');
        verifyDataRow(dataRows.at(1), 'Name:', 'Event 1');
        verifyDataRow(dataRows.at(2), 'Description:', 'description');
        verifyDataRow(dataRows.at(3), 'Occurrence Status:', 'Planned, occurs certainly');
        verifyDataRow(dataRows.at(4), 'Date:', dateString);
        verifyDataRow(dataRows.at(5), 'Calendars:', 'Sport');
        verifyDataRow(dataRows.at(6), 'Places:', 'ACT');

        let eventDetails = wrapper.find('.toggle-box').first();

        eventDetails.find('.toggle-box__header').simulate('click');

        const eventDetailRows = wrapper.find('.toggle-box').first()
            .find('.toggle-box__content')
            .find('.form__row');

        verifyDataRow(eventDetailRows.at(0), 'ANPA Category:', 'cat1');
        verifyDataRow(eventDetailRows.at(1), 'Subjects:', 'sub1');
        verifyDataRow(eventDetailRows.at(2), 'Long Description:', 'long description');
        verifyDataRow(eventDetailRows.at(3), 'Internal Note:', 'internal note');

        let contacts = wrapper.find('.contact-info');

        expect(contacts.find('span').first()
            .text()).toBe(`${storeContact.first_name} ${storeContact.last_name} `);

        let files = wrapper.find('.toggle-box').at(1);

        files.find('.toggle-box__header').simulate('click');
        files = wrapper.find('.toggle-box').at(1);

        const file = files.find(FileInput).first();
        const fileValue = file.find('a').first();

        expect(fileValue.text()).toContain('file1.jpg  (1kB)');

        let links = wrapper.find('.toggle-box').at(2);

        links.find('.toggle-box__header').simulate('click');
        links = wrapper.find('.toggle-box').at(2);

        const link = links.find(LinkInput).first();
        const linkLabel = link.find('label').first();
        const linkValue = link.find('a').first();

        expect(linkLabel.text()).toBe('www.google.com');
        expect(linkValue.text()).toBe('https://www.google.com');

        let relatedPlannings = wrapper.find('.related-plannings');

        const relPlan = relatedPlannings.find('span').first();

        expect(relPlan.text()).toBe('Planning2'); // expect to display slugline (i.e. Planning2)
    });
});
