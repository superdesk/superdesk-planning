import React from 'react'
import { mount } from 'enzyme'
import { change, reduxForm } from 'redux-form'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import planningApp from '../../reducers'
import { RepeatEventForm } from '../index'
import moment from 'moment'

describe('<RepeatEventForm />', () => {
    const form = 'addEvent'
    let wrapper
    let store
    beforeEach(() => {
        const FormComponent = reduxForm({ form })(RepeatEventForm)
        store = createStore(planningApp)
        wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
    })

    it('generates interval options', () => {
        expect(wrapper.find('.interval option').length).toBe(30 + 1)
    })

    it('checks well radio btn for end of recurring dates', () => {
        const expectEventToEnd = (end) => {
            expect(wrapper.find({
                name: 'doesRepeatEnd', value: 'until'
            }).props().checked).toBe(end === 'until')
            expect(wrapper.find({
                name: 'doesRepeatEnd', value: 'count'
            }).props().checked).toBe(end === 'count')
            expect(wrapper.find({
                name: 'doesRepeatEnd', value: false
            }).props().checked).toBe(end === false)
        }
        // check intial radios states
        expectEventToEnd(false)
        // set a "until" date
        store.dispatch(change(form, 'dates.recurring_rule.until', moment()))
        // check radio buttons new state
        expectEventToEnd('until')
        // set a count value
        store.dispatch(change(form, 'dates.recurring_rule.count', 2))
        // check radio buttons new state
        expectEventToEnd('count')
    })
})
