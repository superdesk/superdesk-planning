import Popup from './popup';

export default class ActionMenu {
    constructor(selectorCallback) {
        this.selectorCallback = selectorCallback;
        this.popup = new Popup('.item-actions-menu__popup');
    }

    get parent() {
        return this.selectorCallback();
    }

    get menuButton() {
        return this.parent
            .find('.icon-dots-vertical')
            .first();
    }

    open() {
        this.menuButton.click();
        this.popup.waitTillOpen();
        return this;
    }

    getAction(label) {
        return this.popup.element.contains(label);
    }
}
