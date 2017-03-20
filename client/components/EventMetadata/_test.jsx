import React from 'react'
import { mount } from 'enzyme'
import { EventMetadata } from '../index'

describe('<EventMetadata />', () => {
    it('renders an event', () => {
        const event = {
            dates: { start: '2016-10-15T13:01:11+0000' },
            definition_short: 'definition_short 1',
            definition_long: 'definition_long 1',
            location: [{ name: 'location1' }],
            name: 'name1',
        }
        const wrapper = mount(<EventMetadata event={event}/>)
        expect(wrapper.text()).toContain('definition_short 1')
        expect(wrapper.text()).toContain('definition_long 1')
        expect(wrapper.text()).toContain('name1')
        expect(wrapper.text()).toContain('location1')
        expect(wrapper.text()).not.toContain('Status')
    })
})
