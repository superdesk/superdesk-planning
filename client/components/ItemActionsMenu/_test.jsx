import React from 'react'
import { mount } from 'enzyme'
import { ItemActionsMenu } from '../index'
import sinon from 'sinon'

describe('<ItemActionsMenu />', () => {
    it('render', () => {
        const callback = sinon.spy()
        const wrapper = mount(
            <ItemActionsMenu actions={[{
                label: 'label',
                callback,
            }]}/>
        )
        wrapper.find('.dropdown__toggle').simulate('click')
        wrapper.find('.dropdown__menu li button').simulate('click')
        expect(callback.callCount).toBe(1)
    })

    it('render without actions ', () => {
        const wrapper = mount(
            <ItemActionsMenu actions={[]}/>
        )
        wrapper.find('.dropdown__toggle').simulate('click')
        wrapper.find('li button').simulate('click')
    })
})
