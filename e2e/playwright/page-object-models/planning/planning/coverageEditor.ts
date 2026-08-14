import {expect, Locator} from '@playwright/test';

import {Editor} from '../../../utils/common/editor';
import {Input, SelectInput, ActionMenu, ToggleInput, UrgencyTreeSelectInput} from '../../../utils/common';
import {PlanningEditor} from './planningEditor';

/**
 * Wrapper class around Superdesk's Coverage editor component
 * @extends Editor
 */
export class CoverageEditor extends Editor {
    fields: {[key: string]: any};
    parentEditor: PlanningEditor;
    index: number;

    /**
     * Creates an instance of the Editor instance.
     * @param {PlanningEditor} parentEditor - The parent editor to this coverage
     * @param {number} index - The index of this coverage inside the planning item
     */
    constructor(parentEditor: PlanningEditor, index: number) {
        super(parentEditor.page, '', '');

        this.parentEditor = parentEditor;
        this.index = index;

        const getParent = () => this.element;

        this.fields = {
            add_coverage_to_workflow: new ToggleInput(
                parentEditor.page,
                getParent,
                '[data-test-id="field-add_coverage_to_workflow"]',
            ),
            content_type: new SelectInput(
                parentEditor.page,
                getParent,
                '[data-test-id="field-g2_content_type"] select',
            ),
            genre: new SelectInput(parentEditor.page, getParent, '[data-test-id="field-genre"] select'),
            headline: new Input(parentEditor.page, getParent, '[data-test-id="field-headline"] input'),
            priority: new UrgencyTreeSelectInput(parentEditor.page, getParent, '[data-test-id="field-priority"]'),
            slugline: new Input(parentEditor.page, getParent, '[data-test-id="field-slugline"] input'),
            ednote: new Input(parentEditor.page, getParent, '[data-test-id="field-ednote"] textarea'),
            internal_note: new Input(parentEditor.page, getParent, '[data-test-id="field-internal_note"] textarea'),
            news_coverage_status: new SelectInput(
                parentEditor.page,
                getParent,
                '[data-test-id="field-news_coverage_status"] select',
            ),
            scheduled: {
                date: new Input(parentEditor.page, getParent, '[data-test-id="field-scheduled-date"]'),
                time: new Input(parentEditor.page, getParent, '[data-test-id="field-scheduled-time"]'),
            },
        };
    }

    /**
     * Returns the dom node for the collapse box component for this coverage
     * @returns {Locator}
     */
    get element(): Locator {
        return this.parentEditor.element
            .getByTestId(`field-coverages[${this.index}]`);
    }

    /**
     * Waits until the coverage array components are mounted and visible
     */
    async waitTillVisible() {
        await this.parentEditor.element
            .getByTestId('field-coverages')
            .waitFor({state: 'visible'});
    }

    /**
     * Returns the dom node for the REASSIGN button
     * @returns {Locator}
     */
    get reassignButton(): Locator {
        return this.element.getByRole('button', {name: 'Reassign', exact: true});
    }

    /**
     * Returns the dom node for the REMOVE button
     * @returns {Locator}
     */
    get removeButton(): Locator {
        return this.element.getByRole('button', {name: 'Remove', exact: true});
    }

    /**
     * Returns the dom node for the EDIT button for the assignment
     * @returns {Locator}
     */
    get editAssignmentButton(): Locator {
        return this.element.getByRole('button', {name: 'Assign', exact: true});
    }

    /**
     * Returns the ActionMenu instance for this coverage
     * @returns {ActionMenu}
     */
    get actionMenu(): ActionMenu {
        return new ActionMenu(
            this.page,
            () => this.element,
        );
    }

    /**
     * Opens up the action menu, and click on the specific action
     * @param {string} label - The action to execute on this coverage
     */
    async clickAction(label: string): Promise<void> {
        const menu = this.actionMenu;

        await menu.open();
        await menu.getAction(label).click();
    }

    // Selecting a value on a fresh coverage races the autosave-driven remount,
    // which can drop the selection. Retry until it sticks in the field.
    async setPriority(value: string): Promise<void> {
        await expect(async () => {
            await this.getField('priority').type(value);
            await expect(this.element.getByTestId('field-priority')).toContainText(value, {timeout: 3000});
        }).toPass({timeout: 20000});
    }

    async collapse(): Promise<void> {
        await this.element.getByRole('button', {name: 'Collapse', exact: true}).click();
    }

    async expand(): Promise<void> {
        await this.element.locator('.sd-collapse-box__header').click();
    }

    async toggleAddToWorkflow(): Promise<void> {
        await this.element
            .getByTestId('field-add_coverage_to_workflow')
            .getByRole('checkbox')
            .click();
    }
}
