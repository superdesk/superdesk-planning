import {expect} from '@playwright/test';
import type {Locator} from '@playwright/test';

import {EmbeddedCoverageEditor} from './embeddedCoverageEditor';

/**
 * Wrapper around the inline "Coverage Types" form, rendered above the coverages of an
 * embedded planning item when `planning_inline_coverage_form` is on.
 */
export class CoverageInlineForm {
    editor: EmbeddedCoverageEditor;
    planningIndex: number;

    /**
     * @param {EmbeddedCoverageEditor} editor - The embedded planning editor holding the form
     * @param {number} planningIndex - The index of the planning item inside the event editor
     */
    constructor(editor: EmbeddedCoverageEditor, planningIndex: number) {
        this.editor = editor;
        this.planningIndex = planningIndex;
    }

    get element(): Locator {
        return this.editor.getPlanningItem(this.planningIndex)
            .getByTestId('coverage-inline-form');
    }

    get addButton(): Locator {
        return this.element.getByRole('button', {name: 'Add Coverage(s)', exact: true});
    }

    get cancelButton(): Locator {
        return this.element.getByRole('button', {name: 'Cancel', exact: true});
    }

    /**
     * Returns the content type line for a coverage type.
     * The duplicate button can add more lines for the same type; this is the original one.
     *
     * @param {string} qcode - The g2 content type qcode, e.g. 'text' or 'picture'
     * @returns {Locator}
     */
    row(qcode: string): Locator {
        return this.element.getByTestId(`coverage-inline-form__row--${qcode}`).first();
    }

    /**
     * Returns the Desk / user / Language / Status block a ticked content type reveals.
     *
     * @param {string} qcode - The g2 content type qcode, e.g. 'text' or 'picture'
     * @returns {Locator}
     */
    fields(qcode: string): Locator {
        return this.element.getByTestId(`coverage-inline-form__fields--${qcode}`).first();
    }

    /**
     * The ui-framework checkbox is a transparent `input` stacked over the styled box, so
     * it is the element that takes the click and the only one that carries the state.
     * It is invisible to the accessibility tree, hence the tag selector over a role.
     *
     * @param {string} qcode - The g2 content type qcode, e.g. 'text' or 'picture'
     * @returns {Locator}
     */
    checkbox(qcode: string): Locator {
        return this.row(qcode).locator('input[type="checkbox"]');
    }

    async enableType(qcode: string): Promise<void> {
        await this.checkbox(qcode).click();
        await expect(this.fields(qcode)).toBeVisible();
    }

    async setDesk(qcode: string, deskName: string): Promise<void> {
        await this.fields(qcode)
            .getByLabel('Desk', {exact: true})
            .selectOption({label: deskName});
    }

    async add(): Promise<void> {
        await this.addButton.click();
    }

    async cancel(): Promise<void> {
        await this.cancelButton.click();
    }

    async expectNoTypesEnabled(): Promise<void> {
        await expect(
            this.element.locator('[data-test-id^="coverage-inline-form__fields--"]')
        ).toHaveCount(0);
        await expect(this.element.locator('input[type="checkbox"]:checked')).toHaveCount(0);
    }
}
