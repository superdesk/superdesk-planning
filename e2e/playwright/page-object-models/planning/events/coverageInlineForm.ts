import {expect} from '@playwright/test';
import type {Locator} from '@playwright/test';

/**
 * Wrapper around the inline "Coverage Types" form, rendered under the coverages of the
 * event editor when `planning_inline_coverage_form` is on.
 */
export class CoverageInlineForm {
    coveragesField: Locator;

    /**
     * @param {Locator} coveragesField - The coverages field of the editor holding the form
     */
    constructor(coveragesField: Locator) {
        this.coveragesField = coveragesField;
    }

    get element(): Locator {
        return this.coveragesField.getByTestId('coverage-inline-form');
    }

    /**
     * Returns the collapsible editor of an already added coverage.
     *
     * @param {number} index - The position of the coverage in the field
     * @returns {Locator}
     */
    coverage(index: number): Locator {
        return this.coveragesField.getByTestId(`field-coverages[${index}]`);
    }

    // A coverage renders as a collapsed box; its fields are only in the DOM once expanded.
    async expandCoverage(index: number): Promise<void> {
        const coverage = this.coverage(index);

        await coverage.locator('.sd-collapse-box__header').click();
        await expect(coverage.getByTestId('field-g2_content_type')).toBeVisible();
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
