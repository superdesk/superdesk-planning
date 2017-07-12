import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { EventsPanelContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('<EventPanelContainer />', () => {
    const eventId = '5800d71930627218866f1e80'
    const initialState = {
        events: {
            events: {
                [eventId]: {
                    _id: eventId,
                    dates: { start: '2016-10-15T13:01:11+0000' },
                    definition_short: 'definition_short 1',
                    location: [{ name: 'location1' }],
                    name: 'name1',
                },
            },
            eventsInList: [eventId],
            search: { currentSearch: {} },
            readOnly: true,
        },
        privileges: {
            planning: 1,
            planning_event_management: 1,
        },
        users: [{ _id: 'user123' }],
        session: {
            identity: { _id: 'user123' },
            sessionId: 'session123',
        },
    }
    const store = createTestStore({ initialState })
    const wrapper = mount(
        <Provider store={store}>
            <EventsPanelContainer />
        </Provider>
    )

    it('Opens event in preview mode', () => {
        store.dispatch(actions.events.ui.previewEvent(store.getState().events.events[eventId]))
        expect(store.getState().events.showEventDetails).toBe(eventId)
        expect(store.getState().events.readOnly).toBe(true)
        store.dispatch(actions.events.ui.previewEvent({ _id: eventId }))
        expect(store.getState().events.showEventDetails).toBe(eventId)
        wrapper.find('EventsPanel').props().handleBackToList()
        expect(store.getState().events.readOnly).toBe(true)
    })

    it('Opens new event event in edit mode', () => {
        store.dispatch(actions.events.ui.openEventDetails())
        expect(store.getState().events.showEventDetails).toBe(true)
        expect(store.getState().events.readOnly).toBe(false)
        wrapper.find('EventsPanel').props().handleBackToList()
        expect(store.getState().events.showEventDetails).toBe(null)
    })
})
