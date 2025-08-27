import moment from 'moment';
import {setup, login, waitForPageLoad, SubNavBar, CLIENT_FORMAT} from '../../support/common';
import {PlanningList, EventEditor} from '../../support/planning';
import {getDateStringFor} from '../../support/utils/time';

describe('Planning.Events: all day events and events without end time', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();

    const baseEvent = {
        'dates.start.date': getDateStringFor.today(),
        slugline: 'Event',
        name: 'Test',
        calendars: ['Sport'],
    };

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();
        subnav.createEvent();
        editor.waitTillOpen();
    });

    const createEvent = (event, expectedEvent, expectedCount: number) => {
        editor.openAllToggleBoxes();
        editor.type(event);
        editor.expect(expectedEvent);
        editor.createButton
            .should('exist')
            .click();
        list.expectItemCount(expectedCount);
    }

    it('can create single day event without start and end time', () => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.start.date'],
        };

        createEvent(event, expectedEvent, 1);

        list.item(0).find('[data-test-id="event-datetime"]')
            .should('contain.text', 'All day');
    });

    it('can create multi day event without start and end time', () => {
        const startDate = moment().format(CLIENT_FORMAT);
        const endDate = moment().add(1, 'day')
            .format(CLIENT_FORMAT);

        const event = {
            ...baseEvent,
            'dates.start.date': startDate,
            'dates.end.date': endDate,
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.end.date'],
        };

        createEvent(event, expectedEvent, 2);

        list.item(0).find('[data-test-id="event-datetime"]')
            .should('contain.text', 'All day');

        list.item(1).find('[data-test-id="event-datetime"]')
            .should('contain.text', `${startDate}All day`);
    });

    it('can create single day event with start time', () => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.start.time': '12:00',
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.start.date'],
        };

        createEvent(event, expectedEvent, 1);

        list.item(0).find('[data-test-id="event-datetime"]')
            .should('contain.text', '12:00');
    });

    it('can create multi day event with start time', () => {
        const startDate = moment().format(CLIENT_FORMAT);
        const startTime = '12:00';
        const endDate = moment().add(1, 'day')
            .format(CLIENT_FORMAT);

        const event = {
            ...baseEvent,
            'dates.start.date': startDate,
            'dates.start.time': startTime,
            'dates.end.date': endDate,
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.end.date'],
        };

        createEvent(event, expectedEvent, 2);

        list.item(0).find('[data-test-id="event-datetime"]')
            .should('contain.text', `${startTime}–${endDate}`);

        list.item(1).find('[data-test-id="event-datetime"]')
            .should('contain.text', `${startDate}\xa0${startTime}–${endDate}`); // &nbsp;
    });

    it('can clear time via popup', () => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.start.time': '12:00',
            'dates.end.time': '13:00',
        };

        editor.openAllToggleBoxes();
        editor.type(event);

        cy.get('[data-test-id="field-dates_end"]').find('[data-test-id="time-popup-toggle"]').click();
        cy.get('[data-test-id="time-popup-clear"]').click();

        cy.get('[data-test-id="field-dates_start"]').find('[data-test-id="time-popup-toggle"]').click();
        cy.get('[data-test-id="time-popup-clear"]').click();

        editor.createButton
            .should('exist')
            .click();

        list.item(0).find('[data-test-id="event-datetime"]')
            .should('contain.text', 'All day');
    });
});