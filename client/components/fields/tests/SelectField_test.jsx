import React from 'react'
import { mount } from 'enzyme'
import { OccurStatusField } from '../index'
import { createTestStore } from '../../../utils'
import { Provider } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

const renderComponentField = (component) => (
    () => (
        <Field name="field_name"
               component={component}/>
    )
)

describe('<SelectField />', () => {
    it('OccurStatusField', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(OccurStatusField))
        const initialState = {
            vocabularies: {
                eventoccurstatus: [{
                    name: 'occ',
                    label: 'occ',
                    qcode: 'qcode',
                }],
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('Select').props().onChange({
            name: 'lab',
            value: { label: 'lab' },
        })
        expect(wrapper.find('Select').props().value.label).toEqual('lab')
        expect(wrapper.find('Select').props().options[0].label).toEqual('occ')
    })
})
