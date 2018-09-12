import {ContactManager} from '../helpers/contacts';
import {isCount} from '../helpers/utils';

import {nav} from 'superdesk-core/spec/helpers/utils';


describe('event contacts', () => {
    it('can create a contact', () => {
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

        expect(inputs.first_name.getValue()).toEqual('Foo');
        expect(inputs.last_name.getValue()).toEqual('Bar');
        expect(inputs.email.getValue()).toEqual('foo@bar.com');

        mgr.editor.saveButton.click();

        browser.wait(
            () => isCount(mgr.listItems, 1),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        let contact = mgr.getContact(0);

        expect(contact.getContactName()).toEqual('Foo Bar');
        expect(contact.getEmail()).toEqual('foo@bar.com');

        mgr.addButton.click();
        inputs.first_name.setValue('El');
        inputs.last_name.setValue('Bow');
        mgr.editor.addEmail('el@bow.com');

        expect(inputs.first_name.getValue()).toEqual('El');
        expect(inputs.last_name.getValue()).toEqual('Bow');
        expect(inputs.email.getValue()).toEqual('el@bow.com');
        mgr.editor.saveButton.click();

        browser.wait(
            () => isCount(mgr.listItems, 2),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
    });
});
