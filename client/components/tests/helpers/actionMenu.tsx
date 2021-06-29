import React from 'react';
import {map} from 'lodash';
import {ReactWrapper} from 'enzyme';

import {Menu} from 'superdesk-ui-framework/react';
import {ItemActionsMenu} from '../../ItemActionsMenu';

export default class actionMenu {
    usesNewMenu: boolean;
    isMounted: boolean;
    element: ReactWrapper;

    constructor(element: ReactWrapper, newMenu = false) {
        this.usesNewMenu = newMenu;
        this.element = this.usesNewMenu ?
            element.find(Menu).first() :
            element.find(ItemActionsMenu).first();

        this.isMounted = this.element.exists();
    }

    actions(): Array<any> {
        if (this.isMounted) {
            return this.usesNewMenu ?
                (this.element.prop('items') || []) :
                (this.element.prop('actions') || []);
        }

        return [];
    }

    actionLabels() {
        return map(this.actions(), 'label');
    }

    isAvailable() {
        return this.isMounted && this.element.contains(
            <i className="icon-dots-vertical" />
        );
    }

    isOpen() {
        return this.element.find('.dropdown__menu').length > 0;
    }

    getActionNodeByLabel(label) {
        if (this.element.find('.icon-dots-vertical').length === 0) {
            return null;
        }

        return this.element.find('button').findWhere((node) => node.text() === label);
    }

    invokeAction(actionLabel) {
        const action = this.actions().find((a) => a.label === actionLabel);

        if (action?.callback != null) {
            action.callback();
        } else if (action?.onClick != null) {
            action.onClick();
        }
    }

    toggleMenu() {
        this.element.find('.dropdown__toggle').simulate('click');
    }

    clickAction(label) {
        const action = this.getActionNodeByLabel(label);

        return action.simulate('click');
    }

    expectActions(expectedActions) {
        const itemActions = this.actionLabels();

        expect(itemActions.length).toBe(
            expectedActions.length,
            `\n\texpected [${itemActions}] to be\n\t[${expectedActions}]`
        );

        for (let i = 0; i < expectedActions.length; i++) {
            expect(expectedActions[i]).toBe(itemActions[i]);
        }
    }
}
