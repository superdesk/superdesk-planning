import React from 'react'
import { mount } from 'enzyme'
import { EventsListContainer } from '../index'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import { createTestStore } from '../../utils'
import moment from 'moment'
import { AutoSizer } from 'react-virtualized'

const events = {
    '5800d71930627218866f1e80': {
        _id: '5800d71930627218866f1e80',
        dates: {
            start: moment('2099-10-15T13:01:00+0000'),
            end: moment('2099-10-15T14:01:00+0000'),
        },
        definition_short: 'definition_short 1',
        location: [{ name: 'location1' }],
        name: 'name1',
        files: [{}, {}],
    },
    '5800d73230627218866f1e82': {
        _id: '5800d73230627218866f1e82',
        dates: {
            start: moment('2099-10-17T22:00:00+0000'),
            end: moment('2099-10-18T22:00:00+0000'),
            tz: 'Europe/Berlin',
        },
        definition_short: '',
        location: [{ name: 'location1' }],
        name: 'name2',
    },
    '5800d73230627218866f1d82': {
        _id: '5800d73230627218866f1d82',
        dates: {
            start: moment('2099-10-17T13:01:34+0000'),
            end: moment('2099-10-19T13:01:50+0000'),
        },
        definition_short: '',
        location: [{ name: 'location2' }],
        name: 'name3',
    },
}

describe('<EventsList />', () => {
    // Give the space to Autosizer to display the list
    beforeEach(() => (
        spyOn(AutoSizer.prototype, 'render').and.callFake(function render() {
            return (
                <div ref={this._setRef}>
                    {this.props.children({
                        width: 200,
                        height: 400,
                    })}
                </div>
            )
        })
    ))
    it('renders events', () => {
        const initialState = {
            events: {
                events: events,
                eventsInList: Object.keys(events),
                search: { currentSearch: {} },
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
        // There are 4 groups
        expect(wrapper.find('.events-list__list').length).toEqual(4)
        // check order
        expect(wrapper.find('.events-list__title').map((e) => e.text()))
        .toEqual([
            'Thursday October 15, 2099',
            'Saturday October 17, 2099',
            'Sunday October 18, 2099',
            'Monday October 19, 2099',
        ])
        // there is 6 events to show
        expect(wrapper.find('.ListItem').length).toEqual(6)
        // check classes
        expect(wrapper.find('.ListItem').first().hasClass('event--has-planning')).toBe(true)
        expect(wrapper.find('.ListItem').last().hasClass('event--has-planning')).toBe(false)
        // add a new item
        const newEvent = {
            _id: '123',
            dates: {
                start: '2099-11-17T13:01:34+0000',
                end: '2099-11-17T14:01:50+0000',
            },
            definition_short: '',
            location: [{ name: 'location3' }],
            name: 'name4',
        }
        store.dispatch(actions.receiveEvents([newEvent]))
        store.dispatch(actions.addToEventsList([newEvent._id]))
        // There are one more group
        expect(wrapper.find('.events-list__list').length).toEqual(4 + 1)
        // There is more event
        expect(wrapper.find('.ListItem').length).toEqual(6 + 1)
        // update an item
        const updatedEvent = {
            ...newEvent,
            name: 'new name',
        }
        store.dispatch(actions.receiveEvents([updatedEvent]))
        expect(wrapper.find('.ListItem').length).toEqual(6 + 1)
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
})
