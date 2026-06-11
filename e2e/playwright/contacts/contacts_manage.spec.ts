import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar} from '../utils/common';
import {ContactsEditor, ContactsList} from '../page-object-models/contacts';

test.describe('MediaContacts: contacts manager', () => {
    let editor: ContactsEditor;
    let list: ContactsList;
    let subnav: SubNavBar;
    let contact: {[key: string]: any};

    test.beforeEach(async ({page}) => {
        editor = new ContactsEditor(page);
        list = new ContactsList(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/contacts');
        await login(page);
        await waitForPageLoad.contacts(page);
    });

    test('can create a contact', async () => {
        contact = {
            honorific: 'Developer',
            first_name: 'El',
            last_name: 'Bow',
            contact_email: ['el@bow.com'],
        };

        await list.expectEmpty();

        await subnav.plusBtn.click();
        await editor.waitTillOpen();
        await editor.type(contact);
        await editor.expect(contact);
        await editor.createButton.click();

        await list.expectItemCount(1);
        await editor.closeButton.click();
        await editor.waitTillClosed();

        await expect(list.item(0)).toContainText('El Bow');
        await expect(list.item(0)).toContainText('el@bow.com');

        await list.item(0).click();
        await editor.waitTillOpen();
        await editor.expect(contact);
        await editor.closeButton.click();
        await editor.waitTillClosed();

        contact = {
            first_name: 'Jane',
            last_name: 'Doe',
            contact_email: ['jane@doe.blah'],
        };
        await subnav.plusBtn.click();
        await editor.waitTillOpen();
        await editor.type(contact);
        await editor.expect(contact);
        await editor.createButton.click();

        await list.expectItemCount(2);
        await editor.closeButton.click();
        await editor.waitTillClosed();

        await expect(list.item(1)).toContainText('Jane Doe');
        await expect(list.item(1)).toContainText('jane@doe.blah');
    });
});
