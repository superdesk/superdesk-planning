import {Page, Locator, expect} from '@playwright/test';

interface IExpectItem {
    title?: string;
    icon?: string;
    active?: boolean;
}

export class Workqueue {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get panel(): Locator {
        return this.page.locator('.opened-articles-bar');
    }

    get items(): Locator {
        return this.panel.getByTestId('workqueue-item');
    }

    async expectItemCount(count: number): Promise<void> {
        await expect(this.items).toHaveCount(count);
    }

    getItem(index: number): Locator {
        return this.items.nth(index).getByTestId('workqueue-item--title');
    }

    async expectTitle(index: number, title: string): Promise<void> {
        await expect(this.getItem(index)).toContainText(title);
    }

    async expectIcon(index: number, icon: string): Promise<void> {
        await expect(this.getItem(index).locator(icon)).toBeVisible();
    }

    async expectActive(index: number): Promise<void> {
        await expect(this.items.nth(index)).toHaveAttribute('data-active', 'true');
    }

    async expectNotActive(index: number): Promise<void> {
        await expect(this.items.nth(index)).not.toHaveAttribute('data-active', 'true');
    }

    async expectItems(items: Array<IExpectItem>) {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];

            if (item.title != null) {
                await this.expectTitle(index, item.title);
            }
            if (item.icon != null) {
                await this.expectIcon(index, item.icon);
            }
            if (item.active != null) {
                item.active ?
                    await this.expectActive(index) :
                    await this.expectNotActive(index);
            }
        }
    }

    async closeItem(index: number): Promise<void> {
        await this.items
            .nth(index)
            .getByRole('button', {name: 'Close', exact: true})
            .click();
    }
}
