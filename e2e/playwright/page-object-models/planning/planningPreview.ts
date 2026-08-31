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

    /**
     * Entity cards (related event / related planning) inside a preview. A CollapseBox only renders
     * its collapsed item while closed, so these match the cards and not an expanded card's content.
     */
    get entityCards(): Locator {
        return this.element.locator(
            '[data-test-id="related-event-item"], [data-test-id="related-planning-item"]'
        );
    }

    entityCard(index: number): Locator {
        return this.entityCards.nth(index);
    }

    get coverageCards(): Locator {
        return this.element.getByTestId('coverage-item');
    }

    coverageCard(index: number): Locator {
        return this.coverageCards.nth(index);
    }

    // The column wrapping `ItemIcon` on a related event / planning item
    itemTypeIcons(scope?: Locator): Locator {
        return (scope ?? this.element).locator('[data-test-id="item-type-icon"]');
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
