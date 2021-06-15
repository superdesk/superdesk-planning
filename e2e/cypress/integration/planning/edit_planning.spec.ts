import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../../support/common';
import {PlanningList, PlanningEditor, AssignmentEditor} from '../../support/planning';

describe('Planning.Planning: edit metadata', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const workqueue = new Workqueue();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createPlanning();
        editor.waitTillOpen();
    });

    it('can create a Planning item', () => {
        const plan = {
            slugline: 'slugline of the planning',
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

        list.expectEmpty();
        editor.expectItemType();
        workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(plan);
        editor.typeCoverages(coverages);
        editor.expect(plan);
        editor.expectCoverages(coverages);
        editor.waitForAutosave();

        workqueue.expectTitle(0, 'slugline of the planning*');
        editor.createButton
            .should('exist')
            .click();
        editor.waitLoadingComplete();
        list.expectItemCount(1);
        list.expectItemText(0, 'slugline of the planning');
        workqueue.expectTitle(0, 'slugline of the planning');
    });

    it('can add coverage to workflow', () => {
        editor.type({
            slugline: 'Plan',
            'planning_date.date': '12/12/2045',
            'planning_date.time': '12:13',
        });
        editor.addCoverage('Picture');

        let coverageEditor = editor.getCoverageEditor(0);
        let assignmentEditor = new AssignmentEditor();

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
        coverageEditor.clickAction('Add to workflow');
    });

    it('not_for_publication flag will not enable post button', () => {
        const plan = {
            slugline: 'slugline of the planning',
            'planning_date.date': '12/12/2045',
            'planning_date.time': '12:13',
        };

        list.expectEmpty();
        editor.expectItemType();
        workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(plan);
        editor.expect(plan);

        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();
        editor.waitLoadingComplete();

        editor.openAllToggleBoxes();
        editor.type({description_text: 'Desc. Text'});
        editor.expect({description_text: 'Desc. Text'});
        editor.waitForAutosave();
        editor.waitTillOpen();
        editor.postButton.should('exist');


        editor.type({
            'flags.marked_for_not_publication': true,
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],
        });
        editor.waitForAutosave();
        editor.waitTillOpen();
        editor.postButton.should('not.exist');

        editor.type({
            'flags.marked_for_not_publication': false,
            description_text: 'Other Desc. Text',
            internal_note: 'Other Int. Note',
            ednote: 'Other Ed. Note',
        });
        editor.waitForAutosave();
        editor.waitTillOpen();
        editor.postButton.should('exist');
    });

    it('SDESK-5982: Post updates the initial values', () => {
        // Enter minimum Planning metadata
        editor.expectItemType();
        editor.type({
            slugline: 'slugline of the planning',
            'planning_date.date': '12/12/2045',
            'planning_date.time': '12:13',
        });

        // Create the Planning item
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .should('be.enabled')
            .click();
        editor.waitLoadingComplete();

        // Post the Planning item
        editor.postButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Make sure POST button changes to UNPOST
        editor.waitForAutosave();
        editor.postButton.should('not.exist');
        editor.unpostButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Make sure the UNPOST button changes to POST
        editor.waitForAutosave();
        editor.unpostButton.should('not.exist');
        editor.postButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Once more, make sure the UNPOST button changes back to POST
        editor.waitForAutosave();
        editor.postButton.should('not.exist');
        editor.unpostButton
            .should('exist')
            .should('be.enabled');
    });
});
