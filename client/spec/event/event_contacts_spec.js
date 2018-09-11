import {subNavBar} from '../helpers/subNavBar';
import {editor} from '../helpers/editor';
import {workqueue} from '../helpers/workqueue';

import {nav} from 'superdesk-core/spec/helpers/utils';

import {ContactInput, ContactManager} from '../helpers/contacts';
import {isCount} from '../helpers/utils';


describe('event contacts', () => {
    let event;

    /**
     * Add contacts that will be used by the E2E tests
     */
    const addContacts = () => {
        nav('/contacts');

        const mgr = new ContactManager();
        const inputs = {
            first_name: mgr.editor.getFormInput('first_name'),
            last_name: mgr.editor.getFormInput('last_name'),
            email: mgr.editor.getFormInput('contact_email[0]'),
        };

        mgr.addButton.click();

        inputs.first_name.setValue('Foo');
        inputs.last_name.setValue('Bar');
        mgr.editor.addEmail('foo@bar.com');
        mgr.editor.saveButton.click();

        browser.wait(
            () => isCount(mgr.listItems, 1),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        mgr.addButton.click();
        inputs.first_name.setValue('El');
        inputs.last_name.setValue('Bow');
        mgr.editor.addEmail('el@bow.com');
        mgr.editor.saveButton.click();

        browser.wait(
            () => isCount(mgr.listItems, 2),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        mgr.addButton.click();
        inputs.first_name.setValue('Elder');
        inputs.last_name.setValue('Bows');
        mgr.editor.addEmail('elder@bows.com');
        mgr.editor.saveButton.click();

        browser.wait(
            () => isCount(mgr.listItems, 3),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
    };

    it('can create a contact from the event form', () => {
        addContacts();
        nav('/planning');

        // Create the Event with base values
        event = {
            name: 'Test',
            dates: {start: {date: '12/12/2045'}},
        };
        subNavBar.createEvent();
        editor.inputValues(event);

        const contactInput = new ContactInput(editor.editor);

        // Search for Foo Bar
        contactInput.searchContacts('foo');
        expect(contactInput.getSearchValue()).toEqual('foo');

        let results = contactInput.search.getResults();

        contactInput.search.waitForPopup(1);

        expect(
            results.get(0)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Foo Bar');

        // Now search for a different contact
        contactInput.searchContacts('bow');
        contactInput.search.waitForPopup(2);

        expect(contactInput.search.getResultNames()).toEqual(
            jasmine.arrayContaining(['El Bow', 'Elder Bows'])
        );

        // Finally change to the contact we are going to add to the Event
        contactInput.searchContacts('Elder');
        contactInput.search.waitForPopup(1);
        results.get(0)
            .element(by.tagName('button'))
            .click();
        browser.wait(
            () => isCount(contactInput.list, 1),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        // Make sure the search input is cleared once we add the Contact
        expect(contactInput.getSearchValue()).toBe('');

        // And make sure the Contact is added to the Event form
        expect(
            contactInput.list.get(0)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Elder Bows');

        // Search once again for 'bow' and make sure 'Elder Bows' does not show up
        contactInput.searchContacts('bow');
        contactInput.search.waitForPopup(1);
        expect(results.count()).toBe(1);

        // Close the contact and edit 'Elder Bows'
        contactInput.closePopup();
        const conactEditor = contactInput.editContact(0);

        browser.sleep(1000);

        // Changing 'Elder Bows' to 'Elder Bower'
        conactEditor.getFormInput('last_name').setValue('Bower');
        conactEditor.saveButton.click();
        contactInput.waitForEditorClose();

        // Make sure the Event form is updated, and the contact is not duplicated
        browser.sleep(1000);
        expect(
            contactInput.list.get(0)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Elder Bower');
        expect(contactInput.list.count()).toBe(1);

        // Search for 'Foo Bar' and add him to the Event
        contactInput.searchContacts('foo');
        contactInput.search.waitForPopup(1);
        results.get(0)
            .element(by.tagName('button'))
            .click();

        // Make sure there are now 2 contacts in the Event form
        browser.wait(
            () => isCount(contactInput.list, 2),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
        expect(
            contactInput.list.get(1)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Foo Bar');

        // Minimize then open the item to test autosave
        const item1 = workqueue.getItem(0);

        editor.minimizeButton.click();
        item1.openItem();

        browser.wait(
            () => isCount(contactInput.list, 2),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
        expect(
            contactInput.list.get(0)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Elder Bower');
        expect(
            contactInput.list.get(1)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Foo Bar');

        // Remove 'Elder Bower', wait for autosave, then reload the page
        contactInput.removeContact(0);
        browser.sleep(5000);
        browser.navigate().refresh();

        browser.wait(
            () => isCount(contactInput.list, 1),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
        expect(
            contactInput.list.get(0)
                .element(by.className('contact-info'))
                .element(by.tagName('span'))
                .getText()
        ).toBe('Foo Bar');
    });
});
