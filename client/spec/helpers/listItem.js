import {ActionMenu} from './actionMenu';
import {waitPresent} from './utils';
import {editor} from './editor';
import {preview} from './preview';


export class ListItem {
    constructor(element) {
        this.element = element;
        this.actionMenu = new ActionMenu(this.element);
    }

    waitPresent(timeout = 7500) {
        return waitPresent(this.element, timeout);
    }

    getText() {
        return this.element.getText();
    }

    toggleAssociated() {
        this.element.element(by.className('icon-calendar'))
            .click();
    }

    getAssociatedItem(searchText) {
        return new ListItem(
            this.element
                .element(by.xpath('..'))
                .element(by.className('sd-list-item-nested__childs'))
                .all(by.className('sd-list-item'))
                .filter((item) => (
                    item.getText()
                        .then((text) => (
                            text.toUpperCase().includes(searchText.toUpperCase())
                        ))
                ))
                .first()
        );
    }

    edit(element = null) {
        return browser.actions()
            .doubleClick(this.element)
            .perform()
            .then(() => {
                browser.sleep(250);
                return editor.waitTillOpen(element || editor.saveButton);
            });
    }

    preview() {
        return this.element.click()
            .then(() => {
                browser.sleep(250);
                return preview.waitTillOpen();
            });
    }
}
