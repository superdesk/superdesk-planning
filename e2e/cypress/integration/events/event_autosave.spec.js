import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../../support/common';
import {PlanningList, EventEditor} from '../../support/planning';

describe('Planning.Events: autosave', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const workqueue = new Workqueue();

    let event;
    let expectedEvent;

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createEvent();
        editor.waitTillOpen();
    });

    it('creating a new event', () => {
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
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],

            links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
        };

        expectedEvent = Object.assign({}, event, {
            'dates.end.date': '12/12/2045',
        });

        list.expectEmpty();
        editor.expectItemType();
        workqueue.expectTitle(0, 'Untitled*');

        editor.openAllToggleBoxes();
        editor.type(event);
        editor.expect(expectedEvent);
        editor.minimiseButton
            .should('exist')
            .click();

        workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        editor.expect(expectedEvent);

        // Navigate to Workspace, then back to Planning
        cy.visit('/#/workspace');
        cy.visit('/#/planning');
        waitForPageLoad.planning();

        editor.openAllToggleBoxes();
        editor.expect(expectedEvent);

        // Refresh the page while the Event is open in the Editor
        cy.reload();
        waitForPageLoad.planning();
        editor.openAllToggleBoxes();
        editor.expect(expectedEvent);

        // Now minimize the item and reload the page
        // so the editor is not open when the page opens
        editor.minimiseButton
            .should('exist')
            .click();
        cy.reload();
        waitForPageLoad.planning();
        workqueue.getItem(0).click();
        editor.openAllToggleBoxes();
        editor.expect(expectedEvent);

        // Now save the Event
        editor.createButton
            .should('exist')
            .click();
    });
});
