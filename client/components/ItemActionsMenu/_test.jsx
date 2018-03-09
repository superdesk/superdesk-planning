import React from 'react';
import {mount, shallow} from 'enzyme';
import {ItemActionsMenu} from '../index';
import sinon from 'sinon';
import * as helpers from '../tests/helpers';

describe('<ItemActionsMenu />', () => {
    const callback = sinon.spy();
    const actions = [{
        label: 'label',
        callback: callback,
    }];

    it('render', () => {
        const wrapper = mount(
            <ItemActionsMenu actions={actions}/>
        );
        const menu = new helpers.actionMenu(wrapper);

        expect(menu.actionLabels()).toContain('label');
        menu.invokeAction('label');
        expect(callback.callCount).toBe(1);
    });

    // TODO: To be revisited
    xit('no visibility when action popup is already open', () => {
        let wrapper = shallow(<ItemActionsMenu actions={actions}/>);

        wrapper.instance().setState({isOpen: true});
        expect(wrapper.find('.ItemActionsMenu__hidden').length).toBe(1);
    });
});
