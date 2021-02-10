import {setup, login, waitForPageLoad, SubNavBar} from '../../support/common';
import {ContactsEditor, ContactsList} from '../../support/contacts';

describe('MediaContacts: contacts manager', () => {
    const editor = new ContactsEditor();
    const list = new ContactsList();
    const subnav = new SubNavBar();
    let contact;

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/contacts');

        login();

        waitForPageLoad.contacts();
    });

    it('can create a contact', () => {
        contact = {
            honorific: 'Developer',
            first_name: 'El',
            last_name: 'Bow',
            contact_email: ['el@bow.com'],
        };

        list.expectEmpty();

        subnav.createContact();
        editor.waitTillOpen();
        editor.type(contact);
        editor.expect(contact);
        editor.createButton
            .should('exist')
            .click();

        list.expectItemCount(1);
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        list.item(0)
            .should('contain.text', 'El Bow');
        list.item(0)
            .should('contain.text', 'el@bow.com');

        list.item(0)
            .click();
        editor.waitTillOpen();
        editor.expect(contact);
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        contact = {
            first_name: 'Jane',
            last_name: 'Doe',
            contact_email: ['jane@doe.blah'],
        };
        subnav.createContact();
        editor.waitTillOpen();
        editor.type(contact);
        editor.expect(contact);
        editor.createButton
            .should('exist')
            .click();

        list.expectItemCount(2);
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        list.item(1)
            .should('contain.text', 'Jane Doe');
        list.item(1)
            .should('contain.text', 'jane@doe.blah');
    });
});
