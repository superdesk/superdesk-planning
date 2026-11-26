import {test, expect} from '@playwright/test';
import moment from 'moment';

import {
    setup,
    login,
    waitForPageLoad,
    SubNavBar,
    UiFrameworkModal,
    CLIENT_FORMAT,
} from '../utils/common';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';

test.describe('Planning.Events: completed events', () => {
    // All-day completion eligibility compares UTC dates, independently of CI's TZ.
    test.use({timezoneId: 'UTC'});

    let editor: EventEditor;
    let list: PlanningList;
    let subnav: SubNavBar;
    let modal: UiFrameworkModal;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);
        subnav = new SubNavBar(page);
        modal = new UiFrameworkModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await setupPlanningPublishing(page.request);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can save and publish an event after marking it as completed', async () => {
        await subnav.createEvent();
        await editor.waitTillOpen();
        await editor.type({
            'dates.start.date': moment.utc().format(CLIENT_FORMAT),
            slugline: 'Completed event',
            name: 'Completed event',
        });
        await editor.waitForAutosave();
        await editor.createAndWait();
        await expect(editor.createButton).not.toBeVisible();
        await editor.closeAfterSaving();
        await list.expectItemCount(1);

        await list.clickAction(0, 'Mark as completed');
        await modal.waitTillOpen();
        await modal.getFooterButton('Ok').click();
        await modal.waitTillClosed();
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.type({slugline: 'Updated completed event'});
        await editor.waitForAutosave();
        await expect(editor.saveButton).toBeEnabled();
        await editor.saveButton.click();
        await editor.closeAfterSaving();

        await list.expectItemText(0, 'Updated completed event');
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.expect({slugline: 'Updated completed event'});
        await expect(editor.postButton).toBeEnabled();
        await editor.postButton.click();
        await expect(editor.unpostButton).toBeVisible();
        await editor.closeAfterSaving();

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await expect(editor.unpostButton).toBeVisible();
        await editor.type({slugline: 'Updated published completed event'});
        await editor.waitForAutosave();
        await expect(editor.updateButton).toBeEnabled();
        await editor.updateButton.click();
        await editor.closeAfterSaving();
        await list.expectItemText(0, 'Updated published completed event');
    });
});
