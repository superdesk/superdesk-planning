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

    async selectType(type: 'Text' | 'Picture' | 'Video'): Promise<void> {
        const item = this.element.locator(`[data-test-id="item"][data-test-value="${type}"]`);

        // The modal builds its coverage-type list once, when it is constructed.
        // Opened while the content-types vocabulary is still loading, the list
        // stays empty forever, so reopen the modal rather than keep waiting.
        await expect(async () => {
            try {
                await item.waitFor({state: 'visible', timeout: 3000});
            } catch {
                // Both the header icon and the footer button are named 'Close'
                await this.element.getByRole('button', {name: 'Close', exact: true}).first().click();
                await this.waitTillClosed();
                await this.show();
                await item.waitFor({state: 'visible', timeout: 3000});
            }
        }).toPass({timeout: 30000});

        await item.click();
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

    async enableShowInEmbeddedEditor(fields: Array<string>): Promise<void> {
        for (const field of fields) {
            await this.getFieldListItem(field).click();
            await this.getEditorCheckbox('schema.show_in_embedded_editor').type(true);
            await this.saveField();
        }
    }

    async markRequired(fields: Array<string>): Promise<void> {
        for (const field of fields) {
            await this.getFieldListItem(field).click();
            await this.getEditorCheckbox('schema.required').type(true);
            await this.saveField();
            await this.expectFieldRequired(field, true);
        }
    }
}
