import React from 'react';
import {mount} from 'enzyme';
import {EventMetadata} from '../index';
import moment from 'moment';
import {createTestStore, eventUtils} from '../../../utils';
import {Provider} from 'react-redux';
import {Location} from '../../Location';

describe('<EventMetadata />', () => {
    it('renders metadata of an event', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T13:01:11+0000'),
                end: moment('2016-10-15T13:02:11+0000'),
            },
            definition_short: 'definition_short 1',
            location: {
                name: 'location1',
                formatted_address: 'address1',
            },
            name: 'name1',
            occur_status: {name: 'Planned, occurs certainly'},
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
        const eventDateText = eventUtils.getDateStringForEvent(event, 'DD/MM/YYYY', 'HH:mm');

        expect(metaDataTexts.length).toBe(4);
        expect(metaDataTexts.at(0).text()).toBe('name1');
        expect(metaDataTexts.at(1).text()).toBe(eventDateText);
        expect(metaDataTexts.at(2).text()).toBe('Planned, occurs certainly');
        expect(metaDataTexts.at(3).text()).toBe('definition_short 1');

        const loc = content.find(Location);

        expect(loc.at(0).text()).toBe('location1');
        expect(loc.at(1).text()).toBe('location1address1');
    });
});
