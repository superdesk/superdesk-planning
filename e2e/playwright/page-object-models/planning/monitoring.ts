import {Page, Locator} from '@playwright/test';

/**
 * Wrapper around superdesk-client-core's Monitoring list, used to reach the article actions
 * that the planning extension contributes.
 */
export class Monitoring {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    item(text: string): Locator {
        return this.page.getByTestId('article-item')
            .filter({hasText: text})
            .first();
    }

    get actionsMenu(): Locator {
        return this.page.getByTestId('context-menu');
    }

    /**
     * Menu entries are plain buttons without test ids (rendered by superdesk-client-core),
     * so they are looked up by label. Not `exact`: the icon glyph is part of the accessible name.
     */
    action(label: string): Locator {
        return this.actionsMenu.getByRole('button', {name: label});
    }

    async openItemActions(text: string): Promise<void> {
        const item = this.item(text);

        await item.hover();
        await item.getByTestId('context-menu-button').click();
        await this.actionsMenu.waitFor({state: 'visible'});
    }

    /**
     * The list item re-renders (closing an open actions menu) once it receives `assignment_id`.
     * Its assignment icon has no test id in superdesk-client-core, hence the class selector.
     */
    async waitForCoverageLink(text: string): Promise<void> {
        await this.item(text)
            .locator('.assignment-icon')
            .waitFor({state: 'visible'});
    }
}
