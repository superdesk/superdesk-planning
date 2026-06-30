import {Locator, Page} from '@playwright/test';
import {Popup} from './popup';

export class ActionMenu {
    page: Page;
    getParent: () => Locator;
    popup: Popup;

    constructor(page: Page, getParent: () => Locator) {
        this.page = page;
        this.getParent = getParent;
        this.popup = new Popup(page, '[data-test-id="item-actions-menu__popup"]');
    }

    get parent(): Locator {
        return this.getParent();
    }

    get menuButton(): Locator {
        return this.parent.getByTestId('item-actions-menu').first();
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
    page: Page,
    parent: Locator,
    ...actions: Array<any>
): Promise<Locator> {
    await parent.waitFor({state: 'visible'});
    await parent.hover();
    await parent.getByTestId('menu-button').click();
    await page.getByTestId('menu').waitFor({state: 'visible'});

    let item: Locator | null = null;

    for (let i = 0; i < actions.length; i++) {
        const isLast = i === actions.length - 1;

        item = page.getByTestId('menu').getByRole('menuitem', {name: actions[i]});

        if (!isLast) {
            await item.hover();
        }
    }

    if (item == null) {
        throw new Error(`Could not find menu item "${actions.join('", "')}"`);
    }

    return item;
}
