import React from 'react'
import { mount, shallow } from 'enzyme'
import { renderInputField, FormComponent, Component } from '../AddEventForm'
import sinon from 'sinon'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import planningApp from '../../reducers'

const event = {
    _id: '5800d71930627218866f1e80',
    dates: { start: '2016-10-15T00:00:00+0000', ends: '2016-10-16T00:00:00+0000' },
    description: { definition_short: 'definition_short 1' },
    location: [{ name: 'location1' }],
    unique_name: 'name1'
}

describe('<FormComponent />', () => {
    let subject = null
    let submitting
    let onSaveResponse
    let handleSubmit
    beforeEach(() => {
        submitting = false
        onSaveResponse = Promise.resolve()
        handleSubmit = fn => fn
    })
    const buildSubject = () => {
        handleSubmit = sinon.stub().returns(onSaveResponse)
        const props = {
            modalType: 'EDIT_EVENT',
            submitting: submitting,
            handleSubmit,
        }
        return shallow(<Component {...props}/>)
    }

    it('submit the form', () => {
        subject = buildSubject()
        subject.find('form').simulate('submit')
        expect(handleSubmit.callCount).toBe(1)
    })
    it('fill the form', () => {
        let store = createStore(planningApp, {})
        const initialValues = event
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent initialValues={initialValues} />
            </Provider>
        )
        expect(wrapper.find('[name="unique_name"]').props().value).toBe(initialValues.unique_name)
    })
})
describe('renderInputField', () => {
    it('renders an error when an input is in an error state', () => {
        const input = { name: 'uniqueName', value: '' }
        const label = 'Label'
        const meta = { touched: true, error: 'Required' }
        const element = renderInputField({ input, label, meta })
        const subject = shallow(element)
        const uniqueNameHelpBlock = subject.find('.help-block')
        expect(uniqueNameHelpBlock.length).toBe(1)
        expect(uniqueNameHelpBlock.first().text()).toBe('Required')
    })
})
