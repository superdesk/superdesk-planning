import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { PlanningForm } from '../index'
import React from 'react'
import { Provider } from 'react-redux'
import sinon from 'sinon'
import { cloneDeep } from 'lodash'

describe('<PlanningForm />', () => {
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

    it('removes a coverage', () => {
        const spyRemove = sinon.spy((resource, item) => {
            expect(item._id).toBe('coverage1')
            expect(spyRemove.callCount).toBe(1)
        })
        const store = createTestStore({
            initialState: cloneDeep(initialState),
            extraArguments: { apiRemove: spyRemove },
        })
        const wrapper = mount(
            <Provider store={store}>
                <PlanningForm />
            </Provider>
        )
        expect(wrapper.mount().find('CoveragesFieldArray').find('.Coverage__item').length).toBe(1)
        wrapper.find('CoveragesFieldArray').find('.Coverage__remove').simulate('click')
        expect(wrapper.mount().find('CoveragesFieldArray').find('.Coverage__item').length).toBe(0)
        wrapper.find('form').simulate('submit')
        expect(wrapper.mount().find('CoveragesFieldArray').find('.Coverage__item').length).toBe(0)
    })

    it('cancel resets the form', () => {
        const store = createTestStore({ initialState: cloneDeep(initialState) })

        const wrapper = mount(
            <Provider store={store}>
                <PlanningForm />
            </Provider>
        )

        const saveButton = wrapper.find('footer button[type="submit"]').first()
        const cancelButton = wrapper.find('footer button[type="button"]').first()
        const sluglineInput = wrapper.find('Field [name="slugline"]')

        // Save/Cancel buttons start out as disabled
        expect(saveButton.props().disabled).toBe(true)
        expect(cancelButton.props().disabled).toBe(true)

        // Modify the slugline and ensure the save/cancel buttons are active
        sluglineInput.simulate('change', { target: { value: 'NewSlug' } })
        expect(sluglineInput.props().value).toBe('NewSlug')
        expect(saveButton.props().disabled).toBe(false)
        expect(cancelButton.props().disabled).toBe(false)

        // Cancel the modifications and ensure the save/cancel buttons are disabled once again
        cancelButton.simulate('click')
        expect(sluglineInput.props().value).toBe('slug')
        expect(saveButton.props().disabled).toBe(true)
        expect(cancelButton.props().disabled).toBe(true)
    })
})
