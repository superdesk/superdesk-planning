import React from 'react'
import { mount } from 'enzyme'
import { ItemActionsMenu } from '../index'
import sinon from 'sinon'
import * as helpers from '../tests/helpers'

describe('<ItemActionsMenu />', () => {
    it('render', () => {
        const callback = sinon.spy();
        const wrapper = mount(
            <ItemActionsMenu actions={[{
                label: 'label',
                callback,
            }]}/>
        )
        const menu = new helpers.actionMenu(wrapper)
        expect(menu.actionLabels()).toContain('label')
        menu.invokeAction('label')
        expect(callback.callCount).toBe(1)
    })

    it('doesnt render without actions ', () => {
        const wrapper = mount(
            <ItemActionsMenu actions={[]}/>
        );

        expect(wrapper.find('.dropdown__toggle').length).toBe(0);
    });
});
