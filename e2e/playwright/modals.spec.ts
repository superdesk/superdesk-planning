import {test, expect} from './fixtures';

import {login, waitForPageLoad, Modal} from './utils/common';
import {EventEditor, PlanningList} from './utils/planning';
import {createEventFor} from './utils/fixtures/events';

test.describe('Planning.Modals', () => {
    let editor: EventEditor;
    let list: PlanningList;
    let modal: Modal;

    test.beforeEach(async({page, backendApi}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);
        modal = new Modal(page);

        await backendApi.resetApp('planning_prepopulate_data');
        await page.goto('/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('confirmation modal opens and closes on action when autoClose is truthy', async({page, backendApi}) => {
        // Add a test event
        await backendApi.addItems(
            'events',
            [createEventFor.today({
                slugline: 'Test Event for Spike',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event in the list
        await list.item(0).dblclick();
        await editor.waitTillOpen();

        // Get the initial URL to verify navigation after action
        const initialUrl = page.url();

        // Trigger spike action which shows a confirmation modal
        const actionMenu = editor.actionMenu;

        await actionMenu.open();
        await actionMenu.getAction('Spike').click();

        // Wait for confirmation modal to appear
        await modal.waitTillOpen();

        // Verify modal content
        const modalText = await modal.element.textContent();

        expect(modalText).toContain('Spike');

        // Click the Spike button
        await modal.getFooterButton('Spike').click();

        // Modal should auto-close after action
        await modal.waitTillClosed();

        // Verify the event was spiked by checking it's no longer in the editor
        await editor.waitTillClosed();

        // Verify we're back to the list view
        const finalUrl = page.url();

        expect(finalUrl).not.toBe(initialUrl);
    });

    test('confirmation modal can be cancelled', async({page, backendApi}) => {
        // Add a test event
        await backendApi.addItems(
            'events',
            [createEventFor.today({
                slugline: 'Test Event for Cancel',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event
        await list.item(0).dblclick();
        await editor.waitTillOpen();

        // Trigger spike action
        const actionMenu = editor.actionMenu;

        await actionMenu.open();
        await actionMenu.getAction('Spike').click();

        // Wait for confirmation modal
        await modal.waitTillOpen();

        // Click Cancel button
        await modal.getFooterButton('Cancel').click();

        // Modal should close
        await modal.waitTillClosed();

        // Event should still be open in editor (action was cancelled)
        await expect(editor.element).toBeVisible();
        await editor.expect({slugline: 'Test Event for Cancel'});
    });
});
