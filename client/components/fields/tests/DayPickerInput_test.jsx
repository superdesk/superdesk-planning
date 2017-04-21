import React from 'react'
import { mount } from 'enzyme'
import { DayPickerInput } from '../index'
import sinon from 'sinon'
import moment from 'moment'

class TestForm extends React.Component {
    render() {
        const { value, onChange, withTime, defaultDate } = this.props
        const input = {
            value: value,
            onChange: onChange || ((x) => x),
        }
        const meta = { dispatch: () => {} }
        return (
            <DayPickerInput input={input}
            meta={meta}
            defaultDate={defaultDate}
            name="datetime"
            ref='dayPicker'
            withTime={withTime} />
        )
    }
}

TestForm.propTypes = {
    value: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
    onChange: React.PropTypes.func,
    withTime: React.PropTypes.bool,
    defaultDate: React.PropTypes.object,
}

describe('<DayPickerInput />', () => {
    it('parse the default value', () => {
        const wrapper = mount(<TestForm withTime={true} value="2013-02-08 09:30Z"/>)
        const dayPickerState = wrapper.ref('dayPicker').get(0).state
        expect(moment.utc(dayPickerState.selectedTime).format('h:mm A')).toBe('9:30 AM')
        expect(dayPickerState.selectedDate.isSame(moment('2013-02-08'))).toBe(true)
    })
    it('hide the time when needed', () => {
        var wrapper
        wrapper = mount(<TestForm withTime={false} />)
        expect(wrapper.find('.timepickerInput').length).toBe(0)
        wrapper = mount(<TestForm withTime={true} />)
        expect(wrapper.find('.timepickerInput').length).toBe(1)
    })
    it('return the right date', () => {
        // test defaultDate
        let date = moment('2013-02-08 09:30Z')
        let onChange = sinon.spy((_date) => {
            expect(_date.isSame(date)).toBe(true)
        })
        mount(<TestForm withTime={true} defaultDate={date} onChange={onChange} />)
        expect(onChange.calledOnce).toBe(true)
        // test with a value, which should be prioritary
        let prioritaryDate = moment('2014-01-01 14:00Z')
        onChange = sinon.spy((_date) => {
            expect(_date.isSame(prioritaryDate)).toBe(true)
        })
        mount(<TestForm
            withTime={true}
            defaultDate={date}
            value={prioritaryDate}
            onChange={onChange} />)
        expect(onChange.calledOnce).toBe(true)
    })
})
