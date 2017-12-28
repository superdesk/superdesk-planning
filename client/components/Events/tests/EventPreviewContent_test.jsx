import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {EventPreviewContent} from '../EventPreviewContent';
import {getTestActionStore} from '../../../utils/testUtils';
import {createTestStore, eventUtils} from '../../../utils';

describe('<EventPreviewContent />', () => {
    let astore = getTestActionStore();

    astore.init();

    astore.initialState.events.events.e1.definition_short = 'description';
    astore.initialState.events.events.e1.anpa_category = [{
        name: 'cat1',
        qcode: 'cat1'
    }];
    astore.initialState.events.events.e1.occur_status = {
        name: 'Planned, occurs certainly',
        qcode: 'qcode1'
    };
    astore.initialState.events.events.e1.location = [{
        name: 'location',
        formatted_address: 'address',
    }];
    astore.initialState.events.events.e1.calendars = [{
        name: 'calender1',
        qcode: 'calender1'
    }];
    astore.initialState.events.events.e1.subject = [{
        name: 'sub1',
        qcode: 'sub1'
    }];
    astore.initialState.events.events.e1.definition_long = 'long description';
    astore.initialState.events.events.e1.internal_note = 'internal note';
    astore.initialState.events.events.e1.files = [{
        filemeta: {media_id: 'file'},
        media: {
            name: 'file1.jpg',
            length: 1024
        }
    }];
    astore.initialState.events.events.e1.links = ['https://www.google.com'];
    astore.initialState.planning.plannings.p2.original_creator =
        astore.initialState.users[0];
    astore.initialState.events.showEventDetails = astore.initialState.events.events.e1;

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
        verifyDataRow(dataRows.at(3), 'Occurance Status', 'Planned, occurs certainly');
        verifyDataRow(dataRows.at(4), 'Date', dateString);
        // verifyDataRow(dataRows.at(5), 'Location', dateString)

        const eventDetails = wrapper.find('.toggle-box').first();

        eventDetails.find('.toggle-box__header').simulate('click');
        const eventDetailRows = eventDetails.find('.toggle-box__content').find('.form__row');

        verifyDataRow(eventDetailRows.at(0), 'Calendars', 'calender1');
        verifyDataRow(eventDetailRows.at(1), 'Category', 'cat1');
        verifyDataRow(eventDetailRows.at(2), 'Subject', 'sub1');
        verifyDataRow(eventDetailRows.at(3), 'Long Description', 'long description');
        verifyDataRow(eventDetailRows.at(4), 'Internal Note', 'internal note');

        const files = wrapper.find('.toggle-box').at(1);

        files.find('.toggle-box__header').simulate('click');
        const file = files.find('a').first();

        expect(file.text()).toBe('file1.jpg  (1kB)');

        const links = wrapper.find('.toggle-box').at(2);

        links.find('.toggle-box__header').simulate('click');
        const link = links.find('p').first();

        expect(link.text()).toBe('https://www.google.com');

        const relatedPlannings = wrapper.find('.toggle-box').at(3);

        relatedPlannings.find('.toggle-box__header').simulate('click');
        const relPlan = relatedPlannings.find('span').first();

        expect(relPlan.text()).toBe('Planning2 created by firstname lastname in agenda TestAgenda2');
    });
});
