import {Dropdown as DD} from '../../../../UI/SubNav';

export default class Dropdown {
    constructor(element, index = 0) {
        this.update(element, index);
    }

    update(element = null, index = 0) {
        if (element !== null) {
            this.element = element.find(DD).at(index);
        }

        this.isMounted = this.element.exists();

        if (this.isMounted) {
            this.button = this.element.find('button').first();
        } else {
            this.button = null;
        }
    }

    label() {
        return this.isMounted ? this.element.prop('label') : null;
    }

    buttonLabel() {
        return this.isMounted ? this.element.prop('buttonLabel') : null;
    }

    items() {
        return this.isMounted ? this.element.prop('items') : null;
    }

    item(index) {
        return this.isMounted ? this.items()[index] : null;
    }

    isOpen() {
        return this.isMounted ? this.element.state('open') : null;
    }

    click() {
        if (this.isMounted) {
            this.button.simulate('click');

            return true;
        }

        return null;
    }
}
