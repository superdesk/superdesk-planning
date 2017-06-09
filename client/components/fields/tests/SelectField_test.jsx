import React from 'react'
import { mount } from 'enzyme'
import { OccurStatusField } from '../index'
import { createTestStore } from '../../../utils'
import { Provider } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import * as actions from '../../../actions'

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
            value: { name: 'lab' },
        })
        expect(wrapper.find('Select').props().value.label).toEqual('lab')
        expect(wrapper.find('Select').props().options[0].label).toEqual('occ')
    })

    it('loads categories', (done) => {
        const store = createTestStore()
        store.dispatch(actions.loadCVocabularies()).then(() => {
            expect(store.getState().vocabularies.categories.length).toBe(2)
            done()
        })
    })
})
