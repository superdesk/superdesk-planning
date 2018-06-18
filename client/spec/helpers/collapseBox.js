
import {hasClass, waitAndClick} from './utils';

export class CollapseBox {
    constructor(element) {
        this.element = element;
    }

    isOpen() {
        return hasClass(this.element, 'sd-collapse-box--open');
    }

    expand() {
        return this.isOpen()
            .then((isOpen) => {
                if (!isOpen) {
                    this.toggle();
                }
            });
    }

    collapse() {
        return this.isOpen()
            .then((isOpen) => {
                if (isOpen) {
                    this.toggle();
                }
            });
    }

    toggle() {
        return waitAndClick(this.element);
    }

    waitOpen(timeout = 7500) {
        browser.wait(this.isOpen((isOpen) => Promise.resolve(isOpen)));
    }

    waitClose(timeout = 7500) {
        browser.wait(this.isOpen((isOpen) => Promise.resolve(!isOpen)));
    }
}
