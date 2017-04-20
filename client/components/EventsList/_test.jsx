import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'
import { EventsListContainer } from '../../containers'
import { EventsList, EventItem } from '../index'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import { createTestStore } from '../../utils'

const events = {
    '5800d71930627218866f1e80': {
        _id: '5800d71930627218866f1e80',
        dates: { start: '2016-10-15T13:01:11+0000' },
        definition_short: 'definition_short 1',
        location: [{ name: 'location1' }],
        name: 'name1',
        files: [{}, {}],
    },
    '5800d73230627218866f1e82': {
        _id: '5800d73230627218866f1e82',
        dates: {
            end: '2016-10-19T13:01:50+0000',
            start: '2016-10-17T13:01:34+0000',
        },
        definition_short: '',
        location: [{ name: 'location1' }],
        name: 'name2',
    },
    '5800d73230627218866f1d82': {
        _id: '5800d73230627218866f1d82',
        dates: {
            end: '2016-10-19T13:01:50+0000',
            start: '2016-10-17T13:01:34+0000',
        },
        definition_short: '',
        location: [{ name: 'location2' }],
        name: 'name3',
    },
}

describe('<EventsList />', () => {
    it('renders events', () => {
        const initialState = {
            events: {
                events: events,
                eventsInList: Object.keys(events),
                search: {},
            },
            planning: {
                plannings: {
                    planning1: {
                        _id: 'planning1',
                        event_item: '5800d71930627218866f1e80',
                    },
                },
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <EventsListContainer />
            </Provider>
        )
        // there is three events to show
        expect(wrapper.find('.ListItem').length).toEqual(3)
        // only two groups, because two share the same date
        expect(wrapper.find('.events-list__list').length).toEqual(2)
        // check order
        expect(wrapper.find('.events-list__title').map((e) => e.text()))
        .toEqual(['Saturday October 15, 2016', 'Monday October 17, 2016'])
        // check classes
        expect(wrapper.find('.ListItem').first().hasClass('event--has-planning')).toBe(true)
        expect(wrapper.find('.ListItem').last().hasClass('event--has-planning')).toBe(false)
        // add a new item
        const newEvent = {
            _id: '123',
            dates: {
                end: '2016-11-19T13:01:50+0000',
                start: '2016-10-17T13:01:34+0000',
            },
            definition_short: '',
            location: [{ name: 'location3' }],
            name: 'name4',
        }
        store.dispatch(actions.receiveEvents([newEvent]))
        store.dispatch(actions.addToEventsList([newEvent._id]))
        expect(wrapper.find('.ListItem').length).toEqual(4)
        // update an item
        const updatedEvent = {
            ...newEvent,
            name: 'new name',
        }
        store.dispatch(actions.receiveEvents([updatedEvent]))
        expect(wrapper.find('.ListItem').length).toEqual(4)
        expect(
            wrapper.find('.sd-list-item__row span').last().text())
        .toContain('location3')
        // check attached file count
        expect(
            wrapper.find('.ListItem').first().find('[className="icon-file"]').length
        ).toBe(1)
        expect(
            wrapper.find('.ListItem').first().find('[className="icon-link"]').length
        ).toBe(0)
    })
    it('trigger an event click', () => {
        const onButtonClick = sinon.spy()
        const eventList = Object.keys(events).map((eid) => events[eid])
        const wrapper = shallow(<EventsList events={eventList} onEventClick={onButtonClick} />)
        // simulate a click
        wrapper.find(EventItem).first().simulate('click')
        expect(onButtonClick.calledOnce).toBe(true)
    })
})
