import React from 'react'
import { mount } from 'enzyme'
import { EditPlanningPanelContainer } from '../index'
import { createStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('<EditPlanningPanelContainer />', () => {
    it('open', () => {
        let store = createStore({ testMode: true })
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
