export class Popup {
    constructor(className = 'popup') {
        this.element = element(by.className(className));
    }

    static wait(className = 'popup') {
        browser.wait(
            () => element(by.className(className)).isPresent(),
            7500
        );
    }
}
