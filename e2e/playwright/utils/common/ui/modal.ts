import {Page, Locator, expect} from '@playwright/test';
import {Popup} from './popup';

export class Modal extends Popup {
    constructor(page: Page, selector: string = '.modal__dialog') {
        super(page, selector);
    }

    get footer(): Locator {
        return this.element.getByTestId('modal-footer');
    }

    getFooterButton(label: string): Locator {
        return this.footer.getByRole('button', {name: label, exact: true});
    }

    async shouldContainTitle(title: string): Promise<void> {
        await expect(this.element.locator('.modal__heading')).toContainText(title);
    }
}
