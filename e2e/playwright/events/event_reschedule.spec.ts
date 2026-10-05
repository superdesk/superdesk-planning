import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, Modal, getMenuItem} from '../utils/common';
import {TimePickerInput} from '../utils/common/inputs';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

test.describe('Planning.Events: reschedule', () => {
    let list: PlanningList;
    let modal: Modal;
    let editor: EventEditor;

    test.beforeEach(async({page}) => {
        list = new PlanningList(page);
        modal = new Modal(page);
        editor = new EventEditor(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.tomorrow({
            name: 'Reschedule TBC regression',
            slugline: 'Reschedule TBC',
        })]);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can reschedule with TBC after an invalid end time', async({page}) => {
        await list.expectItemCount(1);
        await (await getMenuItem(page, list.item(0), 'Reschedule')).click();
        await modal.waitTillOpen();

        const startTime = new TimePickerInput(page, () => modal.element, 'input[name="_startTime"]');
        const endTime = new TimePickerInput(page, () => modal.element, 'input[name="_endTime"]');
        const rescheduleButton = modal.getFooterButton('Reschedule');
        const warning = modal.element.getByText('End time should be after start time', {exact: true});

        await startTime.type('12:00');
        await endTime.type('11:00');
        await endTime.element.press('Tab');
        await expect(warning).toBeVisible();
        await expect(rescheduleButton).toBeDisabled();

        await startTime.setToBeConfirmed();
        await expect(startTime.element).toHaveValue('To Be Confirmed');
        await expect(warning).not.toBeVisible();
        await expect(rescheduleButton).toBeEnabled();
        await rescheduleButton.click();
        await modal.waitTillClosed();

        await expect(list.item(0)).toContainText('Time TBC');
        await editor.waitTillOpen();
        await editor.closeButton.click();
        await page.reload();
        await waitForPageLoad.planning(page);
        await expect(list.item(0)).toContainText('Time TBC');
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await expect(editor.element.getByText(/@ TBC$/)).toBeVisible();
    });
});