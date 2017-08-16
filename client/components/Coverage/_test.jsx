import { createTestStore } from '../../utils'
import { getTestActionStore } from '../../utils/testUtils'
import { mount } from 'enzyme'
import { Coverage } from '../index'
import React from 'react'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'

const coverage = { planning: { description_text: 'desc' } }

class CoverageForm extends React.Component {
    render() {
        return (
            <Coverage
            coverage={coverage}
            />
        )
    }
}

describe('<CoverageForm />', () => {
    let store
    let astore
    let services

    beforeEach(() => {
        astore = getTestActionStore()
        services = astore.services
        store = undefined
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
        store.getState().formsProfile = { coverage: { editor: { description_text: { enabled: true } } } }
    }

    describe('Coverage', () => {
        it('shows enabled fields', () => {
            setStore()
            const form = 'coverage'
            const FormComponent = reduxForm({ form })(CoverageForm)
            const wrapper = mount(
                <Provider store={store}>
                    <FormComponent />
                </Provider>)

            expect(wrapper.find('InputField').first().props().label).toBe('Description')
        })

        it('hides disabled fields', () => {
            setStore()
            store.getState().formsProfile.coverage.editor.description_text.enabled = false
            const form = 'coverage'
            const FormComponent = reduxForm({ form })(CoverageForm)
            const wrapper = mount(
                <Provider store={store}>
                    <FormComponent />
                </Provider>)

            expect(wrapper.find('InputField').length).toBe(0)
        })
    })
})
