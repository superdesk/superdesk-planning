/* eslint-disable jasmine/no-focused-tests */
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
        location: [{
            name: 'location',
            formatted_address: 'address',
        }],
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

    // The preview follows the profile's field order and groups
    astore.initialState.forms.profiles.event = {
        ...astore.initialState.forms.profiles.event,
        editor: {
            slugline: {enabled: true, group: 'main', index: 0},
            name: {enabled: true, group: 'main', index: 1},
            definition_short: {enabled: true, group: 'main', index: 2},
            occur_status: {enabled: true, group: 'main', index: 3},
            dates: {enabled: true, group: 'main', index: 4},
            calendars: {enabled: true, group: 'main', index: 5},
            place: {enabled: true, group: 'main', index: 6},
            location: {enabled: true, group: 'main', index: 7},
            event_contact_info: {enabled: true, group: 'main', index: 8},
            files: {enabled: true, group: 'main', index: 9},
            links: {enabled: true, group: 'main', index: 10},
            anpa_category: {enabled: true, group: 'details', index: 0},
            subject: {enabled: true, group: 'details', index: 1},
            definition_long: {enabled: true, group: 'details', index: 2},
            internal_note: {enabled: true, group: 'details', index: 3},
            related_plannings: {enabled: true, group: 'related_plannings', index: 0},
            ednote: {enabled: false},
        },
        groups: {
            main: {_id: 'main', name: 'Main', index: 0},
            details: {_id: 'details', name: 'Details', index: 1, useToggleBox: true},
            related_plannings: {_id: 'related_plannings', name: 'Related Plannings', index: 2},
        },
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
        sinon.stub(timeUtils, 'localTimeZone').returns(appConfig.default_timezone);
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

        const eventDetails = wrapper.find('[data-test-id="toggle-details"]').first();

        eventDetails.find('.toggle-box__header').simulate('click');

        const eventDetailRows = wrapper.find('[data-test-id="toggle-details"]').first()
            .find('.toggle-box__content')
            .find('.form__row');

        verifyDataRow(eventDetailRows.at(0), 'ANPA Category:', 'cat1');
        verifyDataRow(eventDetailRows.at(1), 'Subjects:', 'sub1');
        verifyDataRow(eventDetailRows.at(2), 'Long Description:', 'long description');
        verifyDataRow(eventDetailRows.at(3), 'Internal Note:', 'internal note');

        expect(
            wrapper.find('.contact-info__name')
                .first()
                .text()
                .trim()
        ).toBe(`${storeContact.first_name} ${storeContact.last_name}`);

        let files = wrapper.find('[data-test-id="field-files"]').first();

        files.find('.toggle-box__header').simulate('click');
        files = wrapper.find('[data-test-id="field-files"]').first();

        const file = files.find(FileInput).first();
        const fileValue = file.find('a').first();

        expect(fileValue.text()).toContain('file1.jpg  (1kB)');

        let links = wrapper.find('[data-test-id="field-links"]').first();

        links.find('.toggle-box__header').simulate('click');
        links = wrapper.find('[data-test-id="field-links"]').first();

        const link = links.find(LinkInput).first();
        const linkLabel = link.find('label').first();
        const linkValue = link.find('a').first();

        expect(linkLabel.text()).toBe('www.google.com');
        expect(linkValue.text()).toBe('https://www.google.com');

        // The related plannings section renders at its profile group position, after the toggle groups
        const html = wrapper.html();

        expect(html.indexOf('Related Plannings')).toBeGreaterThan(html.indexOf('toggle-details'));

        let relatedPlannings = wrapper.find('.related-plannings');

        const relPlan = relatedPlannings.find('span.sd-list-item__slugline').first();

        expect(relPlan.text()).toBe('Planning2'); // expect to display slugline (i.e. Planning2)
    });
});
