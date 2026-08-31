import {Page, Locator, expect} from '@playwright/test';
import {ActionMenu, getMenuItem} from '../../utils/common/ui';

export class PlanningList {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get panel(): Locator {
        return this.page.locator('.sd-column-box__main-column__listpanel');
    }

    items(): Locator {
        return this.panel.locator('.sd-list-item');
    }

    item(index: number): Locator {
        return this.items().nth(index);
    }

    nestedItems(): Locator {
        return this.panel.getByTestId('has-nested-items');
    }

    nestedItem(index: number): Locator {
        return this.nestedItems().nth(index);
    }

    nestedPlanningItems(index: number): Locator {
        return this.nestedItem(index)
            .getByTestId('nested-items')
            .locator('.sd-list-item');
    }

    nestedPlanningItem(itemIndex: number, planIndex: number): Locator {
        return this.nestedPlanningItems(itemIndex).nth(planIndex);
    }

    getActionMenu(index: number) {
        return new ActionMenu(this.page, () => this.item(index));
    }

    async clickAction(index: number, label: string) {
        await this.item(index).click();
        await (await getMenuItem(this.page, this.item(index), label)).click();
    }

    async expectEmpty(): Promise<void> {
        await this.items().waitFor({state: 'hidden'});
    }

    async expectItemCount(count: number): Promise<void> {
        await expect(this.items()).toHaveCount(count);
    }

    async expectItemText(index: number, text: string): Promise<void> {
        await expect(this.item(index)).toContainText(text);
    }

    async toggleAssociatedPlanning(index: number): Promise<void> {
        await this.nestedItem(index)
            .getByTestId('toggle-related-plannings')
            .click();
    }

    async toggleAssociatedEvents(index: number): Promise<void> {
        await this.nestedItem(index)
            .getByTestId('toggle-related-events')
            .click();
    }

    /**
     * The multi-select toolbar renders its actions as icon buttons carrying only an aria-label,
     * so this is a role lookup rather than a test id.
     */
    async addSelectedToWorkflow(index: number): Promise<void> {
        await this.item(index).hover();
        await this.item(index).getByTestId('multi-select-checkbox').click();

        // The action patches each selected item; without waiting for that response a reload
        // straight afterwards races the in-flight request and sees the coverage still in draft
        const patched = this.page.waitForResponse((response) => (
            response.request().method() === 'PATCH' && response.url().includes('/planning/')
        ));

        await this.page.getByRole('button', {name: 'Add to workflow'}).click();
        await patched;
    }

    async setDateInterval(interval: 'Day' | 'Week' | 'Month') {
        await this.page.getByTestId('planning-list-panel')
            .getByTestId('interval-dropdown-toggle')
            .click();

        await this.page.getByTestId('dropdown-overlay')
            .locator('li')
            .getByText(interval)
            .click();
    }
}
