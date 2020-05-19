import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../../support/common';
import {EventEditor, PlanningList} from '../../support/planning';

describe('Planning.Events: edit metadata', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const workqueue = new Workqueue();
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
        editor.createButton.click();
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
        editor.createButton.click();
        list.expectItemCount(2);
        list.expectItemText(0, 'slugline of the recurring event');
        list.expectItemText(1, 'slugline of the recurring event');
    });
});
