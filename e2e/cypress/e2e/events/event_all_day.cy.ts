import moment from 'moment';
import {setup, login, waitForPageLoad, SubNavBar, Workqueue, CLIENT_FORMAT} from '../../support/common';
import {PlanningList, EventEditor} from '../../support/planning';
import {getDateStringFor} from '../../support/utils/time';
import {create} from 'lodash';

describe('Planning.Events: all day', () => {
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

        list.item(0).find('[data-test-id="event-start-date"]').should('contain.text', event['dates.start.date']);
        list.item(0).find('[data-test-id="event-end-date"]').should('contain.text', '');
    });

    it('can create multi day event without start and end time', () => {
        const event = {
            ...baseEvent, 
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.end.date': moment().add(1, 'day').format(CLIENT_FORMAT),
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.end.date'],
        };

        createEvent(event, expectedEvent, 2);

        list.item(0).find('[data-test-id="event-start-date"]').should('contain.text', event['dates.start.date']);
        list.item(0).find('[data-test-id="event-end-date"]').should('contain.text', event['dates.end.date']);
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

        list.item(0).find('[data-test-id="event-start-date"]').should('contain.text', moment().format('DD/MM\xa0[12:00]')); // &nbsp;
        list.item(0).find('[data-test-id="event-end-date"]').should('contain.text', '');
    });

    it('can create multi day event with start time', () => {
        const event = {
            ...baseEvent, 
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.start.time': '12:00',
            'dates.end.date': moment().add(1, 'day').format(CLIENT_FORMAT),
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.end.date'],
        };

        createEvent(event, expectedEvent, 2);

        list.item(0).find('[data-test-id="event-start-date"]').should('contain.text', moment().format('DD/MM\xa0[12:00]')); // &nbsp;
        list.item(0).find('[data-test-id="event-end-date"]').should('contain.text', event['dates.end.date']);
    });

});