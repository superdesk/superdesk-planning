import {Page, Locator} from '@playwright/test';
import {Editor} from '../../utils/common/editor';
import {Input} from '../../utils/common/inputs';
import {ContactEmailInput} from './contactEmailInput';


export class ContactsEditor extends Editor {
    constructor(page: Page) {
        super(page, '', '');
        this.fields = {
            honorific: new Input(page, () => this.element, 'input[name="honorific"]'),
            first_name: new Input(page, () => this.element, 'input[name="first_name"]'),
            last_name: new Input(page, () => this.element, 'input[name="last_name"]'),
            organisation: new Input(page, () => this.element, 'input[name="organisation"]'),
            job_title: new Input(page, () => this.element, 'input[name="job_title"]'),
            contact_email: new ContactEmailInput(page, () => this.element, 'form-row-emails'),
        }
    }

    get element(): Locator {
        return this.page.locator('.contact-form');
    }

    get createButton(): Locator {
        return this.element.getByRole('button', {name: 'Save', exact: true});
    }

    get closeButton(): Locator {
        return this.element.getByRole('button', {name: 'Cancel', exact: true});
    }

    async waitTillClosed(): Promise<void> {
        this.element.waitFor({state: 'detached'});
    }
}
