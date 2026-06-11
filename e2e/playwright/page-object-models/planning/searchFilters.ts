import {Page, Locator, expect} from '@playwright/test';

import {Modal, SubNavBar, ActionMenu} from '../../utils/common';
import {AdvancedSearch} from './advancedSearch';

export class SearchFilters extends Modal {
    editor: AdvancedSearch;
    subnav: SubNavBar;

    constructor(page: Page) {
        super(page, '[data-test-id="search-filters-modal"]');

        this.editor = new AdvancedSearch(
            this.page,
            () => this.page.getByTestId('manage-filters--content-panel')
        );
        this.subnav = new SubNavBar(this.page);
    }

    async open(): Promise<void> {
        await this.subnav.menuBtn.click();
        await this.subnav.menu
            .getByText('Manage Event & Planning Filters')
            .click();
        await this.waitTillOpen();
    }

    get addNewFilterButton(): Locator {
        return this.element.getByTestId('manage-filters--add-new-filter');
    }

    get editScheduleButton(): Locator {
        return this.element.getByTestId('manage-filters--preview--edit-schedule');
    }

    get saveFilterButton(): Locator {
        return this.element.getByTestId('manage-filters--save-filter');
    }

    get saveScheduleButton(): Locator {
        return this.element.getByTestId('manage-filters--save-schedule');
    }

    async waitForContentPanelToOpen(): Promise<void> {
        await this.editor.getParent()
            .locator('.side-panel__content')
            .waitFor({state: 'visible'});
    }

    async waitForContentPanelToClose(): Promise<void> {
        await this.editor.getParent()
            .locator('.side-panel__content')
            .waitFor({state: 'detached'});
    }

    items(): Locator {
        return this.element.locator('.sd-list-item');
    }

    item(index: number): Locator {
        return this.items().nth(index);
    }

    async expectItemCount(count: number): Promise<void> {
        await expect(this.items()).toHaveCount(count);
    }

    async expectItemText(index: number, text: string): Promise<void> {
        await expect(this.item(index)).toContainText(text);
    }

    async preview(index: number): Promise<void> {
        await this.item(index).click();
    }

    async edit(index: number): Promise<void> {
        await this.preview(index);

        await this.editor.getParent()
            .locator('.side-panel__header')
            .locator('.icon-pencil')
            .click();
    }

    getActionMenu(index: number): ActionMenu {
        return new ActionMenu(
            this.page,
            () => this.item(index)
        );
    }

    async clickAction(index: number, label: string): Promise<void> {
        await this.preview(index);
        const menu = new ActionMenu(
            this.page,
            () => this.editor.getParent().locator('.side-panel__content')
        );

        await menu.open();
        await menu.getAction(label).click();
    }
}
