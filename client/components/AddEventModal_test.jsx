import React from 'react';
import { mount } from 'enzyme';
import { AddEventModal } from './index';

const event = {
    _id: '5800d71930627218866f1e80',
    event_details: {
        dates: { start: '2016-10-15T13:01:11+0000', ends: '2016-10-15T13:01:11+0000' },
        description: { definition_short: 'definition_short 1' },
        location: [{ name: 'location1' }]
    },
    unique_name: 'name1'
};

describe('<AddEventModal />', () => {
    fit('open the modal', () => {
        let wrapper;
        wrapper = mount(<AddEventModal show={false} />);
        expect(wrapper.state('canSubmit')).toBe(false);
        // modal open with no given event
        wrapper = mount(<AddEventModal show={true} />);
        expect(wrapper.state('canSubmit')).toBe(false);
        // modal open with a given event
        wrapper = mount(<AddEventModal show={event} />);
        expect(wrapper.state('canSubmit')).toBe(true);
    });
});
