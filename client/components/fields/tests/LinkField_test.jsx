import React from 'react'
import { mount } from 'enzyme'
import { LinkField } from '../index'
import { createTestStore } from '../../../utils'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'

class LinkForm extends React.Component {
    render() {
        return (
            <LinkField
            fieldName='eventLink'
            link='http://www.google.com'
            />
        )
    }
}

describe('<LinkField />', () => {
    it('title is populated for link', () => {
        const form = 'addEventLink'
        const FormComponent = reduxForm({ form })(LinkForm)
        const store = createTestStore()

        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        const titleNode = wrapper.find('.line-input').last()
        expect(titleNode.text()).toBe('http://www.google.com ')
    })
})
