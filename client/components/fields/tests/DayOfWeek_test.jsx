import React from 'react'
import { shallow } from 'enzyme'
import { DaysOfWeek } from '../index'
import sinon from 'sinon'

describe('<DaysOfWeek />', () => {

    it('generates strings with day names', () => {
        const onButtonClick = sinon.spy((s) => {
            if (onButtonClick.callCount === 3) {
                expect(s).toBe('MO WE SA')
            }
        })
        let meta = { touched: false }
        let input = {
            onChange: onButtonClick,
            value: '',
        }
        let wrapper = shallow(<DaysOfWeek input={input} meta={meta} />)
        wrapper.find({ value: 'MO' }).simulate('change', {
            target: {
                value: 'MO',
                checked: true,
            },
        })
        wrapper.find({ value: 'WE' }).simulate('change', {
            target: {
                value: 'WE',
                checked: true,
            },
        })
        wrapper.find({ value: 'SA' }).simulate('change', {
            target: {
                value: 'SA',
                checked: true,
            },
        })
        expect(onButtonClick.callCount).toBe(3)
    })
    it('works well with initial value', () => {
        let meta = { touched: false }
        let input = {
            onChange: sinon.spy((s) => {
                expect(s).toBe('MO TU SA SU')
            }),
            value: 'MO TU SU',
        }
        let wrapper = shallow(<DaysOfWeek input={input} meta={meta}/>)
        expect(wrapper.state().MO).toBe(true)
        expect(wrapper.state().TU).toBe(true)
        expect(wrapper.state().WE).toBe(false)
        expect(wrapper.state().TH).toBe(false)
        expect(wrapper.state().FR).toBe(false)
        expect(wrapper.state().SA).toBe(false)
        expect(wrapper.state().SU).toBe(true)
        expect(wrapper.find({ value: 'MO' }).props().checked).toBe(true)
        expect(wrapper.find({ value: 'WE' }).props().checked).toBe(false)
        wrapper.find({ value: 'SA' }).simulate('change', {
            target: {
                value: 'SA',
                checked: true,
            },
        })
        expect(input.onChange.calledOnce).toBe(true)
    })
})
