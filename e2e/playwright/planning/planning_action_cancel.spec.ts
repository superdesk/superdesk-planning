import {test, expect} from '@playwright/test';
import moment from 'moment';

import {setup, addItems, login, waitForPageLoad, Modal, getMenuItem} from '../utils/common';
import {PlanningList, PlanningEditor, PlanningPreview} from '../page-object-models/planning';
import {TIME_STRINGS} from '../utils/time';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';

test.describe('Planning.Planning: cancel planning item', () => {
    let editor: PlanningEditor;
    let modal: Modal;
    let preview: PlanningPreview;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        editor = new PlanningEditor(page);
        modal = new Modal(page);
        preview = new PlanningPreview(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await setupPlanningPublishing(page.request);
        await addItems(
            page.request,
            'planning',
            [{
                slugline: 'Test Planning Item',
                planning_date: moment().format('yy-MM-DD') + TIME_STRINGS[0],
            }]
        );

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can cancel a Planning item', async ({page}) => {
        const reason = 'Not covering anymore';
        await list.item(0).click();

        // Make sure 'Cancel Planning' is not available on
        // Planning items that haven't been published
        await expect(
            await getMenuItem(page, list.item(0), 'Cancel Planning')
        ).not.toBeAttached()

        // Post the Planning item
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.postButton.click();
        await editor.closeButton.click();

        // Make sure the list item shows the 'Scheduled' badge
        // and is no longer locked
        await expect(
            list.item(0).getByTestId('item-state-badge--scheduled')
        ).toContainText('Scheduled');
        await expect(
            list.item(0).getByTestId('item-locked-indicator')
        ).not.toBeAttached();

        // Now make sure the 'Cancel Planning' action is there
        // and cancel the item
        await list.item(0).click();

        await (await getMenuItem(page, list.item(0), 'Cancel Planning')).click();

        await modal.waitTillOpen();

        // Make sure the item is locked at this point in time
        await expect(
            list.item(0).getByTestId('item-locked-indicator')
        ).toBeVisible();
        await modal.element
            .getByRole('textbox', {name: 'reason'})
            .fill(reason);
        await modal.getFooterButton('Cancel Planning').click();
        await modal.waitTillClosed();

        // Now make sure the list item shows the 'Cancelled' badge
        // and is no longer locked
        await expect(
            list.item(0).getByTestId('item-state-badge--cancelled')
        ).toContainText('Cancelled');
        await expect(
            list.item(0).getByTestId('item-locked-indicator')
        ).not.toBeAttached();

        // Make sure the 'Cancelled' badge and reason appears in the Preview
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(
            preview.element.getByTestId('item-state-badge--cancelled')
        ).toContainText('Cancelled');

        await expect(preview.element.getByTestId('internal-note-label')).toContainText(reason);

        // Make sure the 'Cancelled' badge and reason appears in the Editor
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await expect(editor.element.getByTestId('internal-note-label')).toContainText(reason);
        await editor.closeButton.click();
    });
});
