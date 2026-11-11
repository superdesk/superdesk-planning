import {test, expect} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, addItems, Modal, getMenuItem, CLIENT_FORMAT} from '../utils/common';
import {Input, TimePickerInput} from '../utils/common/inputs';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {getDateStringFor, TIMEZONE} from '../utils/time';

test.describe('Planning.Events: adding a start time in action dialogs', () => {
    let list: PlanningList;
    let modal: Modal;
    let editor: EventEditor;
    let startTime: TimePickerInput;
    let endTime: TimePickerInput;

    test.beforeEach(async({page}) => {
        list = new PlanningList(page);
        modal = new Modal(page);
        editor = new EventEditor(page);
        startTime = new TimePickerInput(page, () => modal.element, 'input[name="_startTime"]');
        endTime = new TimePickerInput(page, () => modal.element, 'input[name="_endTime"]');
        const date = getDateStringFor.tomorrow();

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [{
            ...createEventFor.tomorrow({name: 'All-day action event', slugline: 'All-day action'}),
            dates: {
                start: date + 'T00:00:00+0000',
                end: date + 'T00:00:00+0000',
                tz: TIMEZONE,
                all_day: true,
                no_end_time: false,
            },
        }]);
        await login(page);
        await waitForPageLoad.planning(page);
        await list.expectItemCount(1);
    });

    async function enterStartTimeOnly() {
        await expect(startTime.element).toHaveValue('');
        await expect(endTime.element).toHaveValue('');
        await startTime.type('10:00');
        await startTime.element.press('Tab');

        await expect(endTime.element).toHaveValue('');
        await expect(modal.element.getByText('This field is required', {exact: true})).toHaveCount(0);
        await expect(modal.element.getByText('End time should be after start time')).toHaveCount(0);
        await expect(modal.element.getByText('End date should be after start date')).toHaveCount(0);
    }

    async function expectSavedSchedule() {
        await expect(startTime.element).toHaveValue('10:00');
        await expect(endTime.element).toHaveValue('');

        const startDate = new Input(
            modal.page, () => modal.element, 'input[name="dates.start.date"]'
        );
        const endDate = new Input(
            modal.page, () => modal.element, 'input[name="dates.end.date"]'
        );
        const date = moment(getDateStringFor.tomorrow()).format(CLIENT_FORMAT);

        await startDate.expect(date);
        await endDate.expect(date);
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
    }

    test('can reschedule an all-day event with only a start time', async({page}) => {
        await (await getMenuItem(page, list.item(0), 'Reschedule')).click();
        await modal.waitTillOpen();
        await enterStartTimeOnly();

        const saveButton = modal.getFooterButton('Reschedule');

        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await modal.waitTillClosed();
        await editor.waitTillOpen();
        await editor.closeButton.click();

        await page.reload();
        await waitForPageLoad.planning(page);
        await list.expectItemCount(1);
        await expect(list.item(0).getByTestId('event-datetime')).toContainText('10:00');
        await expect(list.item(0).getByTestId('event-datetime')).not.toContainText('All day');
        await (await getMenuItem(page, list.item(0), 'Reschedule')).click();
        await modal.waitTillOpen();
        await expectSavedSchedule();
    });

    test('can convert an all-day event to recurring with only a start time', async({page}) => {
        await (await getMenuItem(page, list.item(0), 'Convert to Recurring Event')).click();
        await modal.waitTillOpen();

        const count = new Input(
            page, () => modal.element, 'input[data-test-id="dates.recurring_rule.count"]'
        );

        await count.type('3');
        await enterStartTimeOnly();

        const saveButton = modal.getFooterButton('Convert to a recurring event');

        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await modal.waitTillClosed();
        await list.expectItemCount(3);

        await page.reload();
        await waitForPageLoad.planning(page);
        await list.expectItemCount(3);
        await expect(list.item(0).getByTestId('event-datetime')).toContainText('10:00');
        await expect(list.item(0).getByTestId('event-datetime')).not.toContainText('All day');
        await (await getMenuItem(page, list.item(0), 'Reschedule')).click();
        await modal.waitTillOpen();
        await expectSavedSchedule();
    });
});
