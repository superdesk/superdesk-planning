import {setup, login, waitForPageLoad, SubNavBar, changeWorkspace, Modal} from '../../support/common';
import {PlanningList, PlanningEditor, AssignmentEditor} from '../../support/planning';
import {getMenuItem} from '../../support/common/ui/actionMenu';

describe('Planning.Assignment: remove assignment', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    let modal = new Modal();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createPlanning();
        editor.waitTillOpen();
    });

    it('can remove Assignment', () => {
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

        list.item(0).click();
        getMenuItem(list.item(0), 'Remove Assignment')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);
        modal.element.find('.btn--primary')
            .click();
        modal.waitTillClosed(30000);
        list.expectItemCount(0);

        changeWorkspace('Planning');
        waitForPageLoad.planning();
        editor.waitTillOpen();
        coverageEditor.waitTillVisible();
        coverageEditor.element
            .should('contain.text', 'Unassigned');
        coverageEditor.element
            .find('.label')
            .should('contain.text', 'Draft');
    });
});
