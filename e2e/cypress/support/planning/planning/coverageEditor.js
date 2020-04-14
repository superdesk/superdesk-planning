import {Editor} from '../../common/editor';
import {Input, SelectInput} from '../../common/inputs';
import {ActionMenu} from '../../common/ui';

/**
 * Wrapper class around Superdesk's Coverage editor component
 * @extends Editor
 */
export class CoverageEditor extends Editor {
    /**
     * Creates an instance of the Editor instance.
     * @param {PlanningEditor} parentEditor - The parent editor to this coverage
     * @param {number} index - The index of this coverage inside the planning item
     */
    constructor(parentEditor, index) {
        super();

        this.parentEditor = parentEditor;
        this.index = index;

        const prefix = `coverages[${this.index}].`;

        this.fields = {
            content_type: new SelectInput(() => this.element, `select[name="${prefix}planning.g2_content_type"]`),
            genre: new SelectInput(() => this.element, `select[name="${prefix}planning.genre"]`),
            slugline: new Input(() => this.element, `input[name="${prefix}planning.slugline"]`),
            ednote: new Input(() => this.element, `textarea[name="${prefix}planning.ednote"]`),
            internal_note: new Input(() => this.element, `textarea[name="${prefix}planning.internal_note"]`),
            news_coverage_status: new SelectInput(() => this.element, `select[name="${prefix}news_coverage_status"]`),
            scheduled: {
                date: new Input(() => this.element, `input[name="${prefix}planning.scheduled.date"]`),
                time: new Input(() => this.element, `input[name="${prefix}planning._scheduledTime"]`),
            },
        };
    }

    /**
     * Returns the dom node for the collapse box component for this coverage
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return this.parentEditor.element
            .find('.coverages__array')
            .find('.sd-collapse-box')
            .eq(this.index);
    }

    /**
     * Waits until the coverage array components are mounted and visible
     * @param {number} timeout - The number of ms to wait for coverages to be visible
     */
    waitTillVisible(timeout = 30000) {
        this.parentEditor.element
            .find('.coverages__array', {timeout: timeout})
            .should('exist');
    }

    /**
     * Returns the dom node for the REASSIGN button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get reassignButton() {
        return this.element.contains('Reassign');
    }

    /**
     * Returns the dom node for the REMOVE button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get removeButton() {
        return this.element.contains('Remove');
    }

    /**
     * Returns the dom node for the EDIT button for the assignment
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get editAssignmentButton() {
        return this.element.find('#editAssignment');
    }

    /**
     * Returns the dom node for the assign button for the assignment
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get submitAssignmentButton() {
        return this.element.find('#submitAssignment');
    }

    /**
     * Returns the ActionMenu instance for this coverage
     * @returns {ActionMenu}
     */
    get actionMenu() {
        return new ActionMenu(
            () => this.element
        );
    }

    /**
     * Opens up the action menu, and click on the specific action
     * @param {string} label - The action to execute on this coverage
     */
    clickAction(label) {
        cy.log('Planning.Planning.CoverageEditor.clickAction');
        this.actionMenu
            .open()
            .getAction(label)
            .click();
    }
}
