import {Popup} from './popup';
import {waitAndClick} from './utils';

export class ActionMenu {
    constructor(element) {
        this.element = element;
        this.popup = new Popup('item-actions-menu__popup');

        this.menuButton = this.element.all(by.className('icon-dots-vertical'))
            .first();
    }

    hover() {
        browser.actions()
            .mouseMove(this.element)
            .perform();

        // waitPresent(this.menuButton);
    }

    open() {
        this.hover();
        waitAndClick(this.menuButton);

        Popup.wait('item-actions-menu__popup');
        return this;
    }

    getAction(label) {
        return this.popup.element.element(by.xpath(`.//button[text()='${label}']`));
    }

    clickAction(label) {
        return this.getAction(label)
            .click();
    }
}
