import {test, expect} from '@playwright/test';

import {
    setup,
    addItems,
    login,
    waitForPageLoad,
    SubNavBar,
    Workqueue,
    UiFrameworkModal,
    ContactsInput,
} from '../utils/common';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {ContactsEditor} from '../page-object-models/contacts';

test.describe('MediaContacts: contact input', () => {
    let editors: {
        event: EventEditor,
        contacts: ContactsEditor,
    };
    let contactInput: ContactsInput;
    let modal: UiFrameworkModal;
    let subnav: SubNavBar;
    let list: PlanningList;
    let workqueue: Workqueue;

    test.beforeEach(async ({page}) => {
        editors = {
            event: new EventEditor(page),
            contacts: new ContactsEditor(page),
        };
        contactInput = editors.event.fields.event_contact_info;
        modal = new UiFrameworkModal(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        workqueue = new Workqueue(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(
            page.request,
            'contacts',
                [{
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
            }]
        );

        await login(page);

        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editors.event.waitTillOpen();
    });

    test('can search, add, remove and edit contacts from an event', async ({page}) => {
        await list.expectEmpty();

        await contactInput.search('el');
        await contactInput.expectResults([
            ['El Bow', 'el@bow.com'],
            ['Elder Bows', 'elder@bows.com'],
        ]);

        await contactInput.search('elder');
        await contactInput.expectResults([
            ['Elder Bows', 'elder@bows.com'],
        ]);

        await (await contactInput.result(0)).click();
        await expect(contactInput.list).toHaveCount(1);
        await contactInput.expect(['Elder Bows']);

        await contactInput.type(['El']);
        await expect(contactInput.list).toHaveCount(2);
        await contactInput.expect(['Elder Bows', 'El Bow']);

        await contactInput.remove(0);
        await contactInput.expect(['El Bow']);

        await contactInput.editContact(0);
        await editors.contacts.type({
            first_name: 'Elder',
            last_name: 'Bower',
        });
        await editors.contacts.fields.contact_email.replace(0, 'eder@bower.com');
        await modal.getFooterButton('Save').click();
        await modal.waitTillClosed();
        await contactInput.expect(['Elder Bower']);

        // Minimize then open the item to test autosave
        await editors.event.minimiseButton.click();
        await editors.event.waitTillClosed();
        await workqueue.getItem(0).click();
        await editors.event.waitTillOpen();
        await contactInput.expect(['Elder Bower']);

        // Remove 'Elder Bower', add 'Foo Bar' then, then reload the page
        await contactInput.remove(0);
        await contactInput.type(['Foo']);
        await contactInput.expect(['Foo Bar']);
        await editors.event.waitForAutosave();

        // reload the page
        await page.reload();

        await editors.event.waitTillOpen();
        await contactInput.expect(['Foo Bar']);
    });
});
