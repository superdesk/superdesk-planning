import {Page, Locator, expect} from '@playwright/test';
import {Popup} from './popup';

export class UiFrameworkModal extends Popup {
    constructor(page: Page, selector: string = '.p-dialog') {
        super(page, selector);
    }

    get footer(): Locator {
        return this.element.locator('.p-dialog-footer');
    }

    getFooterButton(label: string): Locator {
        return this.footer.getByRole('button', {name: label, exact: true});
    }

    async shouldContainTitle(title: string): Promise<void> {
        await expect(this.page.locator('.p-dialog').last()
            .locator('.p-dialog-header')).toContainText(title);
    }
}
