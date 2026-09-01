import {Page, test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, forceUnlockItem, Modal, getMenuItem} from './utils/common';
import {EventEditor, PlanningEditor, PlanningList, AssignmentEditor} from './page-object-models/planning';

import {TEST_PLANNINGS, createPlanningFor} from './utils/fixtures/planning';
import {TEST_EVENTS, createEventFor} from './utils/fixtures/events';

test.describe('Planning: item locks', () => {
    let list: PlanningList;
    let modal: Modal;
    let editor: EventEditor;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        modal = new Modal(page);
        editor = new EventEditor(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
    });

    async function testCancelActionFromModal(page: Page, actionLabel: string): Promise<void> {
        await list.item(0).click();

        // Open the Cancel Modal
        await (await getMenuItem(page, list.item(0), actionLabel)).click();
        await modal.waitTillOpen();
        await expect(list.item(0).getByTestId('item-locked-indicator')).toBeVisible();

        // Cancel the action and make sure the item get's unlocked
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();
    }

    async function testUnlockedFromModal(page: Page, actionLabel: string, itemType: string, itemId: string): Promise<void> {
        await list.item(0).click();

        // Open the Cancel Modal
        await (await getMenuItem(page, list.item(0), actionLabel)).click();
        await modal.waitTillOpen();
        await expect(list.item(0).getByTestId('item-locked-indicator')).toBeVisible();

        // Test another user force unlocks the item
        await forceUnlockItem(page.request, itemType, itemId);
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();
        await modal.shouldContainTitle('Item Unlocked');
        await modal.getFooterButton('OK').click();
        await modal.waitTillClosed();
    }

    async function testCancelActionFromEditPanel(actionLabel: string): Promise<void> {
        // Open the Event for editing, and make sure the form is not disabled
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await expect(editor.postButton).toBeVisible();
        await expect(editor.postButton).toBeEnabled();
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeEnabled();

        // Open the Cancel Modal, and make sure the form is now disabled
        await editor.actionMenu.open();
        await editor.actionMenu
            .getAction(actionLabel)
            .click();
        await modal.waitTillOpen();

        await expect(editor.postButton).not.toBeAttached();
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeDisabled();

        // Close the Cancel Modal, and make sure the form is not disabled
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();
        await expect(editor.postButton).toBeVisible();
        await expect(editor.postButton).toBeEnabled();
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeEnabled();

        // Close the editor
        await editor.closeButton.click()

        await editor.waitTillClosed();
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();
    }

    async function testUnlockedFromEditPanel(page: Page, actionLabel: string, itemType: string, itemId: string): Promise<void> {
        // Open the Event for editing, and make sure the form is not disabled
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await expect(editor.postButton).toBeVisible();
        await expect(editor.postButton).toBeEnabled();
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeEnabled();

        // Open the Cancel Modal, and make sure the form is now disabled
        await editor.actionMenu.open();
        await editor.actionMenu
            .getAction(actionLabel)
            .click();
        await modal.waitTillOpen();

        await expect(editor.postButton).not.toBeAttached();
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeDisabled();

        // Test another user force unlocks the item
        await forceUnlockItem(page.request, itemType, itemId);
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();
        await modal.shouldContainTitle('Item Unlocked');
        await modal.getFooterButton('OK').click();
        await modal.waitTillClosed();

        // Make sure the form is read-only state, and ready to be locked for editing
        await expect(editor.editButton).toBeVisible();
        await expect(editor.editButton).toBeEnabled();

        // Close the editor
        await editor.closeButton.click();
        await expect(list.item(0).getByTestId('item-locked-indicator')).not.toBeAttached();
    }

    test.describe('event actions', () => {
        test.beforeEach(async ({page}) => {
            await addItems(
                page.request,
                'events',
                [{
                    ...TEST_EVENTS.draft,
                    guid: 'event1',
                }]
            );
            await login(page);
            await waitForPageLoad.planning(page);
        });

        test('cancel action', async ({page}) => {
            await testCancelActionFromModal(page, 'Cancel');
            await testUnlockedFromModal(page, 'Cancel', 'events', 'event1');
            await testCancelActionFromEditPanel('Cancel');
            await testUnlockedFromEditPanel(page, 'Cancel', 'events', 'event1');
        });

        test('spike action', {
            annotation: [
                {type: 'confluence', description: '1311835127 complete'}, // Spike event
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Spike');
            await testUnlockedFromModal(page, 'Spike', 'events', 'event1');
            await testCancelActionFromEditPanel('Cancel');
            await testUnlockedFromEditPanel(page, 'Cancel', 'events', 'event1');
        });

        test('update time action', {
            annotation: [
                {type: 'confluence', description: '1311835131 complete'}, // Update event time
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Update time');
            await testUnlockedFromModal(page, 'Update time', 'events', 'event1');
            await testCancelActionFromEditPanel('Update time');
            await testUnlockedFromEditPanel(page, 'Update time', 'events', 'event1');
        });

        test('mark as postponed action', {
            annotation: [
                {type: 'confluence', description: '1311835133 complete'}, // Mark event as postponed
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Mark as Postponed');
            await testUnlockedFromModal(page, 'Mark as Postponed', 'events', 'event1');
            await testCancelActionFromEditPanel('Mark as Postponed');
            await testUnlockedFromEditPanel(page, 'Mark as Postponed', 'events', 'event1');
        });

        test('reschedule action', {
            annotation: [
                {type: 'confluence', description: '1311835135 complete'}, // Reschedule event
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Reschedule');
            await testUnlockedFromModal(page, 'Reschedule', 'events', 'event1');
            await testCancelActionFromEditPanel('Reschedule');
            await testUnlockedFromEditPanel(page, 'Reschedule', 'events', 'event1');
        });

        test('convert to recurring action', {
            annotation: [
                {type: 'confluence', description: '1311835137 complete'}, // Convert to recurring event
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Convert to Recurring Event');
            await testUnlockedFromModal(page, 'Convert to Recurring Event', 'events', 'event1');
            // No need to test editor actions, as this is not available in the Editor
        });
    });

    // An event and its primary-linked planning items share one "chain" lock,
    // stored server-side under the event id even when held by the planning
    test.describe('chain locks with event-linked planning items', () => {
        const EVENT_ID = 'chain_event_1';
        const PLAN_ID = 'chain_plan_1';
        let planningEditor: PlanningEditor;

        test.beforeEach(async ({page}) => {
            planningEditor = new PlanningEditor(page);

            await addItems(page.request, 'events', [createEventFor.today({
                guid: EVENT_ID,
                name: 'Chain Event',
                slugline: 'Chain Event',
            })]);
            await addItems(page.request, 'planning', [createPlanningFor.today({
                guid: PLAN_ID,
                slugline: 'Chain Planning',
                related_events: [{_id: EVENT_ID, link_type: 'primary'}],
            })]);
            await login(page);
            await waitForPageLoad.planning(page);
        });

        async function openLinkedPlanningForEdit(): Promise<void> {
            if (!(await list.nestedPlanningItem(0, 0).isVisible())) {
                await list.toggleAssociatedPlanning(0);
            }
            await list.nestedPlanningItem(0, 0).dblclick();
            await planningEditor.waitTillOpen();
        }

        test('editor stays editable after assigning a coverage to a desk and saving', async ({page}) => {
            await openLinkedPlanningForEdit();
            await expect(planningEditor.fields.slugline.element).toBeEnabled();

            await planningEditor.addCoverage('Text');

            const coverageEditor = planningEditor.getCoverageEditor(0);
            const assignmentEditor = new AssignmentEditor(page);

            await coverageEditor.editAssignmentButton.click();
            await assignmentEditor.waitTillOpen();
            await assignmentEditor.type({desk: 'Politic Desk'});
            await assignmentEditor.okButton.click();
            await assignmentEditor.waitTillClosed();

            const saveRequest = page.waitForResponse(
                (response) => response.url().includes('/api/planning/') && response.request().method() === 'PATCH',
            );

            await planningEditor.saveButton.click();
            await saveRequest;

            // Save disabling marks the save as processed; the regression
            // swapped the toolbar to Close/Edit at this point
            await expect(planningEditor.saveButton).toBeDisabled();
            await expect(coverageEditor.element).toContainText('Politic Desk');
            await expect(planningEditor.editButton).not.toBeAttached();
            await expect(planningEditor.fields.slugline.element).toBeEnabled();

            // The session still holds the lock, so a reload must reopen
            // straight into edit mode
            await page.reload();
            await waitForPageLoad.planning(page);
            await openLinkedPlanningForEdit();

            await expect(planningEditor.editButton).not.toBeAttached();
            await expect(planningEditor.fields.slugline.element).toBeEnabled();
        });

        test('read-only planning item hides Edit while the linked event is being edited', async ({page}) => {
            await list.item(0).dblclick();
            await editor.waitTillOpen();
            await expect(editor.fields.slugline.element).toBeEnabled();

            await list.toggleAssociatedPlanning(0);
            await list.nestedPlanningItem(0, 0).dblclick();
            await planningEditor.waitTillOpen();

            await expect(planningEditor.fields.slugline.element).toHaveValue('Chain Planning');
            await expect(planningEditor.fields.slugline.element).toBeDisabled();
            await expect(planningEditor.editButton).not.toBeAttached();

            // Edit appearing after the unlock proves its absence was lock-driven.
            // The "Item Unlocked" modal backdrop aria-hides the editor, so
            // dismiss it before asserting
            await forceUnlockItem(page.request, 'events', EVENT_ID);
            await modal.waitTillOpen();
            await modal.shouldContainTitle('Item Unlocked');
            await modal.getFooterButton('OK').click();
            await modal.waitTillClosed();

            await expect(planningEditor.editButton).toBeVisible();
            await planningEditor.editButton.click();
            await expect(planningEditor.fields.slugline.element).toBeEnabled();
        });
    });

    test.describe('planning actions', () => {
        test.beforeEach(async ({page}) => {
            await addItems(
                page.request,
                'planning',
                [{
                    ...TEST_PLANNINGS.draft,
                    guid: 'plan1',
                }]
            );
            await login(page);
            await waitForPageLoad.planning(page);
        });

        test('spike action', {
            annotation: [
                {type: 'confluence', description: '1311835167 complete'}, // Spike planning
            ],
        }, async ({page}) => {
            await testCancelActionFromModal(page, 'Spike');
            await testUnlockedFromModal(page, 'Spike', 'planning', 'plan1');
            await testCancelActionFromEditPanel('Spike');
            await testUnlockedFromEditPanel(page, 'Spike', 'planning', 'plan1');
        });
    });
});
