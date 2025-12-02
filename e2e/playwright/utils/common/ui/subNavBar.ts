import type {Page, Locator} from '@playwright/test';

export class SubNavBar {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Returns the dom node for the sub nav bar
     */
    get element(): Locator {
        return this.page.locator('.subnav').first();
    }

    get plusBtn(): Locator {
        return this.element.locator('.icon-plus-large');
    }

    get createMenu(): Locator {
        return this.element.locator('ul.dropdown__menu');
    }

    get menuBtn(): Locator {
        return this.page.locator('.subnav + .subnav').locator('.icon-dots-vertical');
    }

    get menu(): Locator {
        return this.page.locator('.subnav + .subnav').locator('ul.dropdown__menu');
    }

    async createEvent(): Promise<void> {
        await this.plusBtn.click();
        await this.createMenu
            .getByRole('button', {name: 'Event', exact: true})
            // .locator('#create_event')
            .click();
    }

    async createPlanning(): Promise<void> {
        await this.plusBtn.click();
        await this.createMenu
            .getByRole('button', {name: 'Planning Item', exact: true})
            // .locator('#create_planning')
            .click();
    }
}
