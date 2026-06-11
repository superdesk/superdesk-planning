import {test, expect, Page, Locator} from '@playwright/test';

import {
    setup,
    login,
    addItems,
    waitForPageLoad,
    UiFrameworkModal,
    Modal,
    getMenuItem,
    ActionMenu,
} from '../utils/common';
import {PlanningList, EventEditor, PlanningPreview} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

test.describe('Planning.Events: event cancel action', () => {
    let editor: EventEditor;
    let modal: Modal;
    let ignoreCancelSaveModal: UiFrameworkModal;
    let preview: PlanningPreview;
    let list: PlanningList;
    let menu: ActionMenu;
    let reason: string;

    test.beforeEach(async({page}) => {
        editor = new EventEditor(page);
        modal = new Modal(page);
        ignoreCancelSaveModal = new UiFrameworkModal(page);
        preview = new PlanningPreview(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                type: 'event',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                calendars: [],
                state: 'draft',
                place: [],
                name: 'Test',
                slugline: 'Original',
            })]
        );

        await login(page);
        await waitForPageLoad.planning(page);
    });

    async function cancelEvent() {
        await menu.open();
        await menu.getAction('Cancel').click();
        await modal.waitTillOpen();
        await modal.element.getByRole('textbox', {name: 'reason'}).fill(reason);
        await modal.getFooterButton('Cancel Event').click();
    }

    async function cancelEventFromListView(page: Page, listItem: Locator) {
        await (await getMenuItem(page, listItem, 'Cancel')).click();

        await modal.waitTillOpen();
        await modal.element.getByRole('textbox', {name: 'reason'}).fill(reason);
        await modal.getFooterButton('Cancel Event').click();
    }

    async function expectCancelledInPreview() {
        await preview.waitTillOpen();
        await expect(preview.element.locator('.label--yellow2')).toContainText('Cancelled');
        await expect(preview.element.getByTestId('internal-note-label')).toContainText(reason);
    }

    async function expectCancelledInEditor() {
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await expect(editor.element.getByTestId('internal-note-label')).toContainText(reason);
    }

    test('can cancel from the list', async({page}) => {
        // 1. Cancel Event from list
        // 1.a Create the Event
        reason = 'Cancelled due to some reason';

        await list.item(0).click();

        // 1.b Open the 'Cancel Event' modal, then close it
        await (await getMenuItem(page, list.item(0), 'Cancel')).click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();

        // 1.c Open the 'Cancel Event' modal again, and cancel the Event
        await cancelEventFromListView(page, list.item(0));
        await expect(list.item(0).locator('.label--yellow2')).toContainText('Cancelled');

        // 1.d Open the preview/editor and check cancel label/reason
        // Open the preview
        await list.item(0).click();
        await expectCancelledInPreview();

        // Open the editor
        await list.item(0).dblclick();
        await expectCancelledInEditor();
        await editor.closeButton.click();
    });

    test('can cancel from the preview', async() => {
        // 2. Cancel Event from preview
        // 2.a Create the Event
        reason = 'Cancelling2 something else';

        // 2.b Open the 'Cancel Event' modal from the preview panel, and cancel the Event
        await list.item(0).click();
        menu = preview.actionMenu;
        await cancelEvent();

        // 2.c Open the editor and check cancel label/reason
        // Open the preview
        await list.item(0).click();
        await expectCancelledInPreview();

        // Open the editor
        await list.item(0).dblclick();
        await expectCancelledInEditor();
        await editor.closeButton.click();
    });

    test('can cancel from the editor', async() => {
        // 3. Cancel from Editor with no unsaved changes
        // 3.a Create the Event
        reason = 'Cancelled three times';
        await expect(
            list.item(0).locator('.sd-list-item__border--locked')
        ).not.toBeVisible();

        // 3.b Open the Event in the editor
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        // 3.c Cancel the Event from the Editor
        menu = editor.actionMenu;
        await cancelEvent();

        // 3.d Open the preview and editor and check cancel label/reason
        // Open the preview
        await list.item(0).click();
        await expectCancelledInPreview();

        // Open the editor
        await list.item(0).dblclick();
        await expectCancelledInEditor();
        await editor.closeButton.click();
    });

    test('can cancel from the editor ignoring changes', async() => {
        // 4. Cancel from Editor ignoring unsaved changes
        // 4.a Create the Event
        reason = 'Cancelled without changes';
        await expect(
            list.item(0).locator('.sd-list-item__border--locked')
        ).not.toBeVisible();

        // 4.b Open the Event in the editor and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.type({slugline: 'Changed2'});

        // 4.c Start cancel action, showing ignore/cancel/save dialog
        // And cancel
        menu = editor.actionMenu;
        await menu.open();
        await menu.getAction('Cancel').click();
        await ignoreCancelSaveModal.waitTillOpen();
        await ignoreCancelSaveModal.getFooterButton('Cancel').click();
        await ignoreCancelSaveModal.waitTillClosed();

        // 4.d Start cancel action, showing ignore/cancel/save dialog
        // And ignore changes
        menu = editor.actionMenu;
        await menu.open();
        await menu.getAction('Cancel').click();
        await ignoreCancelSaveModal.waitTillOpen();
        await ignoreCancelSaveModal.getFooterButton('Ignore').click();
        await ignoreCancelSaveModal.waitTillClosed();

        // 4.e Now cancel the Event
        await modal.waitTillOpen();
        await modal.element
            .getByRole('textbox', {name: 'reason'})
            .fill(reason);
        await modal.getFooterButton('Cancel Event').click();

        // 4.f Open the preview and editor and check cancel label/reason
        // Open the preview
        await list.item(0).click();

        await expectCancelledInPreview();

        // Open the editor
        await list.item(0).dblclick();
        await expectCancelledInEditor();
    });

    // TODO: Fix this flaky test -- passes locally
    test.skip('can cancel from the editor saving changes', async() => {
        // 5. Cancel from Editor saving changes
        // 5.a Create the Event
        reason = 'Cancelled savings changes';
        await expect(
            list.item(0).locator('.sd-list-item__border--locked')
        ).not.toBeVisible();

        // 5.b Open the Event in the editor and make changes
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.type({slugline: 'Changed3'});

        // 5.c Start cancel action, showing ignore/cancel/save dialog
        // saving changes
        menu = editor.actionMenu;
        await menu.open();
        await menu.getAction('Cancel').click();
        await ignoreCancelSaveModal.waitTillOpen();
        await ignoreCancelSaveModal.getFooterButton('Save').click();
        await ignoreCancelSaveModal.waitTillClosed();

        // 5.d Now cancel the Event
        await modal.waitTillOpen();
        await modal.element
            .getByRole('textbox', {name: 'reason'})
            .fill(reason);
        await modal.getFooterButton('Cancel Event').click();

        // 5.e Open the preview and editor and check cancel label/reason
        // Open the preview
        await list.item(0).click();

        await expectCancelledInPreview();

        // Open the editor
        await list.item(0).dblclick();
        await expectCancelledInEditor();
    });
});
