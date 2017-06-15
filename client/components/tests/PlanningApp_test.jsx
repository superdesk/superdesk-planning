import React from 'react'
import { mount } from 'enzyme'
import { PlanningApp } from '../PlanningApp'
import { Provider } from 'react-redux'
import { createTestStore } from '../../utils'
import * as actions from '../../actions'

describe('<PlanningApp />', () => {
    it('render Planning App', () => {
        const initialState = {
            events: {
                events: {},
                eventsInList: [],
                search: { currentSearch: {} },
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <PlanningApp />
            </Provider>
        )
        expect(wrapper.find('.Planning').length).toBe(1)
        store.dispatch(actions.toggleEventsList())
        expect(wrapper.find('.Planning--hide-events').length).toBe(0)
        store.dispatch(actions.toggleEventsList())
        expect(wrapper.find('.Planning--hide-events').length).toBe(1)
    })
})
