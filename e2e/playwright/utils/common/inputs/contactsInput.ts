import {Page, Locator, expect} from '@playwright/test';
import {Input} from './input';
import {Popup} from '../ui';

export class ContactsInput extends Input {
    popup: Popup;

    constructor(page: Page, getParent: () => Locator, selector: string) {
        super(page, getParent, selector);
        this.popup = new Popup(page);
    }

    get container(): Locator {
        return this.parent.locator(this.selector);
    }

    get element(): Locator {
        return this.container.locator('.sd-line-input__input');
    }

    get list(): Locator {
        return this.container
            .getByTestId('contacts-preview-list')
            .getByTestId('contact-metadata');
    }

    async results(): Promise<Locator> {
        await this.popup.waitTillOpen();
        return this.popup.element.locator('.Select__popup__item');
    }

    async result(index: number): Promise<Locator> {
        return (await this.results()).nth(index);
    }

    async remove(index: number): Promise<void> {
        await this.list
            .nth(index)
            .getByRole('button', {name: 'Remove Contact', exact: true})
            // .locator('.icon-trash')
            .click();
    }

    async search(text: string): Promise<void> {
        await this.element.clear();
        await this.element.fill(text);
    }

    async editContact(index: number): Promise<void> {
        await this.list.nth(index).hover();
        await this.list
            .nth(index)
            .getByRole('button', {name: 'Edit Contact', exact: true})
            // .locator('.icon-pencil')
            .click(); // the icon is only shown on hover
            // .click({force: true}); // the icon is only shown on hover
    }

    async type(value: string | Array<string>): Promise<void> {
        const contacts = Array.isArray(value) ? value : [value];

        for (const contact of contacts) {
            await this.search(contact);
            await (await this.result(0)).click();
        }
    }

    async expectResults(contacts: Array<Array<string>>): Promise<void> {
        await expect(await this.results()).toHaveCount(contacts.length);

        for (let index = 0; index < contacts.length; index++) {
            for (const contact of contacts[index]) {
                await expect(await this.result(index)).toContainText(contact);
            }
        }
    }

    async expect(contacts: Array<string>): Promise<void> {
        await expect(this.list).toHaveCount(contacts.length);

        for (let index = 0; index < contacts.length; index++) {
            await expect(this.list.nth(index)).toContainText(contacts[index]);
        }
    }
}
