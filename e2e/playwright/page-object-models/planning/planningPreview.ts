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
     * Collapsed entity cards (related event / related planning) inside a preview. No test id
     * exists, so the collapsed-header class is the only hook. It also keeps an expanded
     * CollapseBox, which renders its own list items and icon, out of scope.
     */
    get entityCards(): Locator {
        return this.element.locator('.sd-collapse-box__header li.sd-list-item');
    }

    entityCard(index: number): Locator {
        return this.entityCards.nth(index);
    }

    // `sd-list-item__item-type` is only applied by `ItemIcon`, so its absence means no icon rendered
    itemTypeIcons(scope?: Locator): Locator {
        return (scope ?? this.element).locator('.sd-list-item__item-type');
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
