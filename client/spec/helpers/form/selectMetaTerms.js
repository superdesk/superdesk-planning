import {map} from 'lodash';

export class SelectMetaTerms {
    constructor(form, name) {
        this.row = form.element(by.id(`form-row-${name}`));
        this.addButton = this.row.element(by.className('sd-line-input__plus-btn'));
    }

    getValue() {
        return this.row.all(by.tagName('li'))
            .map((item) => item.getAttribute('textContent'));
    }

    setValue(values) {
        // Return a promise once all the links have been set
        return Promise.all(
            map(values, (term) => this.addTerm(term))
        );
    }

    addTerm(term) {
        this.addButton.click();
        return browser
            .actions()
            .sendKeys(
                term,
                protractor.Key.DOWN,
                protractor.Key.ENTER
            )
            .perform();
    }
}
