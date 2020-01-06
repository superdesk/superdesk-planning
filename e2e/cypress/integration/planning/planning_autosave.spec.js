import {
    App,
    UI,
    Editors,
} from '../../support';

describe('planning autosave', () => {
    const editor = new Editors.PlanningEditor();
    let coverageEditor = editor.getCoverageEditor(0);
    let plan;
    let coverages;

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});

        cy.visit('/#/planning');
        App.login();

        UI.waitForPageLoad();
        UI.SubNavBar.createPlanning();
        editor.waitTillOpen();
    });

    it('creating a new planning item', () => {
        plan = {
            slugline: 'Plan',
            headline: 'Header',
            name: 'Namer',
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

        UI.ListPanel.expectEmpty();
        editor.expectItemType();
        UI.Workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(plan);
        editor.typeCoverages(coverages);
        editor.expect(plan);
        editor.expectCoverages(coverages);
        editor.minimiseButton.click();

        UI.Workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Navigate to Workspace, then back to Planning
        cy.visit('/#/workspace');
        cy.visit('/#/planning');
        UI.waitForPageLoad();

        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Refresh the page while the Event is open in the Editor
        cy.reload();
        UI.waitForPageLoad();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Now minimize the item and reload the page
        // so the editor is not open when the page opens
        editor.minimiseButton.click();
        cy.reload();
        UI.waitForPageLoad();
        UI.Workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        coverageEditor.element.click();
        editor.expect(plan);
        editor.expectCoverages(coverages);

        // Now save the Event
        editor.createButton.click();
    });
});
