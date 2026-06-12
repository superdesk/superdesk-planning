import {test} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../utils/common';
import {PlanningList, EventEditor} from '../page-object-models/planning';

test.describe('Planning.Events: autosave', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;
    let list: PlanningList;
    let workqueue: Workqueue;

    let event;
    let expectedEvent;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        workqueue = new Workqueue(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
    });

    test('creating a new event', async ({page}) => {
        event = {
            'dates.start.date': '12/12/2045',
            'dates.start.time': '00:00',
            'dates.end.time': '00:59',
            slugline: 'Event',
            name: 'Test',
            definition_short: 'Desc.',
            definition_long: 'Desc. Long',
            internal_note: 'Internal',
            ednote: 'Ed. Note',
            occur_status: 'Planned, occurence planned only',

            calendars: ['Sport', 'Finance'],
            anpa_category: ['Domestic Sport'],
            subject: ['sports awards'],

            links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
        };

        expectedEvent = Object.assign({}, event, {
            'dates.end.date': '12/12/2045',
        });

        await list.expectEmpty();
        await editor.expectItemType();
        await workqueue.expectTitle(0, 'Untitled*');

        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(expectedEvent);
        await editor.minimiseButton.click();

        await workqueue.getItem(0).click();
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedEvent);

        // Navigate to Workspace, then back to Planning
        await page.goto('/#/workspace');
        await page.goto('/#/planning');
        await waitForPageLoad.planning(page);

        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedEvent);

        // Refresh the page while the Event is open in the Editor
        await page.reload();
        await waitForPageLoad.planning(page);
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedEvent);

        // Now minimize the item and reload the page
        // so the editor is not open when the page opens
        await editor.minimiseButton.click();
        await page.reload();
        await waitForPageLoad.planning(page);
        await workqueue.getItem(0).click();
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedEvent);

        // Now save the Event
        await editor.createButton.click();
    });
});
