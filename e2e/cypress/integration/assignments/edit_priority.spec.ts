import {setup, login, waitForPageLoad, SubNavBar, changeWorkspace, Modal, UrgencyInput} from '../../support/common';
import {PlanningList, PlanningEditor, AssignmentEditor} from '../../support/planning';
import {getMenuItem} from '../../support/common/ui/actionMenu';

describe('Planning.Assignment: edit assignment priority', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    let modal = new Modal();
    const priorityInput = new UrgencyInput(() => modal.element, '.sd-line-input');

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createPlanning();
        editor.waitTillOpen();
    });

    it('can edit Assignment priority', () => {
        editor.type({slugline: 'Slugline'});
        editor.addCoverage('Text');

        const coverageEditor = editor.getCoverageEditor(0);
        const assignmentEditor = new AssignmentEditor();

        coverageEditor.editAssignmentButton.click();
        assignmentEditor.waitTillOpen();
        assignmentEditor.type({
            desk: 'Politic Desk',
        });
        assignmentEditor.okButton.click();
        assignmentEditor.waitTillClosed();

        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();
        editor.waitLoadingComplete();

        coverageEditor.element.click();
        coverageEditor.element
            .find('.sd-collapse-box__content-block--top')
            .should('contain.text', 'Politic Desk');
        coverageEditor.element
            .find('.sd-collapse-box__content-block--top')
            .find('.label')
            .should('contain.text', 'Draft');
        coverageEditor.clickAction('Add to workflow');

        editor.waitForAutosave();
        coverageEditor.element
            .find('.sd-collapse-box__content-block--top')
            .find('.label')
            .should('contain.text', 'Assigned');
        changeWorkspace('Assignments');

        list.expectItemCount(1, 180000);
        list.expectItemText(0, 'Slugline');
        list.item(0)
            .find('.priority-label--2')
            .should('exist');

        list.item(0).click();
        getMenuItem(list.item(0), 'Edit Priority')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);
        priorityInput.type('High');
        modal.element.find('.btn--primary')
            .click();
        modal.waitTillClosed(30000);

        list.item(0)
            .find('.priority-label--1')
            .should('exist');
    });
});
