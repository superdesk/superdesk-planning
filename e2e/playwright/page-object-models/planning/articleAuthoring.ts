import {expect, Locator, Page} from '@playwright/test';

export class ArticleAuthoring {
    constructor(private page: Page) {}

    get element(): Locator {
        return this.page.getByTestId('authoring');
    }

    get closeButton(): Locator {
        return this.element.getByTestId('close');
    }

    get actionsButton(): Locator {
        return this.element.getByTestId('actions-button');
    }

    async addToPlanning(): Promise<void> {
        await this.actionsButton.click();
        await this.element.getByTestId('actions-list')
            .getByRole('button', {name: 'Add to Planning', exact: true})
            .click();
    }

    async close(): Promise<void> {
        await expect(this.closeButton).toBeEnabled();
        await this.closeButton.click();
        await expect(this.element).toBeHidden();
    }
}
