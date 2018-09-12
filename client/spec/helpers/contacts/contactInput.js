import {isFieldEmpty, isCount} from '../utils';
import {Popup} from '../popup';
import {ContactEditor} from './';


export class ContactInput {
    constructor(form) {
        const row = form.element(by.id('form-row-event_contact_info'));

        this.input = row.all(by.className('sd-line-input__input')).first();
        this.search = new SearchResults();
        this.list = row.all(by.className('contact-metadata'));
    }

    getSearchValue() {
        return this.input.getAttribute('value');
    }

    closePopup() {
        this.input.click();
        this.search.waitForPopupClose();
    }

    searchContacts(value) {
        this.closePopup();
        return this.setSearchValue(value);
    }

    setSearchValue(value) {
        this.input.clear();
        browser.wait(
            () => isFieldEmpty(this.input),
            20000,
            'Timeout while waiting for contact search input to be cleared'
        );
        return this.input.sendKeys(value);
    }

    hoverContact(index) {
        browser.actions()
            .mouseMove(
                this.list.get(index)
                    .element(by.className('sd-list-item'))
            )
            .perform();
    }

    editContact(index) {
        this.hoverContact(index);
        this.list.get(index)
            .all(by.className('icon-pencil'))
            .first()
            .click();

        Popup.wait('modal__content');
        const popup = new Popup('modal__content');

        return new ContactEditor(popup.element);
    }

    removeContact(index) {
        this.hoverContact(index);
        this.list.get(index)
            .all(by.className('icon-trash'))
            .first()
            .click();
    }

    waitForEditorClose() {
        Popup.waitForClose('modal__content');
    }
}

class SearchResults {
    getResults() {
        Popup.wait();
        const searchPopup = new Popup();

        return searchPopup.element.all(by.className('Select__popup__item'));
    }

    getResultNames() {
        const results = this.getResults();

        return results.map((result) => result.element(by.className('contact-info'))
            .element(by.tagName('span'))
            .getText()
        );
    }

    waitForPopup(count) {
        browser.wait(
            () => isCount(this.getResults(), count),
            30000,
            'Timeout while waiting for the contact search popup to be populated'
        );
    }

    waitForPopupClose() {
        Popup.waitForClose();
    }
}
