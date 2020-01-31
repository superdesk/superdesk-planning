import {Editor} from '../../common/editor';
import {CoverageEditor} from './coverageEditor';
import {Input, SelectMetaTerms, UrgencyInput, ToggleInput} from '../../common/inputs';
import {Popup} from '../../common/ui';

/**
 * Wrapper class around Superdesk's Planning editor component
 * @extends Editor
 */
export class PlanningEditor extends Editor {
    constructor() {
        super('.icon-calendar.icon--2x.icon--light-blue');

        this.fields = {
            name: new Input(() => this.element, 'input[name="name"]'),
            slugline: new Input(() => this.element, 'input[name="slugline"]'),
            headline: new Input(() => this.element, 'input[name="headline"]'),
            planning_date: {
                date: new Input(() => this.element, 'input[name="planning_date.date"]'),
                time: new Input(() => this.element, 'input[name="planning_date.time"]'),
            },
            description_text: new Input(() => this.element, 'textarea[name="description_text"]'),
            internal_note: new Input(() => this.element, 'textarea[name="internal_note"]'),
            ednote: new Input(() => this.element, 'textarea[name="ednote"]'),
            anpa_category: new SelectMetaTerms(() => this.element, '#form-row-anpa_category'),
            subject: new SelectMetaTerms(() => this.element, '#form-row-subject'),
            urgency: new UrgencyInput(() => this.element, '#form-row-urgency'),
            flags: {
                marked_for_not_publication: new ToggleInput(
                    () => this.element,
                    'button[name="flags.marked_for_not_publication"]'
                ),
            },
        };
    }

    /**
     * Returns the dom node for the coverages (for use with the CoverageEditor wrapper)
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get coveragesContainer() {
        return this.element.find('.coverages__array');
    }

    /**
     * Returns the dom node for the ADD COVERAGES button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get addCoverageButton() {
        return this.coveragesContainer.find('.sd-create-btn');
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
