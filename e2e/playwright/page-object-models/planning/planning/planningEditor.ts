import {Page, Locator} from '@playwright/test';

import {Editor} from '../../../utils/common/editor';
import {CoverageEditor} from './coverageEditor';
import {Input, SelectMetaTerms, ToggleInput, Popup, UrgencyTreeSelectInput, TreeSelect} from '../../../utils/common';

/**
 * Wrapper class around Superdesk's Planning editor component
 * @extends Editor
 */
export class PlanningEditor extends Editor {
    fields: {[key: string]: any};

    constructor(page: Page) {
        super(page, '.icon-calendar.icon--2x.icon--light-blue', 'planning');
        const getParent = () => this.element;

        this.fields = {
            name: new Input(page, getParent, '[data-test-id=field-name] input'),
            slugline: new Input(page, getParent, '[data-test-id=field-slugline] input'),
            headline: new Input(page, getParent, '[data-test-id=field-headline] input'),
            planning_date: {
                date: new Input(page, getParent, '[data-test-id=field-planning_date] input[name="planning_date.date"]'),
                time: new Input(page, getParent, '[data-test-id=field-planning_date] input[name="planning_date.time"]'),
            },
            description_text: new Input(page, getParent, '[data-test-id=field-description_text] textarea'),
            internal_note: new Input(page, getParent, '[data-test-id=field-internal_note] textarea'),
            ednote: new Input(page, getParent, '[data-test-id=field-ednote] textarea'),
            anpa_category: new TreeSelect(page, getParent, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(page, getParent, '[data-test-id=field-subject]'),
            urgency: new UrgencyTreeSelectInput(page, getParent, '[data-test-id=field-urgency]'),
            flags: {
                marked_for_not_publication: new ToggleInput(
                    page,
                    getParent,
                    '[data-test-id="field-marked_for_not_publication"]',
                ),
            },
        };
    }

    /**
     * Returns the dom node for the coverages (for use with the CoverageEditor wrapper)
     * @returns {Locator}
     */
    get coveragesContainer(): Locator {
        return this.element.getByTestId('field-coverages');
    }

    /**
     * Returns the dom node for the ADD COVERAGES button
     * @returns {Locator}
     */
    get addCoverageButton(): Locator {
        return this.coveragesContainer.getByTestId('create-button');
    }

    /**
     * Adds a new coverage to this planning item
     * @param {string} coverageType - Name of the coverage type to add
     */
    async addCoverage(coverageType: string): Promise<void> {
        const popup = new Popup(this.page);

        await this.addCoverageButton.click();
        await popup.waitTillOpen();
        await popup.element
            .getByText(coverageType)
            .click();
        await popup.waitTillClosed();
    }

    /**
     * Returns an instance of CoverageEditor for a specific coverage
     * @param {number} index - The index of the coverage to edit
     * @returns {CoverageEditor}
     */
    getCoverageEditor(index: number): CoverageEditor {
        return new CoverageEditor(this, index);
    }

    /**
     * Types all the values into all the coverages from the given array of key/value pairs
     * @param {Array<Object>} coverages - List of key/value pairs for each coverage to add
     */
    async typeCoverages(coverages: Array<any>): Promise<void> {
        let editor: CoverageEditor;

        for (let index = 0; index < coverages.length; index++) {
            const coverage = coverages[index];

            await this.addCoverage(coverage.content_type);
            editor = this.getCoverageEditor(index);
            await editor.type(coverage);
        }
    }

    /**
     * Assert all the coverage values from the given array of key/value pairs
     * @param {Array<Object>} coverages - List of expected key/value pairs for each coverage expected
     */
    async expectCoverages(coverages: Array<any>): Promise<void> {
        let editor: CoverageEditor;

        for (let index = 0; index < coverages.length; index++) {
            const coverage = coverages[index];

            editor = this.getCoverageEditor(index);
            await editor.expect(coverage);
        }
    }
}
