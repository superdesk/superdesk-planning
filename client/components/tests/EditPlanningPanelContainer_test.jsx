import React from 'react'
import { mount } from 'enzyme'
import { EditPlanningPanelContainer } from '../index'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import planningApp from '../../reducers'
import * as actions from '../../actions'

describe('<EditPlanningPanelContainer />', () => {
    it('open', () => {
        // const handleClose = sinon.spy()
        let store = createStore(planningApp, {})
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
