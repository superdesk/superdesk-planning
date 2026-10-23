import {test, expect, Locator} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, CLIENT_FORMAT, Modal, SelectInput} from '../utils/common';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import moment from 'moment/moment';

test.describe('Events: mark completed', () => {
    let editor: EventEditor;
    let list: PlanningList;
    let subnav: SubNavBar;
    let modal: Modal;
    let menu: Locator;
    let dialog: Locator;
    let event: any;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        modal = new Modal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
        await list.expectEmpty();
        await editor.expectItemType();
    });

    test('can mark an Event as completed', async ({page}) => {
        // Create the Event and close the editor
        event = {
            'dates.start.date': moment()
                .subtract(1, 'day')
                .format(CLIENT_FORMAT),
            'dates.end.date': moment()
                .add(2, 'day')
                .format(CLIENT_FORMAT),
            name: 'Multi day Event',
        };
        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(event);
        await editor.waitForAutosave();
        await editor.createButton.click();

        // Wait for the Event to be available in the list
        await list.expectItemCount(3);
        await list.expectItemText(0, 'Multi day Event');
        await list.expectItemText(1, 'Multi day Event');
        await list.expectItemText(2, 'Multi day Event');

        // Close the editor
        await editor.closeButton.click();
        await editor.waitTillClosed();

        // Perform 'Mark as completed' action
        menu = await list.openActionMenu(1);
        await menu.getByRole('menuitem', {name: 'Mark as completed'}).click();
        dialog = page.getByRole('dialog', {name: 'Confirmation'});
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', {name: 'OK'}).click();
        await expect(dialog).not.toBeVisible();

        // Make sure the list items are updated with the new completed flag
        await list.expectItemCount(1);
        await list.expectItemText(0, 'Event Completed');

        // Make sure we can still edit the Event
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.type({name: 'Multi day Event - Completed'});
        await editor.waitForAutosave();
        await editor.saveButton.click();

        await list.expectItemCount(1);
        await list.expectItemText(0, 'Event Completed');
        await list.expectItemText(0, 'Multi day Event - Completed');
    });

    test('can mark Recurring Events as completed', async ({page}) => {
        // Create the Recurring Events and close the editor
        event = {
            'dates.start.date': moment()
                .subtract(1, 'day')
                .format(CLIENT_FORMAT),
            name: 'Recurring Event',
            'dates.recurring.enable': true,
            'dates.recurring.until': moment().add(2, 'day')
                .format(CLIENT_FORMAT),
        };
        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(event);
        await editor.waitForAutosave();
        await editor.createButton.click();

        // Wait for the recurring series to be available in the list
        await list.expectItemCount(3);
        await list.expectItemText(0, 'Recurring Event');
        await list.expectItemText(1, 'Recurring Event');
        await list.expectItemText(2, 'Recurring Event');

        // Close the editor
        await editor.closeButton.click();
        await editor.waitTillClosed();

        // Perform 'Mark as completed' action
        menu = await list.openActionMenu(1);
        await menu.getByRole('menuitem', {name: 'Mark as completed'}).click();
        dialog = page.getByRole('dialog', {name: 'Confirmation'});
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', {name: 'OK'}).click();
        await expect(dialog).not.toBeVisible();

        // Make sure the list items are updated with the new completed flag
        await list.expectItemCount(3);
        await list.expectItemText(0, 'Event Completed');
        await list.expectItemText(1, 'Event Completed');
        await list.expectItemText(2, 'Event Completed');

        // Make sure we can still edit any Event in the series afterwards
        await list.item(1).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.type({name: 'Recurring Event - Completed'});
        await editor.waitForAutosave();
        await editor.saveButton.click();

        await modal.waitTillOpen();
        await modal.shouldContainTitle('Save Event');

        const updateMethodInput = new SelectInput(
            page,
            () => modal.element, '[data-test-id="field-update_method"]',
        );

        await updateMethodInput.type('all');
        await modal.element.locator('.btn--primary').click();
        await modal.waitTillClosed();
        await list.expectItemCount(3);
        await list.expectItemText(0, 'Recurring Event - Completed');
        await list.expectItemText(0, 'Event Completed');
        await list.expectItemText(1, 'Recurring Event - Completed');
        await list.expectItemText(1, 'Event Completed');
        await list.expectItemText(2, 'Recurring Event - Completed');
        await list.expectItemText(2, 'Event Completed');
    });
});
