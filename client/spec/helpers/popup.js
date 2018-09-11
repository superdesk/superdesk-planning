import {isCount} from './utils';

export class Popup {
    constructor(className = 'popup') {
        this.element = element(by.className(className));
    }

    static wait(className = 'popup') {
        browser.wait(
            () => element(by.className(className)).isPresent(),
            7500,
            'Timeout while waiting for the Popup to be visible'
        );
    }

    static waitForClose(className = 'popup') {
        browser.wait(
            () => isCount(element.all(by.className(className)), 0),
            7500,
            'Timeout while waiting for the Popup to close'
        );
    }

    getMenu(className) {
        return element(by.className(className));
    }
}
