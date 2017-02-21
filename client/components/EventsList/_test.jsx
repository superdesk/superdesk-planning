import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'
import { EventsListPanelContainer } from '../../containers'
import { EventsList, EventItem } from '../index'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import { createTestStore } from '../../utils'

const events = [
    {
        _id: '5800d71930627218866f1e80',
        dates: { start: '2016-10-15T13:01:11+0000' },
        definition_short: 'definition_short 1',
        location: [{ name: 'location1' }],
        name: 'name1',
        files: [{}, {}]
    },
    {
        _id: '5800d73230627218866f1e82',
        dates: {
            end: '2016-10-19T13:01:50+0000',
            start: '2016-10-17T13:01:34+0000'
        },
        definition_short: '',
        location: [{ name: 'location1' }],
        name: 'name2'
    },
    {
        _id: '5800d73230627218866f1d82',
        dates: {
            end: '2016-10-19T13:01:50+0000',
            start: '2016-10-17T13:01:34+0000'
        },
        definition_short: '',
        location: [{ name: 'location2' }],
        name: 'name3'
    }
]

describe('<EventsList />', () => {
    it('renders events', () => {
        const initialState = {
            events: { events },
            planning: {
                plannings: {
                    planning1: { _id: 'planning1', event_item: { _id: '5800d71930627218866f1e80' }}
                }
            }
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <EventsListPanelContainer />
            </Provider>
        )
        // there is three events to show
        expect(wrapper.find('.ListItem__list-item').length).toEqual(3)
        // only two groups, because two share the same date
        expect(wrapper.find('.events-list__list').length).toEqual(2)
        // check order
        expect(wrapper.find('.events-list__title').map((e) => e.text()))
        .toEqual(['Saturday October 15, 2016', 'Monday October 17, 2016'])
        // check classes
        expect(wrapper.find('.ListItem__list-item').first().hasClass('event__has-planning')).toBe(true)
        expect(wrapper.find('.ListItem__list-item').last().hasClass('event__has-planning')).toBe(false)
        // add a new item
        const newEvent = {
            _id: '123',
            dates: {
                end: '2016-11-19T13:01:50+0000',
                start: '2016-10-17T13:01:34+0000'
            },
            definition_short: '',
            location: [{ name: 'location3' }],
            name: 'name4'
        }
        store.dispatch(actions.addEvents([newEvent]))
        expect(wrapper.find('.ListItem__list-item').length).toEqual(4)
        // update an item
        const updatedEvent = { ...newEvent, name: 'new name' }
        store.dispatch(actions.addEvents([updatedEvent]))
        expect(wrapper.find('.ListItem__list-item').length).toEqual(4)
        expect(
            wrapper.find('.ListItem__list-item').last()
            .find('.keyword').text())
        .toBe('new name')
        // check attached file count
        expect(
            wrapper.find('.ListItem__list-item').first()
            .find('.counts dd.files-attached-count').text())
        .toBe(events[0].files.length.toString())
        expect(
            wrapper.find('.ListItem__list-item').last()
            .find('.counts dd.files-attached-count').length)
        .toBe(0)
    })
    it('trigger an event click', () => {
        const onButtonClick = sinon.spy()
        const wrapper = shallow(<EventsList events={events} onEventClick={onButtonClick} onAddToAgendaClick={()=>({})} />)
        // simulate a click
        wrapper.find(EventItem).first().simulate('click')
        expect(onButtonClick.calledOnce).toBe(true)
    })
})
