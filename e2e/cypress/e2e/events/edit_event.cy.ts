import {cloneDeep} from 'lodash';

import {setup, login, waitForPageLoad, SubNavBar, Workqueue, Modal, addItems} from '../../support/common';
import {EventEditor, PlanningList} from '../../support/planning';
import {TEST_EVENTS} from '../../fixtures/events';

const list = new PlanningList();
const editor = new EventEditor();

describe('Planning.Events: edit metadata', () => {
    const subnav = new SubNavBar();
    const workqueue = new Workqueue();
    const modal = new Modal();
    let event;
    let expectedEvent;

    beforeEach(() => {
        event = {
            'dates.start.date': '12/12/2045',
            slugline: 'slugline of the event',
            name: 'name of the event',
            definition_short: 'Desc.',
            definition_long: 'Desc. Long',
            internal_note: 'Internal',
            ednote: 'Ed. Note',
            occur_status: 'Planned, occurence planned only',

            calendars: ['Sport', 'Finance'],
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],

            links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
        };

        expectedEvent = {
            ...event,
            'dates.end.date': '12/12/2045',
        };

        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();

        waitForPageLoad.planning();
        subnav.createEvent();
        editor.waitTillOpen();
    });

    it('can create an Event', () => {
        event['dates.allDay'] = true;
        expectedEvent['dates.allDay'] = true;

        list.expectEmpty();
        editor.expectItemType();
        workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(event);
        editor.expect(expectedEvent);
        editor.waitForAutosave();

        workqueue.expectTitle(0, 'slugline of the event*');
        editor.createButton
            .should('exist')
            .click();
        list.expectItemCount(1);
        list.expectItemText(0, 'slugline of the event');
        workqueue.expectTitle(0, 'slugline of the event');
    });

    it('can create a Recurring Event', () => {
        list.expectEmpty();
        editor.expectItemType();

        event = {
            ...event,
            'dates.recurring.enable': true,
            'dates.recurring.until': '13/12/2045',
            'dates.allDay': true,
            slugline: 'slugline of the recurring event',
            name: 'name of the recurring event',
        };
        expectedEvent = {
            ...expectedEvent,
            'dates.recurring.enable': true,
            'dates.recurring.until': '13/12/2045',
            'dates.allDay': true,
            slugline: 'slugline of the recurring event',
            name: 'name of the recurring event',
        };

        editor.openAllToggleBoxes();
        editor.type(event);
        editor.expect(expectedEvent);

        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();
        list.expectItemCount(2);
        list.expectItemText(0, 'slugline of the recurring event');
        list.expectItemText(1, 'slugline of the recurring event');

        // Test cancelling the Post modal
        editor.postButton
            .should('exist')
            .click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Cancel')
            .click();
        modal.waitTillClosed();

        // Test posting the series
        editor.waitForAutosave();
        editor.postButton
            .should('exist')
            .click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Post')
            .click();
        modal.waitTillClosed();
        editor.waitForAutosave();

        // Make sure both recurring Events now have the 'Scheduled' badge
        list.item(0)
            .find('.label--success')
            .should('contain.text', 'Scheduled');
        list.item(1)
            .find('.label--success')
            .should('contain.text', 'Scheduled');
    });

    it('SDESK-5982: Post updates the initial values', () => {
        // Enter minimum Event metadata
        editor.expectItemType();
        editor.type({
            'dates.start.date': '12/12/2045',
            'dates.allDay': true,
            slugline: 'slugline of the event',
            name: 'name of the event',
        });

        // Create the Event item
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .should('be.enabled')
            .click();
        editor.waitLoadingComplete();

        // Post the Event item
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

describe('Planing.Events: edit existing events', () => {
    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('events', [{
            ...cloneDeep(TEST_EVENTS.date_01_02_2045),
            dates: {
                start: TEST_EVENTS.date_01_02_2045.dates.start,
                end: TEST_EVENTS.date_01_02_2045.dates.end,
            },
        }, {
            ...cloneDeep(TEST_EVENTS.date_02_02_2045),
            dates: {
                start: TEST_EVENTS.date_02_02_2045.dates.start,
                end: TEST_EVENTS.date_02_02_2045.dates.end,
                tz: null,
            },
        }]);
        login();

        waitForPageLoad.planning();
    });

    it('SDESK-6972: Edit events with no timezone', () => {
        // Test if we can edit an Event without a timezone value
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.type({definition_short: 'Modifying 1st event'});
        editor.waitForAutosave();
        editor.saveButton
            .should('exist')
            .click();
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        // test if we can edit an Event with a timezone value of `null`
        list.item(1)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.type({definition_short: 'Modifying 2nd event'});
        editor.waitForAutosave();
        editor.saveButton
            .should('exist')
            .click();
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();
    });
});
