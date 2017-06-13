import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import MultiEventsSelectionActions from './index'
import React from 'react'

describe('MultiEventsSelectionActions', () => {
    it('render', () => {
        const initialState = {
            events: {
                events: {
                    1: {},
                    2: {},
                },
                eventsInList: [1, 2],
                selectedEvents: [],
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
                <MultiEventsSelectionActions store={store}/>
        )
        wrapper.find('MultiEventsSelectionActions').props().selectAll()
        expect(store.getState().events.selectedEvents).toEqual(initialState.events.eventsInList)
        wrapper.find('MultiEventsSelectionActions').props().deselect()
        expect(store.getState().events.selectedEvents).toEqual([])
        wrapper.find('MultiEventsSelectionActions').props().spike()
        wrapper.find('MultiEventsSelectionActions').props().createPlanning()
    })
})
