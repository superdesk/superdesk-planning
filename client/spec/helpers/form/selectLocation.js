import {isFieldEmpty} from '../utils';
import {Popup} from '../popup';

export class SelectLocation {
    constructor(form, name) {
        this.input = form.element(by.xpath(`//textarea[@name="${name}"]`));
        this.name = name;
    }

    getValue() {
        return this.input.getAttribute('value');
    }

    setValue(value) {
        this.input.clear();
        browser.wait(
            () => isFieldEmpty(this.input),
            20000,
            `Timeout while waiting for input '${this.name}' to be cleared`
        );

        this.input.sendKeys(value);

        SelectLocation.waitForPopup();

        const keySequence = browser.actions().sendKeys(
            protractor.Key.DOWN,
            protractor.Key.ENTER
        );

        keySequence.perform();
        SelectLocation.waitForSearchList();
        return keySequence.perform();
    }

    static waitForPopup() {
        Popup.wait('addgeolookup__popup');
    }

    static waitForSearchList() {
        browser.wait(
            () => element.all(by.className('addgeolookup__item')).count()
                .then((count) => count > 1), // 1 is for the search button!
            7500,
            'Timeout while waiting for location search results to be visible'
        );
    }
}
