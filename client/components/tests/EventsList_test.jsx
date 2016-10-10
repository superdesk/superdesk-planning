import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { EventsList } from '../index'

const events = [
    {
        _id: '5800d71930627218866f1e80',
        event_details: {
            dates: { start: '2016-10-15T13:01:11+0000' },
            description: { definition_short: 'definition_short 1' },
            location: [{ name: 'location1' }]
        },
        unique_name: 'name1'
    },
    {
        _id: '5800d73230627218866f1e82',
        event_details: {
            dates: {
                end: '2016-10-19T13:01:50+0000',
                start: '2016-10-17T13:01:34+0000'
            },
            description: { definition_short: '' },
            location: [{ name: 'location1' }]
        },
        unique_name: 'name2'
    },
    {
        _id: '5800d73230627218866f1d82',
        event_details: {
            dates: {
                end: '2016-10-19T13:01:50+0000',
                start: '2016-10-17T13:01:34+0000'
            },
            description: { definition_short: '' },
            location: [{ name: 'location2' }]
        },
        unique_name: 'name3'
    }
]

describe('<EventsList />', () => {
    it('renders events', () => {
        const wrapper = mount(<EventsList events={events} />)
        // there is three events to show
        expect(wrapper.find('li').length).toEqual(3)
        // only two groups, because two share the same date
        expect(wrapper.find('ul').length).toEqual(2)
        // check order
        expect(wrapper.find('.events-list__title').map((e) => e.text()))
        .toEqual(['Saturday October 15, 2016', 'Monday October 17, 2016'])
    })
    it('trigger an event click', () => {
        const onButtonClick = sinon.spy()
        const wrapper = mount(<EventsList events={events} onEventClick={onButtonClick} />)
        // simulate a click
        wrapper.find('li').first().simulate('click')
        expect(onButtonClick.calledOnce).toBe(true)
    })
})
