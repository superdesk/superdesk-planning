import React from 'react'
import { mount } from 'enzyme'
import { EditPlanningPanelContainer } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('<EditPlanningPanelContainer />', () => {
    it('open the panel', () => {
        let store = createTestStore({
            initialState: {
                privileges: {
                    planning: 1,
                    planning_planning_management: 1,
                },
            },
        })
        const wrapper = mount(
            <Provider store={store}>
                <EditPlanningPanelContainer />
            </Provider>
        )
        store.dispatch(actions.openPlanningEditor())
        expect(store.getState().planning.editorOpened).toBe(true)
        wrapper.find('header .close').simulate('click')
        expect(store.getState().planning.editorOpened).toBe(false)
    })
})
