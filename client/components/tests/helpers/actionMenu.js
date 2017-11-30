import React from 'react';
import {ItemActionsMenu} from '../../ItemActionsMenu';
import {map} from 'lodash';

export default class actionMenu {
    constructor(element) {
        this.element = element.find(ItemActionsMenu).first();
        this.isMounted = this.element.exists();
    }

    actions() {
        return this.isMounted ? this.element.prop('actions') : [];
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

        action.callback();
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
