import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../../support/common';
import {PlanningList, PlanningEditor} from '../../support/planning';

describe('Planning.Planning: autosave', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const workqueue = new Workqueue();
    let coverageEditor = editor.getCoverageEditor(0);
    let plan;
    let coverages;

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createPlanning();
        editor.waitTillOpen();
    });

    it('creating a new planning item', () => {
        plan = {
            slugline: 'Plan',
            'planning_date.date': '13/12/2045',
            'planning_date.time': '12:13',
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],
            urgency: '2',
            'flags.marked_for_not_publication': true,
        };

        coverages = [{
            content_type: 'Picture',
            genre: 'Factbox',
            slugline: 'coverage slugline',
            ednote: 'something to write about',
            internal_note: 'internal to us',
            news_coverage_status: 'On merit',
            'scheduled.date': '12/12/2045',
            'scheduled.time': '15:45',
        }];

        list.expectEmpty();
        editor.expectItemType();
        workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(plan);
        editor.typeCoverages(coverages);
        editor.expect(plan);
        editor.expectCoverages(coverages);
        editor.minimiseButton
            .should('exist')
            .click();

        workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Navigate to Workspace, then back to Planning
        cy.visit('/#/workspace');
        cy.visit('/#/planning');
        waitForPageLoad.planning();

        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Refresh the page while the Event is open in the Editor
        cy.reload();
        waitForPageLoad.planning();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Now minimize the item and reload the page
        // so the editor is not open when the page opens
        editor.minimiseButton
            .should('exist')
            .click();
        cy.reload();
        waitForPageLoad.planning();
        workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Now save the Event
        editor.createButton
            .should('exist')
            .click();
    });
});
