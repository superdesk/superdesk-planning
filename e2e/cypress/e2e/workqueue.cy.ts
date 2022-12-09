import {setup, login, waitForPageLoad, Workqueue, Modal, addItems} from '../support/common';
import {EventEditor, PlanningList} from '../support/planning';
import {TEST_EVENTS} from '../fixtures/events';

describe('Planning.Workqueue', () => {
    const editor = new EventEditor();
    const list = new PlanningList();
    const workqueue = new Workqueue();
    const modal = new Modal();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('Events', () => {
        // Add the 3 Events we'll use for testing against
        addItems('events', [
            TEST_EVENTS.date_01_02_2045,
            TEST_EVENTS.date_02_02_2045,
            TEST_EVENTS.date_03_02_2045,
        ]);

        // Wait for the 3 items to appear in the list
        list.expectItemCount(3);
        workqueue.expectItemCount(0);

        // Open the first Event in the Editor
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        // Make sure the Event appeared in the Workqueue
        workqueue.expectItemCount(1);
        workqueue.expectItems([{
            title: 'Event Feb 1',
            icon: '.icon-event',
            active: true,
        }]);

        // Open the second Event in the Editor
        // This minimizes the first Event
        list.item(1)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        // Make sure the Event appeared in the Workqueue
        workqueue.expectItemCount(2);
        workqueue.expectItems([{
            active: false,
        }, {
            title: 'Event Feb 2',
            icon: '.icon-event',
            active: true,
        }]);

        // Switch Editor from Event 2 to Event 1
        editor.expect({slugline: 'Event Feb 2'});
        workqueue.getItem(0)
            .click();
        editor.expect({slugline: 'Event Feb 1'});
        workqueue.expectItems([
            {active: true},
            {active: false},
        ]);

        // Make some changes then minimize the Editor
        editor.type({slugline: '1st Event'});
        editor.minimiseButton
            .should('exist')
            .and('be.enabled')
            .click();
        editor.waitTillClosed();
        workqueue.expectItems([
            {active: false},
            {active: false},
        ]);

        // Re-open the Event
        workqueue.getItem(0).click();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        workqueue.expectItems([
            {active: true},
            {active: false},
        ]);

        // Save the Event and make sure the workqueue title updates
        editor.saveButton
            .should('exist')
            .and('be.enabled')
            .click();
        workqueue.expectTitle(0, '1st Event');

        // Change the slugline again and minimise the Editor
        editor.type({slugline: 'Update 2'});
        editor.minimiseButton
            .should('exist')
            .and('be.enabled')
            .click();
        editor.waitTillClosed();

        // Attempt to close from the workqueue, and cancel
        workqueue.closeItem(0);
        modal.waitTillOpen(30000);
        modal.getFooterButton('Cancel')
            .should('exist')
            .click();
        modal.waitTillClosed();

        // Attempt to close from the workqueue, and Go-To
        workqueue.closeItem(0);
        modal.waitTillOpen(30000);
        modal.getFooterButton('Go-To')
            .should('exist')
            .click();
        modal.waitTillClosed();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.expect({slugline: 'Update 2'});

        // Minimise once more
        editor.minimiseButton
            .should('exist')
            .and('be.enabled')
            .click();
        editor.waitTillClosed();

        // Attempt to close from the workqueue, and ignore
        workqueue.closeItem(0);
        modal.waitTillOpen(30000);
        modal.getFooterButton('Ignore')
            .should('exist')
            .click();
        modal.waitTillClosed();

        // Make sure the item is unlocked
        workqueue.expectItemCount(1);
        workqueue.expectItems([{
            title: 'Event Feb 2',
            icon: '.icon-event',
            active: false,
        }]);
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // Close the last item
        workqueue.closeItem(0);
        workqueue.expectItemCount(0);
        list.item(1)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
    });

    it('SDESK-6142: infinite load with goto from workqueue', () => {
        // Add the Event/Planning items we'll use for testing against
        addItems('events', [TEST_EVENTS.draft]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        // Make a few changes
        editor.type({slugline: 'edit-me'});
        editor.waitForAutosave();

        // Attempt to close the item from the workqueue
        workqueue.closeItem(0);
        modal.waitTillOpen(30000);
        modal.getFooterButton('Go-To')
            .should('exist')
            .click();
        modal.waitTillClosed();

        // Wait until the loading has completed
        editor.waitLoadingComplete();
        editor.closeButton
            .should('exist')
            .and('be.enabled')
            .click();
        modal.waitTillOpen();
        modal.getFooterButton('Ignore')
            .click();
        modal.waitTillClosed();
        editor.waitTillClosed();
    });
});
