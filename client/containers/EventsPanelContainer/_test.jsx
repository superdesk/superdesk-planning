import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { EventsPanelContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('<EventPanelContainer />', () => {
    it('shows event details', () => {
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
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <EventsPanelContainer />
            </Provider>
        )
        store.dispatch(actions.openEventDetails(eventId))
        expect(store.getState().events.showEventDetails).toBe(eventId)
        store.dispatch(actions.openEventDetails({ _id: eventId }))
        expect(store.getState().events.showEventDetails).toBe(eventId)
        store.dispatch(actions.openEventDetails())
        expect(store.getState().events.showEventDetails).toBe(true)
        wrapper.find('EventsPanel').props().handleBackToList()
        expect(store.getState().events.showEventDetails).toBe(null)
    })
})
