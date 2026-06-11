import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, UiFrameworkModal, SubNavBar} from './utils/common';
import {EventEditor, PlanningList, PlanningEditor} from './page-object-models/planning';
import {createEventFor} from './utils/fixtures/events';

test.describe('Planning.IgnoreCancelSaveModal', () => {
    let editor: EventEditor | PlanningEditor;
    let list: PlanningList;
    let modal: UiFrameworkModal;
    let subnav: SubNavBar;

    test.beforeEach(async({page}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);
        modal = new UiFrameworkModal(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('renders Ignore/Cancel/Save buttons for unpublished item with changes', async({page}) => {
        // Add a test event
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                slugline: 'Test Event',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.type({slugline: 'Modified Event'});
        await editor.waitForAutosave();

        // Try to close - should show modal
        await expect(editor.closeButton).toBeVisible();
        await expect(editor.closeButton).toBeEnabled();
        await editor.closeButton.click();
        await modal.waitTillOpen();

        // Verify all three buttons are present
        await expect(modal.getFooterButton('Ignore')).toBeVisible();
        await expect(modal.getFooterButton('Cancel')).toBeVisible();
        await expect(modal.getFooterButton('Save')).toBeVisible();

        // Cancel to close modal
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
    });

    test('renders Ignore/Cancel/Update buttons for published item with changes', async({page}) => {
        // Add a published event
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                slugline: 'Published Event',
                name: 'Published Event',
                state: 'scheduled',
                pubstatus: 'usable',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.type({slugline: 'Modified Published Event'});
        await editor.waitForAutosave();

        // Try to close - should show modal
        await expect(editor.closeButton).toBeVisible();
        await expect(editor.closeButton).toBeEnabled();
        await editor.closeButton.click();
        await modal.waitTillOpen();

        // Verify buttons
        await expect(modal.getFooterButton('Ignore')).toBeVisible();
        await expect(modal.getFooterButton('Cancel')).toBeVisible();
        await expect(modal.getFooterButton('Update')).toBeVisible();

        // Cancel to close modal
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
    });

    test('renders Ignore/Cancel/Create buttons for new item', async({page}) => {
        // Create a new planning item
        const planningEditor = new PlanningEditor(page);

        await subnav.createPlanning();
        await planningEditor.waitTillOpen();
        await planningEditor.type({slugline: 'New Planning'});
        await planningEditor.waitForAutosave();

        // Try to close - should show modal
        await expect(planningEditor.closeButton).toBeVisible();
        await expect(planningEditor.closeButton).toBeEnabled();
        await planningEditor.closeButton.click();
        await modal.waitTillOpen();

        // Verify buttons
        await expect(modal.getFooterButton('Ignore')).toBeVisible();
        await expect(modal.getFooterButton('Cancel')).toBeVisible();
        await expect(modal.getFooterButton('Create')).toBeVisible();

        // Cancel to close modal
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
    });

    test('executes Ignore callback', async({page}) => {
        // Add a test event
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                slugline: 'Test Event',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.type({slugline: 'Modified Event'});
        await editor.waitForAutosave();

        // Try to close
        await expect(editor.closeButton).toBeVisible();
        await expect(editor.closeButton).toBeEnabled();
        await editor.closeButton.click();
        await modal.waitTillOpen();

        // Click Ignore
        await modal.getFooterButton('Ignore').click();
        await modal.waitTillClosed();

        // Editor should close without saving
        await editor.waitTillClosed();
    });

    test('executes Cancel callback', async({page}) => {
        // Add a test event
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                slugline: 'Test Event',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.type({slugline: 'Modified Event'});
        await editor.waitForAutosave();

        // Try to close
        await expect(editor.closeButton).toBeVisible();
        await expect(editor.closeButton).toBeEnabled();
        await editor.closeButton.click();
        await modal.waitTillOpen();

        // Click Cancel
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();

        // Editor should still be open
        await expect(editor.element).toBeVisible();
        await editor.expect({slugline: 'Modified Event'});
    });

    test('executes Save callback', async({page}) => {
        // Add a test event
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                slugline: 'Test Event',
                name: 'Test Event',
            })]
        );

        await page.reload();
        await waitForPageLoad.planning(page);

        // Open the event and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.type({slugline: 'Modified Event'});
        await editor.waitForAutosave();

        // Try to close
        await expect(editor.closeButton).toBeVisible();
        await expect(editor.closeButton).toBeEnabled();
        await editor.closeButton.click();
        await modal.waitTillOpen();

        // Click Save
        await modal.getFooterButton('Save').click();
        await modal.waitTillClosed();

        // Editor should close after saving
        await editor.waitTillClosed();

        // Verify the changes were saved
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.expect({slugline: 'Modified Event'});
    });
});
