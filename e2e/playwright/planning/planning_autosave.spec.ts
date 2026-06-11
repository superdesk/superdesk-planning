import {test} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../utils/common';
import {PlanningList, PlanningEditor, CoverageEditor} from '../page-object-models/planning';

test.describe('Planning.Planning: autosave', () => {
    let editor: PlanningEditor;
    let subnav: SubNavBar;
    let list: PlanningList;
    let workqueue: Workqueue;
    let coverageEditor: CoverageEditor;
    let plan;
    let coverages;

    test.beforeEach(async ({page}) => {
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        workqueue = new Workqueue(page);
        coverageEditor = editor.getCoverageEditor(0);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createPlanning();
        await editor.waitTillOpen();
    });

    test('creating a new planning item', async ({page}) => {
        plan = {
            slugline: 'Plan',
            'planning_date.date': '13/12/2045',
            'planning_date.time': '12:13',
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',
            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport'],
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

        await list.expectEmpty();
        await editor.expectItemType();
        await workqueue.expectTitle(0, 'Untitled*');

        await editor.openAllToggleBoxes();
        await editor.type(plan);
        await editor.typeCoverages(coverages);
        await editor.expect(plan);
        await editor.expectCoverages(coverages);
        await editor.minimiseButton.click();

        await workqueue.getItem(0).click();
        await editor.waitTillOpen();
        await editor.openAllToggleBoxes();
        await coverageEditor.element.click();
        await editor.expect(plan);
        await editor.expectCoverages(coverages);

        // Navigate to Workspace, then back to Planning
        await page.goto('/#/workspace');
        await page.goto('/#/planning');
        await waitForPageLoad.planning(page);

        await editor.openAllToggleBoxes();
        await coverageEditor.element.click();
        await editor.expect(plan);
        await editor.expectCoverages(coverages);

        // Refresh the page while the Event is open in the Editor
        await page.reload();
        await waitForPageLoad.planning(page);
        await editor.openAllToggleBoxes();
        await coverageEditor.element.click();
        await editor.expect(plan);
        await editor.expectCoverages(coverages);

        // Now minimize the item and reload the page
        // so the editor is not open when the page opens
        await editor.minimiseButton.click();
        await page.reload();
        await waitForPageLoad.planning(page);
        await workqueue.getItem(0).click();
        await editor.waitTillOpen();
        await editor.openAllToggleBoxes();
        await coverageEditor.element.click();
        await editor.expect(plan);
        await editor.expectCoverages(coverages);

        // Now save the Event
        await editor.createButton.click();
    });
});
