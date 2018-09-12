import {ContactEditor} from './';

export class ContactManager {
    constructor() {
        this.workspace = element.all(by.id('workspace-container')).first();
        this.subnav = this.workspace.element(by.className('subnav'));
        this.addButton = this.subnav.element(by.className('sd-create-btn'));
        this.editor = new ContactEditor(this.workspace);
        this.list = this.workspace.element(by.className('contacts-list__holder'));
        this.listItems = this.list.all(by.className('list-item-view'));
    }

    getContact(index) {
        return new ContactItem(this, index);
    }
}

export class ContactItem {
    constructor(mgr, index) {
        this.index = index;
        this.container = mgr.listItems.get(index);
    }

    getContactName() {
        return this.container.element(by.className('contact-name')).getText();
    }

    getEmail() {
        const div = this.container.element(by.xpath('//span[@class="container link"]'));

        return div.element(by.tagName('a')).getText();
    }
}
