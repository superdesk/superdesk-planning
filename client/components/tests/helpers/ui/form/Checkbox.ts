import {Checkbox as CB} from '../../../../UI/Form';

export default class Checkbox {
    constructor(element, index = 0) {
        this.update(element, index);
    }

    update(element = null, index = 0) {
        if (element !== null) {
            this.element = element.find(CB).at(index);
        }

        this.isMounted = this.element.exists();
    }

    checked() {
        return this.isMounted ? this.element.find('.checked').length > 0 : null;
    }

    label() {
        return this.isMounted ? this.element.prop('label') : null;
    }

    click() {
        if (this.isMounted) {
            this.element.simulate('click');
            return true;
        }

        return null;
    }
}
