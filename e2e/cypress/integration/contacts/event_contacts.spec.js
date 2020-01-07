import {
    App,
    UI,
    Editors,
    Contacts,
} from '../../support';

describe('event contacts', () => {
    const editors = {
        event: new Editors.EventEditor(),
        contacts: new Contacts.Editor(),
    };
    const contactInput = editors.event.fields.event_contact_info;
    const modal = new UI.Modal();

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});
        App.addItems('contacts', [{
            first_name: 'Foo',
            last_name: 'Bar',
            public: true,
            is_active: true,
            contact_email: ['foo@bar.com'],
        }, {
            first_name: 'El',
            last_name: 'Bow',
            public: true,
            is_active: true,
            contact_email: ['el@bow.com'],
        }, {
            first_name: 'Elder',
            last_name: 'Bows',
            public: true,
            is_active: true,
            contact_email: ['elder@bows.com'],
        }]);

        cy.visit('/#/planning');
        App.login();

        UI.waitForPageLoad();
        UI.SubNavBar.createEvent();
        editors.event.waitTillOpen();
    });

    it('can search, add, remove and edit contacts from an event', () => {
        UI.ListPanel.expectEmpty();

        contactInput.search('el');
        contactInput.expectResults([
            ['El Bow', 'el@bow.com'],
            ['Elder Bows', 'elder@bows.com'],
        ]);

        contactInput.search('elder');
        contactInput.expectResults([
            ['Elder Bows', 'elder@bows.com'],
        ]);

        contactInput.result(0).click();
        contactInput.list.should('have.length', 1);
        contactInput.expect(['Elder Bows']);

        contactInput.type(['El']);
        contactInput.list.should('have.length', 2);
        contactInput.expect(['Elder Bows', 'El Bow']);

        contactInput.remove(0);
        contactInput.expect(['El Bow']);

        contactInput.editContact(0);
        editors.contacts.type({
            first_name: 'Elder',
            last_name: 'Bower',
        });
        editors.contacts.fields.contact_email.replace(0, 'eder@bower.com');
        modal.getFooterButton('Save')
            .click();
        modal.waitTillClosed();
        contactInput.expect(['Elder Bower']);

        // Minimize then open the item to test autosave
        editors.event.minimiseButton.click();
        editors.event.waitTillClosed();
        UI.Workqueue.getItem(0).click();
        editors.event.waitTillOpen();
        contactInput.expect(['Elder Bower']);

        // Remove 'Elder Bower', add 'Foo Bar' then, then reload the page
        contactInput.remove(0);
        contactInput.type(['Foo']);
        contactInput.expect(['Foo Bar']);
        editors.event.waitForAutosave();
        cy.reload();
        UI.waitForPageLoad();
        editors.event.waitTillOpen();
        contactInput.expect(['Foo Bar']);
    });
});
