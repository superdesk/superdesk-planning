import {map} from 'lodash';

import {waitAndClick} from '../utils';

export class LinkInput {
    constructor(form) {
        this.form = form;
        this.addButton = form.element(by.className('link-input__add-btn'));
        this.inputs = form.all(by.className('link-input__input'));
    }

    getValue() {
        return this.inputs.map((item) => item.getAttribute('textContent'));
    }

    setValue(values) {
        // Return a promise once all the links have been set
        return Promise.all(
            map(values, (link) => this.addLink(link))
        );
    }

    addLink(link) {
        waitAndClick(this.addButton);
        return browser.actions()
            .sendKeys(link)
            .perform();
    }
}
