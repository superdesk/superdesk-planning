import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, SubNavBar, CLIENT_FORMAT} from '../utils/common';
import {EventEditor, EventRepetitionsModal, PlanningList} from '../page-object-models/planning';

test.describe('Planning.Events: timezone requirements', () => {
    let editor: EventEditor;
    let list: PlanningList;

    async function openTimedEvent(page: Page): Promise<void> {
        await new SubNavBar(page).createEvent();
        await editor.waitTillOpen();
        await editor.type({
            name: 'Timezone regression',
            slugline: 'Timezone regression',
            'dates.start.date': moment().add(1, 'day').format(CLIENT_FORMAT),
        });
        await expect(editor.timezone.element).not.toBeVisible();
        await editor.type({'dates.start.time': '10:00'});
        await expect(editor.timezone.element).toBeVisible();
        await editor.timezone.expectRequired();
        await editor.timezone.clear();
        await editor.timezone.expectNoError();
    }

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await openTimedEvent(page);
    });

    test('does not require a timezone when time is set to TBC', async ({page}) => {
        await test.step('Set start time to TBC and save', async () => {
            await editor.setStartTimeToBeConfirmed();
            await expect(editor.getField('dates.start.time').element).toHaveValue('To Be Confirmed');
            await expect(editor.timezone.element).not.toBeVisible();
            await editor.createAndWait();
            await list.expectItemCount(1);
            await expect(list.item(0)).toContainText('Time TBC');
        });

        await editor.closeAfterSaving();
        await openTimedEvent(page);

        await test.step('Set end time to TBC and save', async () => {
            await editor.setEndTimeToBeConfirmed();
            await expect(editor.getField('dates.end.time').element).toHaveValue('To Be Confirmed');
            await expect(editor.timezone.element).not.toBeVisible();
            await editor.createAndWait();
            await list.expectItemCount(2);
            await expect(list.item(1)).toContainText('Time TBC');
        });
    });

    test('creates and extends a recurring TBC series without a timezone', async ({page}) => {
        const startDate = await editor.getField('dates.start.date').element.inputValue();

        await test.step('Create three daily TBC occurrences without a timezone', async () => {
            await editor.setStartTimeToBeConfirmed();
            await expect(editor.timezone.element).not.toBeVisible();
            await editor.type({
                'dates.recurring.enable': true,
                'dates.recurring.endRepeatMode': 'count',
                'dates.recurring.count': '3',
            });
            await editor.createAndWait();
            await list.expectItemCount(3);
            for (let i = 0; i < 3; i++) {
                await expect(list.item(i)).toContainText('Time TBC');
                await expect(list.item(i)).toContainText('Draft');
            }
            await editor.closeAfterSaving();
        });

        const originalIds = await list.items().evaluateAll((items) => (
            items.map((item) => item.getAttribute('data-test-id'))
        ));

        for (const id of originalIds) {
            expect(id).toMatch(/^event-item-.+/);
        }

        await test.step('Extend the series to five occurrences', async () => {
            await list.clickAction(0, 'Update Repetitions');
            await new EventRepetitionsModal(page).updateCount(5);
            await list.expectItemCount(5);
            await page.reload();
            await waitForPageLoad.planning(page);
            await list.expectItemCount(5);
        });

        await test.step('Verify the original occurrences survive with unchanged dates', async () => {
            const ids = await list.items().evaluateAll((items) => (
                items.map((item) => item.getAttribute('data-test-id'))
            ));

            expect(ids.slice(0, 3)).toEqual(originalIds);
            for (let i = 0; i < 5; i++) {
                await expect(list.item(i)).toContainText('Time TBC');
                await expect(list.item(i)).toContainText('Draft');
                await list.item(i).dblclick();
                await editor.waitTillOpen();
                const date = moment(startDate, CLIENT_FORMAT).add(i, 'day').format(CLIENT_FORMAT);

                await expect(editor.element.getByText(`${date} @ TBC`)).toBeVisible();
                await expect(editor.element.getByText('Every 1 day(s) for 5 repeats', {exact: true})).toBeVisible();
                await expect(editor.timezone.element).not.toBeVisible();
                await editor.closeAfterSaving();
            }
        });
    });

    test('does not require a timezone after clearing time', async ({page}) => {
        await test.step('Clear time by typing and save', async () => {
            await editor.clearStartTime();
            await expect(editor.getField('dates.start.time').element).toHaveValue('');
            await expect(editor.timezone.element).not.toBeVisible();
            await editor.createAndWait();
            await list.expectItemCount(1);
            await expect(list.item(0)).toContainText('All day');
        });

        await editor.closeAfterSaving();
        await openTimedEvent(page);

        await test.step('Clear time with the picker and save', async () => {
            await editor.clearStartTime(true);
            await expect(editor.getField('dates.start.time').element).toHaveValue('');
            await expect(editor.timezone.element).not.toBeVisible();
            await editor.createAndWait();
            await list.expectItemCount(2);
            await expect(list.item(1)).toContainText('All day');
        });
    });

    test('highlights a missing timezone and clears the error after selecting one', async () => {
        await editor.createButton.click();
        await list.expectEmpty();
        await editor.timezone.expectError('This field is required');

        await editor.timezone.type('Europe/Prague');
        await editor.timezone.expectNoError();
        await editor.createAndWait();
        await list.expectItemCount(1);
    });
});
