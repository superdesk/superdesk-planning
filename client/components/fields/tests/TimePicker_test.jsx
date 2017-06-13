import React, { PropTypes } from 'react'
import { mount } from 'enzyme'
import { TimePicker } from '../index'
import moment from 'moment'
import sinon from 'sinon'

class TestForm extends React.Component {
    render() {
        const { input, onChange, placeholder } = this.props
        return (
            <TimePicker value={input}
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

describe('<TimePicker />', () => {
    it('shows placeholder text for null value', () => {
        const wrapper = mount(<TestForm placeholder='Time' onChange={() => {}}/>)
        const inputField = wrapper.find('.timepickerInput__textInput')
        expect(inputField.get(0).value).toBe('')
        expect(inputField.get(0).placeholder).toBe('Time')
    })
    it('opens popup when icon-time button is clicked', () => {
        let inputTime = moment('2014-01-01T14:00')
        const wrapper = mount(<TestForm placeholder='Time' input={inputTime} onChange={() => {}}/>)
        expect(wrapper.find('.timepickerPopup').length).toBe(0)
        wrapper.find('.timepickerInput--btn').simulate('click')
        expect(wrapper.find('.timepickerPopup').length).toBe(1)
    })
    it('has correct hours and  minutes selected in the popup', () => {
        let inputTime = moment('2014-01-01T14:30')
        const wrapper = mount(<TestForm placeholder='Time' input={inputTime} onChange={() => {}}/>)
        expect(wrapper.find('.timepickerPopup').length).toBe(0)
        wrapper.find('.timepickerInput--btn').simulate('click')
        expect(wrapper.find('.timepickerPopup').length).toBe(1)
        const activeButtons = wrapper.find('.active')
        expect(activeButtons.get(0).textContent).toBe('14')
        expect(activeButtons.get(1).textContent).toBe('30')
    })
    it('shows all valid hours and minutes for selection', () => {
        const wrapper = mount(<TestForm placeholder='Time' onChange={() => {}}/>)
        expect(wrapper.find('.timepickerPopup').length).toBe(0)
        wrapper.find('.timepickerInput--btn').simulate('click')
        expect(wrapper.find('.timepickerPopup').length).toBe(1)
        const lists = wrapper.find('ul')
        expect(lists.length).toBe(2)
        const hoursList = lists.at(0)
        const minList = lists.at(1)
        expect(hoursList.children().length).toBe(24)
        expect(minList.children().length).toBe(12)  // 12 as minutes displayed are 5 minutes apart
    })
    it('can manually select hours and minutes', () => {
        const wrapper = mount(<TestForm placeholder='Time' onChange={() => {}}/>)
        wrapper.find('.timepickerInput--btn').simulate('click')
        const selectAreas = wrapper.find('ul')
        const hoursList = selectAreas.at(0)
        const minList = selectAreas.at(1)
        hoursList.childAt(14).simulate('click')
        minList.childAt(6).simulate('click')
        const activeButtons = wrapper.find('.active')
        expect(activeButtons.get(0).textContent).toBe('14')
        expect(activeButtons.get(1).textContent).toBe('30')
    })
    it('cancel will close the popup', () => {
        const wrapper = mount(<TestForm placeholder='Time' onChange={() => {}}/>)
        wrapper.find('.timepickerInput--btn').simulate('click')
        expect(wrapper.find('.timepickerPopup').length).toBe(1)
        const cancelBtn = wrapper.find('.btn--small').at(1)
        cancelBtn.simulate('click')
        expect(wrapper.find('.timepickerPopup').length).toBe(0)
    })
    it('confirm will invoke onChange function with selected hours and minutes', () => {
        let onChange = sinon.spy((_date) => {
            expect(_date.format('HH:mm')).toBe('14:30')
        })
        let inputTime = moment('2014-01-01T00:00')
        const wrapper = mount(<TestForm placeholder='Time' input={inputTime} onChange={onChange}/>)
        wrapper.find('.timepickerInput--btn').simulate('click')
        const selectAreas = wrapper.find('ul')
        const hoursList = selectAreas.at(0)
        const minList = selectAreas.at(1)
        hoursList.childAt(14).simulate('click')
        minList.childAt(6).simulate('click')
        const submitButton = wrapper.find('.btn--primary').at(0)
        submitButton.simulate('click')
        expect(onChange.calledOnce).toBe(true)
    })
})
