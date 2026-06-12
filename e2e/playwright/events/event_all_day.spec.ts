import {test, expect} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, SubNavBar, CLIENT_FORMAT} from '../utils/common';
import {PlanningList, EventEditor} from '../page-object-models/planning';
import {getDateStringFor} from '../utils/time';

test.describe('Planning.Events: all day events and events without end time', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;
    let list: PlanningList;

    const baseEvent = {
        'dates.start.date': getDateStringFor.today(),
        slugline: 'Event',
        name: 'Test',
        calendars: ['Sport'],
    };

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
    });

    async function createEvent(event: {[field: string]: any}, expectedEvent: {[field: string]: any}, expectedCount: number): Promise<void> {
        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(expectedEvent);
        await editor.createButton.click();
        await list.expectItemCount(expectedCount);
    }

    test('can create single day event without start and end time', async () => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.start.date'],
        };

        await createEvent(event, expectedEvent, 1);

        await expect(list.item(0).getByTestId('event-datetime')).toContainText('All day');
    });

    test('can create multi day event without start and end time', async () => {
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

        await createEvent(event, expectedEvent, 2);

        await expect(list.item(0).getByTestId('event-datetime')).toContainText('All day');

        await expect(
            list.item(1).getByTestId('event-datetime')
        ).toContainText(`${startDate}–${endDate}All day`);
    });

    test('can create single day event with start time', async () => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.start.time': '12:00',
        };

        const expectedEvent = {
            ...event,
            'dates.end.date': event['dates.start.date'],
        };

        await createEvent(event, expectedEvent, 1);

        await expect(list.item(0).getByTestId('event-datetime')).toContainText('12:00');
    });

    test('can create multi day event with start time', async () => {
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

        await createEvent(event, expectedEvent, 2);

        await expect(
            list.item(0).getByTestId('event-datetime')
        ).toContainText(`${startTime}–${endDate}`);

        await expect(
            list.item(1).getByTestId('event-datetime')
        ).toContainText(`${startDate}\xa0${startTime}–${endDate}`);  // &nbsp;
    });

    test('can clear time via popup', async ({page}) => {
        const event = {
            ...baseEvent,
            'dates.start.date': moment().format(CLIENT_FORMAT),
            'dates.start.time': '12:00',
            'dates.end.time': '13:00',
        };

        await editor.openAllToggleBoxes();
        await editor.type(event);

        await editor.element
            .getByTestId('field-dates_end')
            .getByTestId('time-popup-toggle')
            .click();
        await page.getByTestId('time-popup-clear').click();

        await editor.element
            .getByTestId('field-dates_start')
            .getByTestId('time-popup-toggle')
            .click();
        await page.getByTestId('time-popup-clear').click();

        await editor.createButton.click();

        await expect(list.item(0).getByTestId('event-datetime')).toContainText('All day');
    });
});
