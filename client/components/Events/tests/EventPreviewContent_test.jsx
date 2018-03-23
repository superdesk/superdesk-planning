import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {EventPreviewContent} from '../EventPreviewContent';
import {getTestActionStore} from '../../../utils/testUtils';
import {createTestStore, eventUtils} from '../../../utils';

import {FileInput, LinkInput} from '../../UI/Form';

describe('<EventPreviewContent />', () => {
    let astore = getTestActionStore();

    astore.init();

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
            world_region: 'Oceania'
        }],
        anpa_category: [{
            name: 'cat1',
            qcode: 'cat1'
        }],
        occur_status: {
            name: 'Planned, occurs certainly',
            qcode: 'qcode1'
        },
        location: {
            name: 'location',
            formatted_address: 'address',
        },
        calendars: [{
            name: 'calender1',
            qcode: 'calender1'
        }],
        subject: [{
            name: 'sub1',
            qcode: 'sub1'
        }],
        files: [{
            filemeta: {media_id: 'file'},
            media: {
                name: 'file1.jpg',
                length: 1024,
                content_type: 'video/ogg'
            }
        }],
        links: ['https://www.google.com'],
    };

    astore.initialState.planning.plannings.p2.original_creator =
        astore.initialState.users[0];
    astore.initialState.main.previewId = 'e1';
    astore.initialState.main.previewType = 'event';

    const getWrapper = () => {
        const store = createTestStore({initialState: astore.initialState});

        return mount(
            <Provider store={store}>
                <EventPreviewContent />
            </Provider>
        );
    };

    const verifyDataRow = (row, label, value) => {
        expect(row.find('label').text()).toBe(label);
        expect(row.find('p').text()).toBe(value);
    };

    const dateString = eventUtils.getDateStringForEvent(astore.initialState.events.events.e1,
        'DD/MM/YYYY', 'HH:mm');

    it('renders an event with all its details', () => {
        const wrapper = getWrapper();

        expect(wrapper.find('EventPreviewContentComponent').length).toBe(1);
        const dataRows = wrapper.find('.form__row');

        verifyDataRow(dataRows.at(0), 'Slugline', 'test slugline');
        verifyDataRow(dataRows.at(1), 'Name', 'Event 1');
        verifyDataRow(dataRows.at(2), 'Description', 'description');
        verifyDataRow(dataRows.at(3), 'Occurrence Status', 'Planned, occurs certainly');
        verifyDataRow(dataRows.at(4), 'Date', dateString);

        let eventDetails = wrapper.find('.toggle-box').first();

        eventDetails.find('.toggle-box__header').simulate('click');

        const eventDetailRows = wrapper.find('.toggle-box').first()
            .find('.toggle-box__content')
            .find('.form__row');

        verifyDataRow(eventDetailRows.at(0), 'Calendars', 'calender1');
        verifyDataRow(eventDetailRows.at(1), 'Place', 'ACT');
        verifyDataRow(eventDetailRows.at(2), 'Category', 'cat1');
        verifyDataRow(eventDetailRows.at(3), 'Subject', 'sub1');
        verifyDataRow(eventDetailRows.at(4), 'Long Description', 'long description');
        verifyDataRow(eventDetailRows.at(5), 'Internal Note', 'internal note');

        let files = wrapper.find('.toggle-box').at(1);

        files.find('.toggle-box__header').simulate('click');
        files = wrapper.find('.toggle-box').at(1);

        const file = files.find(FileInput).first();
        const fileLabel = file.find('label').first();
        const fileValue = file.find('a').first();

        expect(fileLabel.text()).toBe('video/ogg (1kB)');
        expect(fileValue.text()).toBe('file1.jpg');

        let links = wrapper.find('.toggle-box').at(2);

        links.find('.toggle-box__header').simulate('click');
        links = wrapper.find('.toggle-box').at(2);

        const link = links.find(LinkInput).first();
        const linkLabel = link.find('label').first();
        const linkValue = link.find('a').first();

        expect(linkLabel.text()).toBe('www.google.com');
        expect(linkValue.text()).toBe('https://www.google.com');

        let relatedPlannings = wrapper.find('.toggle-box').at(3);

        relatedPlannings.find('.toggle-box__header').simulate('click');
        relatedPlannings = wrapper.find('.toggle-box').at(3);

        const relPlan = relatedPlannings.find('span').first();

        expect(relPlan.text()).toBe('Planning2 created by firstname lastname in agenda TestAgenda2');
    });
});
