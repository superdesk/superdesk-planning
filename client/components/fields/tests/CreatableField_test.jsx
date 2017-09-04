import React from 'react'
import { mount } from 'enzyme'
import { IngestProviderField } from '../index'
import { createTestStore } from '../../../utils'
import { Provider } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

const renderComponentField = (component) => (
    () => (
        <Field name="field_name"
               component={component}/>
    )
)

describe('<CreatableField />', () => {
    it('IngestProviderField', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(IngestProviderField))
        const initialState = {
            ingest: {
                providers: [{
                    name: 'provider1',
                    id: 'provider1',
                }],
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('Select').props().onChange([{
            name: 'lab',
            value: { name: 'lab' },
        }])
        expect(wrapper.find('Select').props().value[0].label).toEqual('lab')
        expect(wrapper.find('Select').props().options[0].label).toEqual('provider1')
    })
})
