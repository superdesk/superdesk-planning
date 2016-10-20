import React from 'react';
import { mount } from 'enzyme';
import { AddEventForm } from '../index';

const event = {
    _id: '5800d71930627218866f1e80',
    event_details: {
        dates: { start: '2016-10-15T13:01:11+0000' },
        description: { definition_short: 'definition_short 1' },
        location: [{ name: 'location1' }]
    },
    unique_name: 'name1'
};

describe('<AddEventForm />', () => {
    it('fill the form', () => {
        let wrapper = mount(<AddEventForm event={event} />);
        let nameField = wrapper.find('input').get(0);
        expect(nameField.getAttribute('value')).toBe('name1');
    });
});
