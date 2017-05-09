/* eslint-disable react/no-multi-comp */
import React, { PropTypes } from 'react'
import { mount } from 'enzyme'
import { DatePicker } from '../index'
import { DatePickerCore } from  '../DatePicker/DatePickerCore'
import moment from 'moment'
import sinon from 'sinon'

class TestForm extends React.Component {
    render() {
        const { input, onChange, placeholder } = this.props
        return (
            <DatePicker
            value={input}
            onChange={onChange}
            placeholder={placeholder} />
        )
    }
}

TestForm.propTypes = {
    input: PropTypes.object,
    placeholder: PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
}

class TestFormDateCore extends React.Component {
    render() {
        const { value, onChange, onCancel } = this.props
        return (
            <DatePickerCore
            ref="datePickerCore"
            value={value}
            onChange={onChange}
            onCancel={onCancel} />
        )
    }
}

TestFormDateCore.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}

describe('<DatePicker />', () => {
    it('shows placeholder text for null value', () => {
        const wrapper = mount(<TestForm placeholder='Date' onChange={() => {}}/>)
        const inputField = wrapper.find('.datepickerInput__textInput')
        expect(inputField.get(0).value).toBe('')
        expect(inputField.get(0).placeholder).toBe('Date')
    })
    it('opens popup when icon-calender button is clicked', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        expect(wrapper.find('.datepickerPopup').length).toBe(0)
        wrapper.find('.datepickerInput--btn').simulate('click')
        expect(wrapper.find('.datepickerPopup').length).toBe(1)
    })
    it('cancel will close the popup', () => {
        const wrapper = mount(<TestForm placeholder='Date' onChange={() => {}}/>)
        wrapper.find('.datepickerInput--btn').simulate('click')
        expect(wrapper.find('.datepickerPopup').length).toBe(1)
        const cancelBtn = wrapper.find('.btn--small').at(1)
        cancelBtn.simulate('click')
        expect(wrapper.find('.datepickerPopup').length).toBe(0)
    })
    it('can change mode from day to month', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        const datePickerCoreState = wrapper.ref('datePickerCore').get(0).state
        expect(datePickerCoreState.mode).toBe('month')
    })
    it('can change mode from month to year', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        // 2 clicks take show the years
        tools.at(1).simulate('click')
        const datePickerCoreState = wrapper.ref('datePickerCore').get(0).state
        expect(datePickerCoreState.mode).toBe('year')
    })
    it('day mode has selected date active', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        const core = wrapper.find('.datepickerInput--btn')
        core.simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('8')
    })
    it('month mode has selected month active', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        const core = wrapper.find('.datepickerInput--btn')
        core.simulate('click')
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('JANUARY')
    })
    it('year mode has selected year active', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        const core = wrapper.find('.datepickerInput--btn')
        core.simulate('click')
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        // 2 clicks take show the years
        tools.at(1).simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('2014')
    })
    it('day mode displays all valid 42 days', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        // 7 dates in each row
        expect(rows.at(0).find('td').length).toBe(7)
        expect(rows.at(1).find('td').length).toBe(7)
        expect(rows.at(2).find('td').length).toBe(7)
        expect(rows.at(3).find('td').length).toBe(7)
        expect(rows.at(4).find('td').length).toBe(7)
        expect(rows.at(5).find('td').length).toBe(7)
    })
    it('month mode displays all valid 12 months', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        expect(rows.at(0).find('td').at(0).text()).toBe('JANUARY')
        expect(rows.at(0).find('td').at(1).text()).toBe('FEBRUARY')
        expect(rows.at(0).find('td').at(2).text()).toBe('MARCH')
        expect(rows.at(1).find('td').at(0).text()).toBe('APRIL')
        expect(rows.at(1).find('td').at(1).text()).toBe('MAY')
        expect(rows.at(1).find('td').at(2).text()).toBe('JUNE')
        expect(rows.at(2).find('td').at(0).text()).toBe('JULY')
        expect(rows.at(2).find('td').at(1).text()).toBe('AUGUST')
        expect(rows.at(2).find('td').at(2).text()).toBe('SEPTEMBER')
        expect(rows.at(3).find('td').at(0).text()).toBe('OCTOBER')
        expect(rows.at(3).find('td').at(1).text()).toBe('NOVEMBER')
        expect(rows.at(3).find('td').at(2).text()).toBe('DECEMBER')
    })
    it('year mode displays all valid 20 years', () => {
        const inputDate = moment('2014-01-01T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        // 2 clicks take show the years
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        expect(rows.at(0).find('td').at(0).text()).toBe('2001')
        expect(rows.at(0).find('td').at(1).text()).toBe('2002')
        expect(rows.at(0).find('td').at(2).text()).toBe('2003')
        expect(rows.at(0).find('td').at(3).text()).toBe('2004')
        expect(rows.at(0).find('td').at(4).text()).toBe('2005')
        expect(rows.at(1).find('td').at(0).text()).toBe('2006')
        expect(rows.at(1).find('td').at(1).text()).toBe('2007')
        expect(rows.at(1).find('td').at(2).text()).toBe('2008')
        expect(rows.at(1).find('td').at(3).text()).toBe('2009')
        expect(rows.at(1).find('td').at(4).text()).toBe('2010')
        expect(rows.at(2).find('td').at(0).text()).toBe('2011')
        expect(rows.at(2).find('td').at(1).text()).toBe('2012')
        expect(rows.at(2).find('td').at(2).text()).toBe('2013')
        expect(rows.at(2).find('td').at(3).text()).toBe('2014')
        expect(rows.at(2).find('td').at(4).text()).toBe('2015')
        expect(rows.at(3).find('td').at(0).text()).toBe('2016')
        expect(rows.at(3).find('td').at(1).text()).toBe('2017')
        expect(rows.at(3).find('td').at(2).text()).toBe('2018')
        expect(rows.at(3).find('td').at(3).text()).toBe('2019')
        expect(rows.at(3).find('td').at(4).text()).toBe('2020')
    })
    it('date can be manually selected', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        wrapper.find('.datepickerInput--btn').simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetDate = rows.at(1).find('td').at(5)
        expect(targetDate.at(0).text()).toBe('10')
        targetDate.childAt(0).simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('10')
    })
    it('month can be manually selected', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        wrapper.find('.datepickerInput--btn').simulate('click')
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetMon = rows.at(1).find('td').at(1)
        expect(targetMon.at(0).text()).toBe('MAY')
        targetMon.childAt(0).simulate('click')
        tools.at(1).simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('MAY')
    })
    it('year can be manually selected', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={() => {}}/>)
        wrapper.find('.datepickerInput--btn').simulate('click')
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetYr = rows.at(1).find('td').at(2)
        expect(targetYr.at(0).text()).toBe('2008')
        targetYr.childAt(0).simulate('click')
        tools.at(1).simulate('click')
        const btns = wrapper.find('.active')
        expect(btns.length).toBe(1)
        expect(btns.at(0).childAt(0).text()).toBe('2008')
    })
    it('selecting month goes to day picking mode', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetMon = rows.at(1).find('td').at(1)
        expect(targetMon.at(0).text()).toBe('MAY')
        targetMon.childAt(0).simulate('click')
        const datePickerCoreState = wrapper.ref('datePickerCore').get(0).state
        expect(datePickerCoreState.mode).toBe('day')
    })
    it('selecting year goes to month picking mode', () => {
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestFormDateCore value={inputDate} onChange={() => {}} onCancel={() => {}}/>)
        const tools = wrapper.find('.datepickerPopup__Tools').find('.btn')
        // Button to change calender mode
        tools.at(1).simulate('click')
        tools.at(1).simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetYr = rows.at(1).find('td').at(2)
        expect(targetYr.at(0).text()).toBe('2008')
        targetYr.childAt(0).simulate('click')
        const datePickerCoreState = wrapper.ref('datePickerCore').get(0).state
        expect(datePickerCoreState.mode).toBe('month')
    })
    it('confirm will invoke onChange function with selected date', () => {
        let onChange = sinon.spy((_date) => {
            expect(_date.format('DD/MM/YYYY')).toBe('10/01/2014')
        })
        const inputDate = moment('2014-01-08T14:00')
        const wrapper = mount(<TestForm placeholder='Date' input={inputDate} onChange={onChange}/>)
        wrapper.find('.datepickerInput--btn').simulate('click')
        const rows = wrapper.find('.datepickerPopup__core').find('table').find('tbody').find('tr')
        const targetDate = rows.at(1).find('td').at(5)
        expect(targetDate.at(0).text()).toBe('10')
        targetDate.childAt(0).simulate('click')
        const submitButton = wrapper.find('.btn--primary').at(0)
        submitButton.simulate('click')
        expect(onChange.calledOnce).toBe(true)
    })
})
