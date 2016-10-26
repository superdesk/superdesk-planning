import React from 'react'
import { mount } from 'enzyme'
import { AddEventContainer } from '../index'

const event = {
    _id: '5800d71930627218866f1e80',
    dates: { start: '2016-10-15T13:01:11+0000', ends: '2016-10-15T13:01:11+0000' },
    description: { definition_short: 'definition_short 1' },
    location: [{ name: 'location1' }]
    unique_name: 'name1'
}

describe('<AddEventContainer />', () => {
    // TODO: enable the tests when the validation will be ready
    xit('open the modal', () => {
        let wrapper
        wrapper = mount(
            <AddEventContainer />
        )
        expect(wrapper.state('canSubmit')).toBe(false)
        // modal open with no given event
        wrapper = mount(<AddEventContainer show={true} />)
        expect(wrapper.state('canSubmit')).toBe(false)
        // modal open with a given event
        wrapper = mount(<AddEventContainer show={event} />)
        expect(wrapper.state('canSubmit')).toBe(true)
    })
    xit('fill the form', () => {
        let wrapper = mount(<AddEventContainer event={event} />)
        let nameField = wrapper.find('input').get(0)
        expect(nameField.getAttribute('value')).toBe('name1')
    })
})
