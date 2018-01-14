import React from 'react';
import {Popup as P} from '../../../UI/Popup';
import {ReactWrapper} from 'enzyme';
import {Provider} from 'react-redux';

export default class Popup {
    constructor(element, index = 0, store = null) {
        this.element = element.find(P).at(index);
        this.isMounted = element.exists();
        this.childNode = this.getChild(store);
    }

    getChild(store = null) {
        if (!this.isMounted) {
            return null;
        }

        if (store) {
            return new ReactWrapper(
                <Provider store={store}>{this.element.node.props.children}</Provider>
            );
        }

        return new ReactWrapper(this.element.node.props.children);
    }

    find(element) {
        if (!this.isMounted) {
            return null;
        }

        return this.childNode.find(element);
    }
}
