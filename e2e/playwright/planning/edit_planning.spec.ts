import {test, expect} from '@playwright/test';
import moment from 'moment/moment';

import {setup, login, waitForPageLoad, SubNavBar, Workqueue, CLIENT_FORMAT} from '../utils/common';
import {PlanningList, PlanningEditor, AssignmentEditor} from '../page-object-models/planning';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';
import {enableCoverageExtraFields} from '../utils/fixtures/coverage_profile';

test.describe('Planning.Planning: edit metadata', () => {
    let editor: PlanningEditor;
    let list: PlanningList;
    let subnav: SubNavBar;
    let workqueue: Workqueue;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);
        workqueue = new Workqueue(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await setupPlanningPublishing(page.request);
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createPlanning();
        await editor.waitTillOpen();
    });

    test('can create a Planning item', async () => {
        const plan = {
            slugline: 'slugline of the planning',
            'planning_date.date': moment().format(CLIENT_FORMAT),
            'planning_date.time': '12:13',
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport'],
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
            'scheduled.date': moment().format(CLIENT_FORMAT),
            'scheduled.time': '13:15',
        }];

        await list.expectEmpty();
        await editor.expectItemType();
        await workqueue.expectTitle(0, 'Untitled*');

        await editor.openAllToggleBoxes();
        await editor.type(plan);
        await editor.typeCoverages(coverages);
        await editor.expect(plan);
        await editor.expectCoverages(coverages);
        await editor.waitForAutosave();

        await workqueue.expectTitle(0, 'slugline of the planning*');
        await editor.createButton.click();
        await editor.waitLoadingComplete();
        await list.expectItemCount(1);
        await list.expectItemText(0, 'slugline of the planning');
        await workqueue.expectTitle(0, 'slugline of the planning');
    });

    test('can add coverage to workflow', async ({page}) => {
        await editor.type({
            slugline: 'Plan',
            'planning_date.date': moment().format(CLIENT_FORMAT),
            'planning_date.time': '12:13',
        });
        await editor.addCoverage('Picture');

        let coverageEditor = editor.getCoverageEditor(0);
        let assignmentEditor = new AssignmentEditor(page);

        await coverageEditor.editAssignmentButton.click();
        await assignmentEditor.waitTillOpen();
        await assignmentEditor.type({
            desk: 'Politic Desk',
        });
        await assignmentEditor.okButton.click();
        await assignmentEditor.waitTillClosed();

        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();

        await coverageEditor.element.click();
        await coverageEditor.toggleAddToWorkflow();
    });

    test('not_for_publication flag will not enable post button', async () => {
        const plan = {
            slugline: 'slugline of the planning',
            'planning_date.date': moment().format(CLIENT_FORMAT),
            'planning_date.time': '12:13',
        };

        await list.expectEmpty();
        await editor.expectItemType();
        await workqueue.expectTitle(0, 'Untitled*');

        await editor.openAllToggleBoxes();
        await editor.type(plan);
        await editor.expect(plan);

        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();
        await expect(editor.postButton).toBeVisible();

        await editor.openAllToggleBoxes();
        await editor.type({description_text: 'Desc. Text'});
        await editor.expect({description_text: 'Desc. Text'});
        await editor.type({
            'flags.marked_for_not_publication': true,
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport'],
            subject: ['sports awards'],
        });
        await editor.waitForAutosave();
        await editor.waitTillOpen();
        await expect(editor.postButton).not.toBeVisible();

        await editor.type({
            'flags.marked_for_not_publication': false,
            description_text: 'Other Desc. Text',
            internal_note: 'Other Int. Note',
            ednote: 'Other Ed. Note',
        });
        await editor.waitForAutosave();
        await editor.waitTillOpen();
        await expect(editor.postButton).toBeVisible();
    });

    test('Post updates the initial values', async () => {
        // Enter minimum Planning metadata
        await editor.expectItemType();
        await editor.type({
            slugline: 'slugline of the planning',
            'planning_date.date': moment().format(CLIENT_FORMAT),
            'planning_date.time': '12:13',
        });

        // Create the Planning item
        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();

        // Post the Planning item
        await editor.postButton.click();

        // Make sure POST button changes to UNPOST
        await editor.waitForAutosave();
        await expect(editor.postButton).not.toBeVisible();
        await editor.unpostButton.click();

        // Make sure the UNPOST button changes to POST
        await editor.waitForAutosave();
        await expect(editor.unpostButton).not.toBeVisible();
        await editor.postButton.click();

        // Once more, make sure the UNPOST button changes back to POST
        await editor.waitForAutosave();
        await expect(editor.postButton).not.toBeVisible();
        await expect(editor.unpostButton).toBeVisible();
    });
});

test.describe('Planning.Coverage: field persistence on collapse/expand', () => {
    let editor: PlanningEditor;
    let subnav: SubNavBar;

    test.beforeEach(async ({page}) => {
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await enableCoverageExtraFields(page.request);
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createPlanning();
        await editor.waitTillOpen();
    });

    test('coverage field values persist after collapsing and expanding', async () => {
        const coverage = {
            content_type: 'Text',
            genre: 'Factbox',
            slugline: 'coverage slugline',
            headline: 'coverage headline',
            ednote: 'something to write about',
            internal_note: 'internal to us',
            news_coverage_status: 'On merit',
            'scheduled.date': moment().format(CLIENT_FORMAT),
            'scheduled.time': '13:15',
            priority: '2',
        };

        await editor.type({
            slugline: 'Plan with coverage',
            'planning_date.date': moment().format(CLIENT_FORMAT),
            'planning_date.time': '12:13',
        });

        await editor.addCoverage('Text');
        const coverageEditor = editor.getCoverageEditor(0);

        // content_type is already set by addCoverage; re-selecting it resets the coverage.
        const {content_type, priority, ...textFields} = coverage;

        await coverageEditor.type(textFields);
        await editor.waitForAutosave();
        await coverageEditor.setPriority(priority);

        await coverageEditor.expect(coverage);

        await coverageEditor.collapse();
        await coverageEditor.expand();

        // SDESK-7989: priority rendered empty here before the fix
        await coverageEditor.expect(coverage);
    });
});
