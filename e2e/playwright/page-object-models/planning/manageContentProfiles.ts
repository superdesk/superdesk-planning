import {expect, Locator} from '@playwright/test';
import {Modal, SubNavBar, ActionMenu, NewCheckboxInput, TreeSelect} from '../../utils/common';

export class ManageContentProfiles extends Modal {
    async show(contentType: 'event' | 'planning'): Promise<void> {
        const subnav = new SubNavBar(this.page);

        await subnav.menuBtn.click();
        await subnav.menu
            .getByText(`Manage ${contentType} profile`)
            .click();

        await this.waitTillOpen();
    }

    async selectTab(index: number): Promise<void> {
        await this.element
            .getByRole('tab')
            .nth(index)
            .click();
    }

    async expectSelectedTab(name: string): Promise<void> {
        await expect(this.element.getByRole('tab', {selected: true})).toContainText(name);
    }

    async openAddFieldMenu(index: number): Promise<void> {
        await this.element
            .locator('.btn--icon-only-circle')
            .nth(index)
            .click();
        await this.page.getByTestId('tree-menu-popover')
            .getByRole('tree')
            .waitFor({state: 'visible'});
    }

    actionMenu(): ActionMenu {
        return new ActionMenu(this.page, () => this.element);
    }

    async addField(name: string): Promise<void> {
        await this.page.getByTestId('tree-menu-popover')
            .getByRole('treeitem', {name: name, exact: true})
            .click();
    }

    getFieldListItem(fieldName: string): Locator {
        return this.element.getByTestId(`content-list--field-${fieldName}`);
    }

    getEditor(): Locator {
        return this.element.getByTestId('content-field--editor');
    }

    getEditorCheckbox(fieldName: string): NewCheckboxInput {
        return new NewCheckboxInput(
            this.page,
            () => this.element,
            `[data-test-id="content-field--editor"] [data-test-id="field-${fieldName}"]`
        );
    }

    getEditorTreeSelect(fieldName: string, allowMultiple: boolean = false): TreeSelect {
        return new TreeSelect(
            this.page,
            () => this.element,
            `[data-test-id="content-field--editor"] [data-test-id="field-${fieldName}"]`,
            allowMultiple
        );
    }

    async saveField(): Promise<void> {
        await this.getHeaderButton('Save').click();
    }

    getHeaderButton(label: string): Locator {
        return this.element.locator('.side-panel__header')
            .getByText(label);
    }
}
