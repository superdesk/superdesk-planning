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
        wrapper.find('.EditPlanningPanel__actions [type="reset"]').simulate('click')
        expect(store.getState().planning.editorOpened).toBe(false)
    })
    it('cancel', () => {
        const initialState = {
            planning: {
                plannings: {
                    2: {
                        _id: '2',
                        slugline: 'slug',
                        coverages: [{ _id: 'coverage1' }],
                    },
                },
                currentPlanningId: '2',
            },
            agenda: {
                agendas: [{
                    _id: '1',
                    name: 'agenda',
                }],
                currentAgendaId: '1',
            },
        }
        const store = createTestStore({ initialState: initialState })

        const wrapper = mount(
            <Provider store={store}>
                <EditPlanningPanelContainer />
            </Provider>
        )

        const saveButton = wrapper.find('button[type="submit"]').first()
        const cancelButton = wrapper.find('button[type="reset"]').first()
        const sluglineInput = wrapper.find('Field [name="slugline"]')

        // Save/Cancel buttons start out as disabled
        expect(saveButton.props().disabled).toBe(true)
        expect(cancelButton.props().disabled).toBe(false)

        // Modify the slugline and ensure the save/cancel buttons are active
        sluglineInput.simulate('change', { target: { value: 'NewSlug' } })
        expect(sluglineInput.props().value).toBe('NewSlug')
        expect(saveButton.props().disabled).toBe(false)
        expect(cancelButton.props().disabled).toBe(false)

        // Cancel the modifications and ensure the save button is disabled once again
        cancelButton.simulate('click')
        expect(store.getState().planning.editorOpened).toBe(false)
        store.dispatch(actions.openPlanningEditor(2))
        expect(sluglineInput.props().value).toBe('slug')
        expect(saveButton.props().disabled).toBe(true)
        expect(cancelButton.props().disabled).toBe(false)
    })
})
