import React from 'react'
import { shallow } from 'enzyme'
import { QuickAddPlanning } from '../index'
import sinon from 'sinon'

describe('<QuickAddPlanning />', () => {
    it('adds a planning', () => {
        const onPlanningCreation = sinon.spy((p) => (
            expect(p).toEqual({ slugline: '123' })
        ))
        const wrapper = shallow(<QuickAddPlanning onPlanningCreation={onPlanningCreation}/>)
        expect(wrapper.state().editMode).toBe(false)
        wrapper.simulate('click')
        expect(wrapper.state().editMode).toBe(true)
        wrapper.find('input').simulate('change', { target: { value: '123' }})
        expect(wrapper.state().slugline).toBe('123')
        wrapper.find('form').simulate('submit', { preventDefault: () => ({}) })
        expect(onPlanningCreation.calledOnce).toBe(true)
    })
})
