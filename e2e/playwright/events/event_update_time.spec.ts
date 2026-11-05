import {test, expect, Page} from '@playwright/test';
import moment from 'moment-timezone';

import {setup, login, waitForPageLoad, addItems, Modal, getMenuItem} from '../utils/common';
import {TimePickerInput} from '../utils/common/inputs';
import {PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {getDateStringFor, TIMEZONE} from '../utils/time';

test.describe('Planning.Events: update time', () => {
    let list: PlanningList;
    let modal: Modal;

    const timedEvent = () => {
        const day = moment().add(1, 'day')
            .startOf('day');

        return {
            ...createEventFor.tomorrow({name: 'Update time event', slugline: 'Update time'}),
            dates: {
                start: day.clone().hour(10)
                    .format(),
                end: day.clone().hour(12)
                    .format(),
                tz: TIMEZONE,
            },
        };
    };

    test.beforeEach(async({page}) => {
        list = new PlanningList(page);
        modal = new Modal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
    });

    async function openUpdateTime(page: Page, event: {[key: string]: any}) {
        await addItems(page.request, 'events', [event]);
        await login(page);
        await waitForPageLoad.planning(page);
        await list.expectItemCount(1);

        await (await getMenuItem(page, list.item(0), 'Update time')).click();
        await modal.waitTillOpen();

        return {
            startTime: new TimePickerInput(page, () => modal.element, 'input[name="_startTime"]'),
            endTime: new TimePickerInput(page, () => modal.element, 'input[name="_endTime"]'),
            saveButton: modal.getFooterButton('Update Time'),
        };
    }

    async function expectNoValidationErrors() {
        await expect(modal.element.getByText('This field is required')).toHaveCount(0);
        await expect(modal.element.getByText('End time should be after start time')).toHaveCount(0);
        await expect(modal.element.getByText('End date should be after start date')).toHaveCount(0);
    }

    async function expectEventTimeAfterReload(page: Page, check: () => Promise<void>) {
        await check();
        await page.reload();
        await waitForPageLoad.planning(page);
        await check();
    }

    test('can clear the end time', async({page}) => {
        const {endTime, saveButton} = await openUpdateTime(page, timedEvent());

        await endTime.clearTime();
        await expect(endTime.element).toHaveValue('');
        await expectNoValidationErrors();
        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await modal.waitTillClosed();

        await expectEventTimeAfterReload(page, async() => {
            const datetime = list.item(0).getByTestId('event-datetime');

            await expect(datetime).toContainText('10:00');
            await expect(datetime).not.toContainText('12:00');
            await expect(datetime).not.toContainText('All day');
        });
    });

    test('can change to all day by clearing both times', async({page}) => {
        const {startTime, endTime, saveButton} = await openUpdateTime(page, timedEvent());

        await endTime.clearTime();
        await startTime.clearTime();
        await expect(startTime.element).toHaveValue('');
        await expect(endTime.element).toHaveValue('');
        await expectNoValidationErrors();
        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await modal.waitTillClosed();

        await expectEventTimeAfterReload(page, async() => {
            const datetime = list.item(0).getByTestId('event-datetime');

            await expect(datetime).toContainText('All day');
            await expect(datetime).not.toContainText('00:00');
            await expect(datetime).not.toContainText('23:59');
        });
    });

    test('can set only a start time on an all day event', async({page}) => {
        const date = getDateStringFor.tomorrow();
        const {startTime, endTime, saveButton} = await openUpdateTime(page, {
            ...createEventFor.tomorrow({name: 'Update time event', slugline: 'Update time'}),
            dates: {
                start: date + 'T00:00:00+0000',
                end: date + 'T00:00:00+0000',
                tz: TIMEZONE,
                all_day: true,
                no_end_time: true,
            },
        });

        await expect(startTime.element).toHaveValue('');
        await expect(endTime.element).toHaveValue('');

        await startTime.type('10:00');
        await startTime.element.press('Tab');
        await expect(endTime.element).toHaveValue('');
        await expectNoValidationErrors();
        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await modal.waitTillClosed();

        await expectEventTimeAfterReload(page, async() => {
            const datetime = list.item(0).getByTestId('event-datetime');

            await expect(datetime).toContainText('10:00');
            await expect(datetime).not.toContainText('All day');
        });
    });
});
