import {Editor} from '../../common/editor';
import {CoverageEditor} from './coverageEditor';
import {Input, SelectMetaTerms, UrgencyInput, ToggleInput, Popup} from '../../common';

/**
 * Wrapper class around Superdesk's Planning editor component
 * @extends Editor
 */
export class PlanningEditor extends Editor {
    fields: {[key: string]: any};

    constructor() {
        super('.icon-calendar.icon--2x.icon--light-blue', 'planning');
        const getParent = () => this.element;

        this.fields = {
            name: new Input(getParent, '[data-test-id=field-name] input'),
            slugline: new Input(getParent, '[data-test-id=field-slugline] input'),
            headline: new Input(getParent, '[data-test-id=field-headline] input'),
            planning_date: {
                date: new Input(getParent, '[data-test-id=field-planning_date] input[name="planning_date.date"]'),
                time: new Input(getParent, '[data-test-id=field-planning_date] input[name="planning_date.time"]'),
            },
            description_text: new Input(getParent, '[data-test-id=field-description_text] textarea'),
            internal_note: new Input(getParent, '[data-test-id=field-internal_note] textarea'),
            ednote: new Input(getParent, '[data-test-id=field-ednote] textarea'),
            anpa_category: new SelectMetaTerms(getParent, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(getParent, '[data-test-id=field-subject]'),
            urgency: new UrgencyInput(getParent, '[data-test-id=field-urgency]'),
            flags: {
                marked_for_not_publication: new ToggleInput(
                    getParent,
                    '[data-test-id="field-flags.marked_for_not_publication"] > :first-child'
                ),
            },
        };
    }

    /**
     * Returns the dom node for the coverages (for use with the CoverageEditor wrapper)
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get coveragesContainer() {
        // return this.element.find('.coverages__array');
        return this.element.find('[data-test-id="field-coverages"]');
    }

    /**
     * Returns the dom node for the ADD COVERAGES button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get addCoverageButton() {
        return this.coveragesContainer
            .should('exist')
            .find('.sd-create-btn')
            .should('exist');
        // return this.element.find('[data-test-id="field-coverages"] .sd-create-btn');
        // return this.coveragesContainer.find('.sd-create-btn');
        // return this.coveragesContainer.find('.sd-create-btn');
    }

    /**
     * Adds a new coverage to this planning item
     * @param {string} coverageType - Name of the coverage type to add
     */
    addCoverage(coverageType) {
        cy.log('Planning.Planning.PlanningEditor.addCoverage');
        const popup = new Popup();

        this.addCoverageButton.click();
        popup.waitTillOpen();
        popup.element
            .contains(coverageType)
            .should('exist')
            .click();
        popup.waitTillClosed();
    }

    /**
     * Returns an instance of CoverageEditor for a specific coverage
     * @param {number} index - The index of the coverage to edit
     * @returns {CoverageEditor}
     */
    getCoverageEditor(index) {
        return new CoverageEditor(this, index);
    }

    /**
     * Types all the values into all the coverages from the given array of key/value pairs
     * @param {Array<Object>} coverages - List of key/value pairs for each coverage to add
     */
    typeCoverages(coverages) {
        cy.log('Planning.Planning.PlanningEditor.typeCoverages');
        let editor;

        coverages.forEach(
            (coverage, index) => {
                this.addCoverage(coverage.content_type);
                editor = this.getCoverageEditor(index);
                editor.type(coverage);
            }
        );
    }

    /**
     * Assert all the coverage values from the given array of key/value pairs
     * @param {Array<Object>} coverages - List of expected key/value pairs for each coverage expected
     */
    expectCoverages(coverages) {
        cy.log('Planning.Planning.PlanningEditor.expectCoverages');
        let editor;

        coverages.forEach(
            (coverage, index) => {
                editor = this.getCoverageEditor(index);
                editor.expect(coverage);
            }
        );
    }
}
