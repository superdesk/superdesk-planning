import { createTestStore } from '../../utils'
import { getTestActionStore } from '../../utils/testUtils'
import { mount } from 'enzyme'
import { Coverage } from '../index'
import React from 'react'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'

describe('<CoverageForm />', () => {
    let store
    let astore
    let data
    let services
    let coverage
    let planning

    const CoverageForm = () => <Coverage coverage={'coverages[0]'} />
    const getWrapper = () => {
        const FormComponent = reduxForm({ form: 'planning' })(CoverageForm)
        return mount(
            <Provider store={store}>
                <FormComponent initialValues={planning}/>
            </Provider>
        )
    }

    beforeEach(() => {
        astore = getTestActionStore()
        services = astore.services
        data = astore.data
        store = undefined

        planning = data.plannings[0]
        coverage = planning.coverages[0]
    })

    const setStore = () => {
        astore.init()

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            },
        })
        store.getState().formsProfile = { coverage: { editor: { ednote: { enabled: true } } } }
    }

    describe('Coverage', () => {
        it('shows enabled fields', () => {
            setStore()
            const wrapper = getWrapper()
            expect(wrapper.find('.sd-line-input__label').first().text()).toBe('Ed Note')
            expect(wrapper.find('.sd-line-input__input').length).toBe(1)
        })

        it('hides disabled fields', () => {
            setStore()
            store.getState().formsProfile.coverage.editor.ednote.enabled = false
            const wrapper = getWrapper()
            expect(wrapper.find('.sd-line-input__input').length).toBe(0)
        })

        it('enables fields if assignment is not in use', () => {
            setStore()
            store.getState().formsProfile.coverage.editor = {
                ednote: { enabled: true },
                g2_content_type: { enabled: true },
                genre: { enabled: true },
            }

            coverage.assigned_to = { state: 'assigned' }
            let wrapper = getWrapper()
            expect(wrapper.find('Field').at(1).props().readOnly).toBe(false)
            expect(wrapper.find('Field').at(2).props().readOnly).toBe(false)
            expect(wrapper.find('Field').at(3).props().readOnly).toBe(false)

            coverage.assigned_to = { state: 'in_progress' }
            wrapper = getWrapper()
            expect(wrapper.find('Field').at(1).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(2).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(3).props().readOnly).toBe(true)

            coverage.assigned_to = { state: 'completed' }
            wrapper = getWrapper()
            expect(wrapper.find('Field').at(1).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(2).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(3).props().readOnly).toBe(true)

            coverage.assigned_to = { state: 'submitted' }
            wrapper = getWrapper()
            expect(wrapper.find('Field').at(1).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(2).props().readOnly).toBe(true)
            expect(wrapper.find('Field').at(3).props().readOnly).toBe(true)

            coverage.assigned_to = { state: 'cancelled' }
            wrapper = getWrapper()
            expect(wrapper.find('Field').at(1).props().readOnly).toBe(false)
            expect(wrapper.find('Field').at(2).props().readOnly).toBe(false)
            expect(wrapper.find('Field').at(3).props().readOnly).toBe(false)
        })
    })
})
