import {Button as BT} from '../../../UI';

export default class Button {
    constructor(element, text = null, index = 0, root = null) {
        this.root = root || element;
        let elements = element.find(BT);

        if (text) {
            elements = elements.findWhere(
                (n) => n.props().text === text
            );
        }

        this.element = elements.at(index);

        this.isMounted = this.element.exists();
        this.button = null;

        if (this.isMounted) {
            this.button = this.element.find('.btn').first();
        }
    }

    isDisabled() {
        if (this.isMounted) {
            return this.element.props().disabled;
        }

        return null;
    }

    click() {
        if (this.isMounted) {
            this.button.simulate('click');
            this.root.update();
        }
    }

    text() {
        if (this.isMounted) {
            return this.button.text();
        }

        return null;
    }
}
