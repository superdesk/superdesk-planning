import {get} from 'lodash';
import {Page, Locator, expect} from '@playwright/test';
import {clickAll} from './utils';
import {Input} from './inputs';
import {ActionMenu} from './ui';

export class Editor {
    itemIcon: string;
    fields: {[field: string]: any};
    autosavePrefix: string;

    page: Page;

    constructor(page: Page, itemIcon: string, autosavePrefix: string) {
        this.page = page;
        this.itemIcon = itemIcon;
        this.fields = {};
        this.autosavePrefix = autosavePrefix;
    }

    get element(): Locator {
        return this.page.locator('.sd-edit-panel');
    }

    get createButton(): Locator {
        return this.element.getByRole('button', {name: 'Create', exact: true});
    }

    get saveButton(): Locator {
        return this.element.getByRole('button', {name: 'Save', exact: true});
    }

    get updateButton(): Locator {
        return this.element.getByRole('button', {name: 'Update', exact: true});
    }

    get postButton(): Locator {
        return this.element.getByRole('button', {name: /Save & Post|Post/, exact: true});
    }

    get unpostButton(): Locator {
        return this.element.getByRole('button', {name: /Save & Unpost|Unpost/, exact: true});
    }

    get closeButton(): Locator {
        return this.element.getByRole('button', {name: /Cancel|Close/, exact: true});
    }

    get minimiseButton(): Locator {
        return this.element.getByRole('button', {name: 'Minimise', exact: true});
    }

    get editButton(): Locator {
        return this.element.getByRole('button', {name: 'Edit', exact: true});
    }

    get actionMenu(): ActionMenu {
        return new ActionMenu(this.page, () => this.element);
    }

    getField(name: string): Input {
        const field = get(this.fields, name);

        if (field == null) {
            throw new Error(`Error: Field "${name}" not defined for this editor`);
        }

        return field as Input;
    }

    async type(values: {[field: string]: any}): Promise<void> {
        for (const field in values) {
            if (Object.hasOwnProperty.call(values, field)) {
                await this.getField(field).type(values[field]);
            }
        }
    }

    async expect(values: {[field: string]: any}): Promise<void> {
        for (const field in values) {
            if (Object.hasOwnProperty.call(values, field)) {
                await this.getField(field).expect(values[field]);
            }
        }
    }

    async createAndClose(values: any, openToggleBoxes: boolean = true): Promise<any> {
        await this.waitTillOpen();

        if (openToggleBoxes) {
            await this.openAllToggleBoxes();
        }

        await this.type(values);
        await this.waitForAutosave();
        await this.createButton.click();
        await this.waitLoadingComplete();
        await this.closeButton.click();
        await this.waitTillClosed();
    }

    async expectItemType(): Promise<void> {
        await expect(this.element.locator(this.itemIcon)).toBeVisible();
    }

    async waitTillOpen() {
        await expect(this.closeButton).toBeEnabled();
    }

    async waitTillClosed() {
        await this.closeButton.waitFor({state: 'hidden'});
    }

    async waitForAutosave() {
        await this.page.waitForRequest(
            (response) => (
                response.url().includes(`/api/${this.autosavePrefix}_autosave/`) &&
                    response.method() === 'PATCH'
            ),
        );
    }

    async waitForAutosavePost() {
        await this.page.waitForRequest(
            (response) => (
                response.url().includes(`/api/${this.autosavePrefix}_autosave/`) &&
                    response.method() === 'POST'
            ),
        );
    }

    async waitLoadingComplete(): Promise<void> {
        await this.element.waitFor({state: 'visible'});
        await this.element.locator('.sd-loader').waitFor({state: 'detached'});
        // In CI some editors don't render a role="textbox" immediately.
        // The panel is usable once loading is done and controls are enabled.
        await expect(this.closeButton).toBeEnabled();
    }

    async openAllToggleBoxes() {
        await this.element.locator('.toggle-box.toggle-box--circle').first().waitFor({state: 'visible'});
        await clickAll(this.element, '.toggle-box.toggle-box--circle.hidden');
    }

    async clickBookmark(bookmarkId: string): Promise<void> {
        await this.element.getByTestId(`editor--bookmarks__${bookmarkId}`).click();
    }

    getFormGroup(groupId: string): Locator {
        return this.element.getByTestId(`editor--group__${groupId}`);
    }
}
