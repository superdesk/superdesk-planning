import {Locator, Page} from '@playwright/test';
import {Popup} from './popup';

export class ActionMenu {
    page: Page;
    getParent: () => Locator;
    popup: Popup;

    constructor(page: Page, getParent: () => Locator) {
        this.page = page;
        this.getParent = getParent;
        this.popup = new Popup(page, '.item-actions-menu__popup');
    }

    get parent(): Locator {
        return this.getParent();
    }

    get menuButton(): Locator {
        return this.parent.locator('.icon-dots-vertical').first();
    }

    async open(): Promise<ActionMenu> {
        await this.menuButton.click();
        await this.popup.waitTillOpen();
        return this;
    }

    getAction(label: string): Locator {
        return this.popup.element.getByText(label);
    }
}

export async function getMenuItem(
    parent: Locator,
    ...actions: Array<any>
): Promise<Locator> {
    await parent.hover();
    await parent.locator('[data-test-id="menu-button"]').click();
    await parent.locator('[data-test-id="menu"]').waitFor({state: 'visible'});

    let item: Locator | null = null;

    for (let i = 0; i < actions.length; i++) {
        const isLast = i === actions.length - 1;

        item = parent.locator(`[data-test-id="menu"] [role="menuitem"]:contains("${actions[i]}")`);

        if (!isLast) {
            await item.hover();
        }
    }

    if (item == null) {
        throw new Error(`Could not find menu item "${actions.join('", "')}"`);
    }

    return item;
}
