import {
    setup,
    addItems,
    login,
    waitForPageLoad,
    SubNavBar,
    Workqueue,
    Modal,
} from '../../support/common';
import {EventEditor, PlanningList} from '../../support/planning';
import {ContactsEditor} from '../../support/contacts';

describe('MediaContacts: contact input', () => {
    const editors = {
        event: new EventEditor(),
        contacts: new ContactsEditor(),
    };
    const contactInput = editors.event.fields.event_contact_info;
    const modal = new Modal();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const workqueue = new Workqueue();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('contacts', [{
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

        login();

        waitForPageLoad.planning();
        subnav.createEvent();
        editors.event.waitTillOpen();
    });

    it('can search, add, remove and edit contacts from an event', () => {
        list.expectEmpty();

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
        editors.event.minimiseButton
            .should('exist')
            .click();
        editors.event.waitTillClosed();
        workqueue.getItem(0).click();
        editors.event.waitTillOpen();
        contactInput.expect(['Elder Bower']);

        // Remove 'Elder Bower', add 'Foo Bar' then, then reload the page
        contactInput.remove(0);
        contactInput.type(['Foo']);
        contactInput.expect(['Foo Bar']);
        editors.event.waitForAutosave();
        cy.reload();
        waitForPageLoad.planning();
        editors.event.waitTillOpen();
        contactInput.expect(['Foo Bar']);
    });
});
