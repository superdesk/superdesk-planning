import React from 'react';
import {mount} from 'enzyme';
import {EventMetadata} from '../index';
import moment from 'moment';
import {createTestStore, eventUtils} from '../../../utils';
import {Provider} from 'react-redux';

describe('<EventMetadata />', () => {
    it('renders metadata of an event', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T13:01:11+0000'),
                end: moment('2016-10-15T13:02:11+0000'),
                tz: moment.tz.guess(),
            },
            definition_short: 'definition_short 1',
            location: {
                name: 'location1',
                formatted_address: 'address1',
            },
            name: 'name1',
            occur_status: {
                name: 'Planned, occurs certainly',
                qcode: 'eocstat:eos5',
            },
            type: 'event',
        };
        let store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <EventMetadata event={event} />
            </Provider>
        );

        wrapper.find('.sd-collapse-box').first()
            .simulate('click');
        const content = wrapper.find('.sd-collapse-box__content');
        const metaDataTexts = content.find('p');

        const eventDateText = eventUtils.getDateStringForEvent(event, false, true, false);

        expect(metaDataTexts.length).toBe(5);
        expect(content.find('[data-test-id="field-name"] > p').text()).toBe('name1');
        expect(content.find('[data-test-id="field-dates"] > p').text()).toBe(eventDateText);
        expect(content.find('[data-test-id="field-occur_status"] > p').text()).toBe('Planned, occurs certainly');
        expect(content.find('[data-test-id="field-definition_short"] > p').text()).toBe('definition_short 1');
        expect(content.find('[data-test-id="field-event_contact_info"] > p').text()).toBe('-');
        expect(content.find('[data-test-id="field-location"] a').text()).toBe('location1address1');
    });
});
