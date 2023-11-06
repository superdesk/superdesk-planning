import {setup, login, waitForPageLoad, addItems, forceUnlockItem, Modal} from '../support/common';
import {EventEditor, PlanningList} from '../support/planning';
import {TEST_EVENTS} from '../fixtures/events';
import {TEST_PLANNINGS} from '../fixtures/planning';
import {getMenuItem} from '../support/common/ui/actionMenu';

describe('Planning: item locks', () => {
    const list = new PlanningList();
    const modal = new Modal();
    const editor = new EventEditor();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
    });

    function testCancelActionFromModal(actionLabel) {
        list.item(0).click();

        // Open the Cancel Modal
        getMenuItem(list.item(0), actionLabel).click();
        modal.waitTillOpen();
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('exist');

        // Cancel the action and make sure the item get's unlocked
        modal.getFooterButton('Cancel').click();
        modal.waitTillClosed();
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
    }

    function testUnlockedFromModal(actionLabel, itemType, itemId) {
        list.item(0).click();

        // Open the Cancel Modal
        getMenuItem(list.item(0), actionLabel).click();
        modal.waitTillOpen();
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('exist');

        // Test another user force unlocks the item
        forceUnlockItem(itemType, itemId);
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
        modal.shouldContainTitle('Item Unlocked');
        modal.getFooterButton('OK').click();
        modal.waitTillClosed();
    }

    function testCancelActionFromEditPanel(actionLabel, ignoreCancelSavedShown = false) {
        // Open the Event for editing, and make sure the form is not disabled
        list.item(0).dblclick();
        editor.waitTillOpen();
        editor.postButton
            .should('exist')
            .and('be.enabled');
        editor.fields.slugline.element
            .should('exist')
            .and('be.enabled');

        // Open the Cancel Modal, and make sure the form is now disabled
        editor.actionMenu.open();
        editor.actionMenu
            .getAction(actionLabel)
            .click();
        modal.waitTillOpen();

        editor.postButton
            .should('not.exist');
        editor.fields.slugline.element
            .should('exist')
            .and('be.disabled');

        // Close the Cancel Modal, and make sure the form is not disabled
        modal.getFooterButton('Cancel').click();
        modal.waitTillClosed();
        editor.postButton
            .should('exist')
            .and('be.enabled');
        editor.fields.slugline.element
            .should('exist')
            .and('be.enabled');

        // Close the editor
        editor.closeButton
            .should('exist')
            .click()

        // TODO[BUG]: This should not be happening
        if (ignoreCancelSavedShown) {
            modal.waitTillOpen();
            modal.getFooterButton('Ignore')
                .should('exist')
                .click();
        }
        editor.waitTillClosed();
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
    }

    function testUnlockedFromEditPanel(actionLabel, itemType, itemId) {
        // Open the Event for editing, and make sure the form is not disabled
        list.item(0).dblclick();
        editor.waitTillOpen();
        editor.postButton
            .should('exist')
            .and('be.enabled');
        editor.fields.slugline.element
            .should('exist')
            .and('be.enabled');

        // Open the Cancel Modal, and make sure the form is now disabled
        editor.actionMenu.open();
        editor.actionMenu
            .getAction(actionLabel)
            .click();
        modal.waitTillOpen();

        editor.postButton
            .should('not.exist');
        editor.fields.slugline.element
            .should('exist')
            .and('be.disabled');

        // Test another user force unlocks the item
        forceUnlockItem(itemType, itemId);
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
        modal.shouldContainTitle('Item Unlocked');
        modal.getFooterButton('OK').click();
        modal.waitTillClosed();

        // Make sure the form is read-only state, and ready to be locked for editing
        editor.editButton
            .should('exist')
            .and('be.enabled');

        // Close the editor
        editor.closeButton
            .should('exist')
            .click();
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
    }

    describe('event actions', () => {
        beforeEach(() => {
            addItems('events', [
                {
                    ...TEST_EVENTS.draft,
                    guid: 'event1',
                }
            ]);
            login();
            waitForPageLoad.planning();
        });

        it('cancel action', () => {
            testCancelActionFromModal('Cancel');
            testUnlockedFromModal('Cancel', 'events', 'event1');
            testCancelActionFromEditPanel('Cancel', true);
            testUnlockedFromEditPanel('Cancel', 'events', 'event1');
        });

        it('spike action', () => {
            testCancelActionFromModal('Spike');
            testUnlockedFromModal('Spike', 'events', 'event1');

            // TODO: Fix cancel action modal from editor, not returning to Edit state
            testCancelActionFromEditPanel('Cancel', true);
            testUnlockedFromEditPanel('Cancel', 'events', 'event1');
        });

        it('update time action', () => {
            testCancelActionFromModal('Update time');
            testUnlockedFromModal('Update time', 'events', 'event1');
            testCancelActionFromEditPanel('Update time', true);
            testUnlockedFromEditPanel('Update time', 'events', 'event1');
        });

        it('mark as postponed action', () => {
            testCancelActionFromModal('Mark as Postponed');
            testUnlockedFromModal('Mark as Postponed', 'events', 'event1');
            testCancelActionFromEditPanel('Mark as Postponed', true);
            testUnlockedFromEditPanel('Mark as Postponed', 'events', 'event1');
        });

        it('reschedule action', () => {
            testCancelActionFromModal('Reschedule');
            testUnlockedFromModal('Reschedule', 'events', 'event1');
            testCancelActionFromEditPanel('Reschedule', true);
            testUnlockedFromEditPanel('Reschedule', 'events', 'event1');
        });

        it('convert to recurring action', () => {
            testCancelActionFromModal('Convert to Recurring Event');
            testUnlockedFromModal('Convert to Recurring Event', 'events', 'event1');
            // No need to test editor actions, as this is not available in the Editor
        });
    });

    describe('planning actions', () => {
        beforeEach(() => {
            addItems('planning', [
                {
                    ...TEST_PLANNINGS.draft,
                    guid: 'plan1',
                }
            ]);
            login();
            waitForPageLoad.planning();
        });

        it('spike action', () => {
            testCancelActionFromModal('Spike');
            testUnlockedFromModal('Spike', 'planning', 'plan1');
            testCancelActionFromEditPanel('Spike');
            testUnlockedFromEditPanel('Spike', 'planning', 'plan1');
        });
    });
});
