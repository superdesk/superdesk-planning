import React from 'react'
import { mount } from 'enzyme'
import { DayPickerInput } from '../index'
import sinon from 'sinon'
import moment from 'moment'

const TestForm = React.createClass({
    render() {
        var input = { value: '1989-12-12T13:43:00+00:00', onChange: this.props.onChange }
        return (
            <DayPickerInput input={input}
            name="datetime"
            ref='dayPicker'
            withTime={this.props.withTime} />
        )
    }
})

describe('<DayPickerInput />', () => {
    it('parse the defaultValue', () => {
        const wrapper = mount(<TestForm withTime={true} onChange={(x) => x} />)
        const dayPickerState = wrapper.ref('dayPicker').get(0).state
        expect(dayPickerState.selectedTime).toBe('1:43 PM')
        expect(dayPickerState.selectedDate.isSame(moment.utc('1989-12-12'))).toBe(true)
    })
    it('hide the time when needed', () => {
        var wrapper
        wrapper = mount(<TestForm withTime={false}  onChange={(x) => x}/>)
        expect(wrapper.find('[name="time"]').length).toBe(0)
        wrapper = mount(<TestForm withTime={true}  onChange={(x) => x}/>)
        expect(wrapper.find('[name="time"]').length).toBe(1)
    })
    it('return the right date', () => {
        const onSubmit = sinon.spy((date) => (
            expect(date.isSame('1989-12-12T13:43:00+00:00')).toBe(true)
        ))
        mount(<TestForm withTime={true} onChange={onSubmit}/>)
        expect(onSubmit.calledOnce).toBe(true)
    })
})
