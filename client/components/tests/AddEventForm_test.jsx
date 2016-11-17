import React from 'react'
import { mount, shallow } from 'enzyme'
import AddEventForm, { renderInputField, FormComponent, Component } from '../AddEventForm'
import sinon from 'sinon'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import planningApp from '../../reducers'

const event = {
    _id: '5800d71930627218866f1e80',
    dates: { start: '2016-10-15T14:30+0000', end: '2016-10-20T15:00+0000' },
    description: { definition_short: 'definition_short 1' },
    location: [{ name: 'location1' }],
    unique_name: 'name1'
}

describe('<FormComponent />', () => {
    it('submit the form', () => {
        let submitting = false
        let onSaveResponse = Promise.resolve()
        let handleSubmit = sinon.stub().returns(onSaveResponse)
        const props = {
            modalType: 'EDIT_EVENT',
            submitting: submitting,
            handleSubmit,
        }
        let subject = shallow(<Component {...props}/>)
        subject.find('form').simulate('submit')
        expect(handleSubmit.callCount).toBe(1)
    })
    it('compute right dates', () => {
        const expectDatesInStoreToBe = (expectedDates) => {
            let { start, end } = store.getState().form.addEvent.values.dates
            expect(start.isSame(expectedDates.start)).toBe(true)
            expect(end.isSame(expectedDates.end)).toBe(true)
        }

        let store = createStore(planningApp, {})
        const initialValues = event
        mount(
            <Provider store={store}>
                <AddEventForm initialValues={initialValues} />
            </Provider>
        )
        let originalDates = event.dates
        expectDatesInStoreToBe(originalDates)
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
