import {
    App,
    UI,
    Editors,
} from '../../support';

describe('edit planning', () => {
    const editor = new Editors.PlanningEditor();

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});

        cy.visit('/#/planning');
        App.login();

        UI.waitForPageLoad();
        UI.SubNavBar.createPlanning();
        editor.waitTillOpen();
    });

    it('can create a Planning item', () => {
        const plan = {
            slugline: 'slugline of the planning',
            headline: 'headline of the planning',
            name: 'name of the planning',
            'planning_date.date': '12/12/2045',
            'planning_date.time': '12:13',
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],
            urgency: '2',
            'flags.marked_for_not_publication': true,
        };

        const coverages = [{
            content_type: 'Text',
            genre: 'Factbox',
            slugline: 'coverage slugline',
            ednote: 'something to write about',
            internal_note: 'internal to us',
            news_coverage_status: 'On merit',
            'scheduled.date': '12/12/2045',
            'scheduled.time': '13:15',
        }];

        UI.ListPanel.expectEmpty();
        editor.expectItemType();
        UI.Workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(plan);
        editor.typeCoverages(coverages);
        editor.expect(plan);
        editor.expectCoverages(coverages);
        editor.waitForAutosave();

        UI.Workqueue.expectTitle(0, 'headline of the planning*');
        editor.createButton.click();
        editor.waitLoadingComplete();
        UI.ListPanel.expectItemCount(1);
        UI.ListPanel.expectItemText(0, 'slugline of the planning');
        UI.Workqueue.expectTitle(0, 'headline of the planning');
    });

    it('can add coverage to workflow', () => {
        editor.type({
            slugline: 'Plan',
            name: 'Namer',
            'planning_date.date': '12/12/2045',
            'planning_date.time': '12:13',
        });
        editor.addCoverage('Picture');

        let coverageEditor = editor.getCoverageEditor(0);
        let assignmentEditor = new Editors.AssignmentEditor();

        coverageEditor.editAssignmentButton.click();
        assignmentEditor.wait();
        assignmentEditor.type({
            desk: 'Politic Desk',
        });
        assignmentEditor.okButton.click();
        assignmentEditor.waitForClose();

        editor.waitForAutosave();
        editor.createButton.click();
        editor.waitLoadingComplete();

        coverageEditor.element.click();
        coverageEditor.clickAction('Add to workflow');
    });
});
