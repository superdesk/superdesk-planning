import React from 'react'
import { mount } from 'enzyme'
import { reduxForm } from 'redux-form'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { RepeatEventForm, fields } from '../index'

describe('<RepeatEventForm />', () => {
    const form = 'addEvent'
    let wrapper
    let store
    beforeEach(() => {
        const FormComponent = reduxForm({ form })(RepeatEventForm)
        store = createTestStore()
        wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
    })

    it('generates interval options', () => {
        expect(wrapper.find(fields.RepeatEveryField).find('option').length).toBe(30)
    })
})
