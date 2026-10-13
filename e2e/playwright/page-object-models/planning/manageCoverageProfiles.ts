import {expect, Locator, Page} from '@playwright/test';
import {Modal, NewCheckboxInput, SubNavBar} from '../../utils/common';

export class ManageCoverageProfiles extends Modal {
    constructor(page: Page) {
        super(page, '[data-test-id="coverage-profile-modal"]');
    }

    async show(): Promise<void> {
        const subnav = new SubNavBar(this.page);

        await subnav.actionsMenuBtn.click();
        await subnav.actionsMenu
            .getByRole('button', {name: 'Manage Coverage Profiles', exact: true})
            .click();

        await this.waitTillOpen();
    }

    async selectType(type: 'Text' | 'Picture'): Promise<void> {
        await this.element.locator(`[data-test-id="item"][data-test-value="${type}"]`).click();
    }

    getFieldListItem(fieldName: string): Locator {
        return this.element.getByTestId(`content-list--field-${fieldName}`);
    }

    getEditorCheckbox(fieldName: string): NewCheckboxInput {
        return new NewCheckboxInput(
            this.page,
            () => this.element,
            `[data-test-id="content-field--editor"] [data-test-id="field-${fieldName}"]`
        );
    }

    async saveField(): Promise<void> {
        await this.element.getByTestId('content-field--editor')
            .getByTestId('content-field--editor-apply')
            .click();
    }

    async saveAll(): Promise<void> {
        await this.element.getByTestId('coverage-profile-modal--save').click();
        await this.waitTillClosed();
    }

    async openAddFieldMenu(index: number): Promise<void> {
        await this.element.locator('.btn--icon-only-circle').nth(index).click();
        await this.page.getByTestId('tree-menu-popover')
            .getByRole('tree')
            .waitFor({state: 'visible'});
    }

    async addField(name: string): Promise<void> {
        await this.page.getByTestId('tree-menu-popover')
            .getByRole('treeitem', {name, exact: true})
            .click();
    }

    async expectFieldRequired(fieldName: string, required: boolean): Promise<void> {
        const field = this.getFieldListItem(fieldName);

        if (required) {
            await expect(field).toContainText('Required');
        } else {
            await expect(field).not.toContainText('Required');
        }
    }
}