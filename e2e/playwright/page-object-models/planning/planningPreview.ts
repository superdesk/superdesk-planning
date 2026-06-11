import {Page, Locator} from '@playwright/test';

import {ActionMenu} from '../../utils/common';

export class PlanningPreview {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get element(): Locator {
        return this.page.locator('.sd-preview-panel');
    }

    get closeButton(): Locator {
        return this.element.locator('.icon-close-small');
    }

    get actionMenu(): ActionMenu {
        return new ActionMenu(this.page, () => this.element);
    }

    async clickAction(label: string): Promise<void> {
        await this.actionMenu.open()
        await this.actionMenu.getAction(label).click();
    }

    async waitTillOpen(): Promise<void> {
        await this.element.waitFor({state: 'visible'});
    }

    async waitTillClosed(): Promise<void> {
        await this.element.waitFor({state: 'detached'});
    }
}
