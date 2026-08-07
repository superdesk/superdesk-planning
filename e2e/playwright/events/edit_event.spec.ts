import {test, expect} from '@playwright/test';
import moment from 'moment';
import {cloneDeep} from 'lodash';

import {setup, login, waitForPageLoad, SubNavBar, Workqueue, Modal, addItems, CLIENT_FORMAT} from '../utils/common';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {createEventFor, TEST_EVENTS} from '../utils/fixtures/events';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';

test.describe('Planning.Events: edit metadata', {
    annotation: [
        {type: 'confluence', description: '1311835122 complete'}, // Assign event to calendar
    ],
}, () => {
    let editor: EventEditor;
    let list: PlanningList;
    let subnav: SubNavBar;
    let workqueue: Workqueue;
    let modal: Modal;
    let event: any;
    let expectedEvent: any;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        workqueue = new Workqueue(page);
        modal = new Modal(page);

        event = {
            'dates.start.date': moment().format(CLIENT_FORMAT),
            slugline: 'slugline of the event',
            name: 'name of the event',
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

        expectedEvent = {
            ...event,
            'dates.end.date': moment().format(CLIENT_FORMAT),
        };

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
    });

    test('can create an Event', {
        annotation: [
            {type: 'confluence', description: '1311835116 complete'}, // Create new event
        ],
    }, async () => {
        await list.expectEmpty();
        await editor.expectItemType();
        await workqueue.expectTitle(0, 'Untitled*');

        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(expectedEvent);
        await editor.waitForAutosave();

        await workqueue.expectTitle(0, 'slugline of the event*');
        await editor.createButton.click();
        await list.expectItemCount(1);
        await list.expectItemText(0, 'slugline of the event');
        await workqueue.expectTitle(0, 'slugline of the event');
    });

    test('can create a Recurring Event', async ({page}) => {
        await setupPlanningPublishing(page.request);
        await list.expectEmpty();
        await editor.expectItemType();

        // TODO(petr): make recurring events work with all day events
        event = {
            ...event,
            'dates.recurring.enable': true,
            'dates.recurring.until': moment().add(2, 'day')
                .format(CLIENT_FORMAT),
            slugline: 'slugline of the recurring event',
            name: 'name of the recurring event',
        };
        expectedEvent = {
            ...expectedEvent,
            'dates.recurring.enable': true,
            'dates.recurring.until': moment().add(2, 'day')
                .format(CLIENT_FORMAT),
            slugline: 'slugline of the recurring event',
            name: 'name of the recurring event',
        };

        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(expectedEvent);

        await editor.waitForAutosave();
        await editor.createButton.click();
        await list.expectItemCount(3);
        await list.expectItemText(0, 'slugline of the recurring event');
        await list.expectItemText(1, 'slugline of the recurring event');
        await list.expectItemText(2, 'slugline of the recurring event');

        // Test cancelling the Post modal
        await editor.postButton.click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Cancel')
            .click();
        await modal.waitTillClosed();

        // Test posting the series
        await editor.postButton.click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Post')
            .click();
        await modal.waitTillClosed();

        // Make sure both recurring Events now have the 'Scheduled' badge
        await expect(
            list.item(0).locator('.label--success'),
        ).toContainText('Scheduled');
        await expect(
            list.item(1).locator('.label--success'),
        ).toContainText('Scheduled');
        await expect(
            list.item(2).locator('.label--success'),
        ).toContainText('Scheduled');
    });

    test('Post updates the initial values', {
        annotation: [
            {type: 'confluence', description: '1311835145 complete'}, // Post event
        ],
    }, async ({page}) => {
        await setupPlanningPublishing(page.request);
        // Enter minimum Event metadata
        await editor.expectItemType();
        await editor.type({
            'dates.start.date': moment().format(CLIENT_FORMAT),
            slugline: 'slugline of the event',
            name: 'name of the event',
        });

        // Create the Event item
        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();

        // Post the Event item
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

test.describe('Planing.Events: edit existing events', {
    annotation: [
        {type: 'confluence', description: '1311835118 complete'}, // Edit event
    ],
}, () => {
    let list: PlanningList;
    let editor: EventEditor;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        editor = new EventEditor(page);
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.tomorrow({
            ...cloneDeep(TEST_EVENTS.date_01_02_2045),
        }), createEventFor.tomorrow({
            ...cloneDeep(TEST_EVENTS.date_02_02_2045),
        }, null),
        ]);

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('Edit events with no timezone', async () => {
        // Test if we can edit an Event without a timezone value
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.type({definition_short: 'Modifying 1st event'});
        await editor.waitForAutosave();
        await editor.saveButton.click();
        await editor.closeButton.click();
        await editor.waitTillClosed();

        // test if we can edit an Event with a timezone value of `null`
        await list.item(1).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.type({definition_short: 'Modifying 2nd event'});
        await editor.waitForAutosave();
        await editor.saveButton.click();
        await editor.closeButton.click();
        await editor.waitTillClosed();
    });
});
