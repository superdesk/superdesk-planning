import {
    App,
    UI,
    Contacts,
} from '../../support';

describe('media contacts manager', () => {
    const editor = new Contacts.Editor();
    let contact;

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});

        cy.visit('/#/contacts');
        App.login();

        UI.waitForPageLoad();
    });

    it('can create a contact', () => {
        contact = {
            honorific: 'Developer',
            first_name: 'El',
            last_name: 'Bow',
            contact_email: ['el@bow.com'],
        };

        Contacts.List.expectEmpty();

        UI.SubNavBar.createContact();
        editor.waitTillOpen();
        editor.type(contact);
        editor.expect(contact);
        editor.createButton.click();

        Contacts.List.expectItemCount(1);
        editor.closeButton.click();
        editor.waitTillClosed();

        Contacts.List
            .item(0)
            .should('contain.text', 'El Bow');
        Contacts.List
            .item(0)
            .should('contain.text', 'el@bow.com');

        Contacts.List
            .item(0)
            .click();
        editor.waitTillOpen();
        editor.expect(contact);
        editor.closeButton.click();
        editor.waitTillClosed();

        contact = {
            first_name: 'Jane',
            last_name: 'Doe',
            contact_email: ['jane@doe.blah'],
        };
        UI.SubNavBar.createContact();
        editor.waitTillOpen();
        editor.type(contact);
        editor.expect(contact);
        editor.createButton.click();

        Contacts.List.expectItemCount(2);
        editor.closeButton.click();
        editor.waitTillClosed();

        Contacts.List
            .item(1)
            .should('contain.text', 'Jane Doe');
        Contacts.List
            .item(1)
            .should('contain.text', 'jane@doe.blah');
    });
});
