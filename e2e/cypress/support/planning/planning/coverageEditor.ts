import {Editor} from '../../common/editor';
import {Input, SelectInput, ActionMenu} from '../../common';
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
    constructor(parentEditor: PlanningEditor, index) {
        super('', '');

        this.parentEditor = parentEditor;
        this.index = index;

        const getParent = () => this.element;

        this.fields = {
            content_type: new SelectInput(getParent, '[data-test-id="field-g2_content_type"] select'),
            genre: new SelectInput(getParent, '[data-test-id="field-genre"] select'),
            slugline: new Input(getParent, '[data-test-id="field-slugline"] input'),
            ednote: new Input(getParent, '[data-test-id="field-ednote"] textarea'),
            internal_note: new Input(getParent, '[data-test-id="field-internal_note"] textarea'),
            news_coverage_status: new SelectInput(getParent, '[data-test-id="field-news_coverage_status"] select'),
            scheduled: {
                date: new Input(getParent, 'input[name="planning.scheduled.date"]'),
                time: new Input(getParent, 'input[name="planning._scheduledTime"]'),
            },
        };
    }

    /**
     * Returns the dom node for the collapse box component for this coverage
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element(): Cypress.Chainable<JQuery<HTMLElement>> {
        return this.parentEditor.element
            .find(`[data-test-id="field-coverages[${this.index}]"]`);
    }

    /**
     * Waits until the coverage array components are mounted and visible
     * @param {number} timeout - The number of ms to wait for coverages to be visible
     */
    waitTillVisible(timeout = 30000) {
        this.parentEditor.element
            .find('[data-test-id="field-coverages"]', {timeout: timeout})
            .should('exist');
    }

    /**
     * Returns the dom node for the REASSIGN button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get reassignButton() {
        return this.element.contains('Reassign')
            .should('exist');
    }

    /**
     * Returns the dom node for the REMOVE button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get removeButton() {
        return this.element.contains('Remove')
            .should('exist');
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
