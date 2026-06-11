import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, Workqueue, UiFrameworkModal, addItems} from './utils/common';
import {AdvancedSearch, EventEditor, PlanningList} from './page-object-models/planning';

import {TEST_EVENTS} from './utils/fixtures/events';

test.describe('Planning.Workqueue', () => {
    let editor: EventEditor;
    let list: PlanningList;
    let workqueue: Workqueue;
    let modal: UiFrameworkModal;
    let search: AdvancedSearch;

    test.beforeEach(async({page}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);
        workqueue = new Workqueue(page);
        modal = new UiFrameworkModal(page);
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('Events', async({page}) => {
        // Add the 3 Events we'll use for testing against
        await addItems(
            page.request,
            'events',
            [
                TEST_EVENTS.date_01_02_2045,
                TEST_EVENTS.date_02_02_2045,
                TEST_EVENTS.date_03_02_2045,
            ]
        );

        await search.setStartDate('01/02/2045');

        // Wait for the 3 items to appear in the list
        await list.expectItemCount(3);
        await workqueue.expectItemCount(0);

        // Open the first Event in the Editor
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        // Make sure the Event appeared in the Workqueue
        await workqueue.expectItemCount(1);
        await workqueue.expectItems([{
            title: 'Event Feb 1',
            icon: '.icon-event',
            active: true,
        }]);

        // Open the second Event in the Editor
        // This minimizes the first Event
        await list.item(1).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        // Make sure the Event appeared in the Workqueue
        await workqueue.expectItemCount(2);
        await workqueue.expectItems([
            {active: false},
            {
                title: 'Event Feb 2',
                icon: '.icon-event',
                active: true,
            }
        ]);

        // Switch Editor from Event 2 to Event 1
        await editor.expect({slugline: 'Event Feb 2'});
        await workqueue.getItem(0).click();
        await editor.expect({slugline: 'Event Feb 1'});
        await workqueue.expectItems([
            {active: true},
            {active: false},
        ]);

        // Make some changes then minimize the Editor
        await editor.type({slugline: '1st Event'});
        await editor.minimiseButton.click();
        await editor.waitTillClosed();
        await workqueue.expectItems([
            {active: false},
            {active: false},
        ]);

        // Re-open the Event
        await workqueue.getItem(0).click();
        await editor.waitTillOpen();
        await workqueue.expectItems([
            {active: true},
            {active: false},
        ]);

        // Save the Event and make sure the workqueue title updates
        await editor.saveButton.click();
        await workqueue.expectTitle(0, '1st Event');

        // Change the slugline again and minimise the Editor
        await editor.type({slugline: 'Update 2'});
        await editor.minimiseButton.click();
        await editor.waitTillClosed();

        // Attempt to close from the workqueue, and cancel
        await workqueue.closeItem(0);
        await modal.waitTillOpen();
        await modal.getFooterButton('Cancel').click();
        await modal.waitTillClosed();

        // Attempt to close from the workqueue, and Go-To
        await workqueue.closeItem(0);
        await modal.waitTillOpen();
        await modal.getFooterButton('Go-To').click();
        await modal.waitTillClosed();
        await editor.waitTillOpen();
        await editor.expect({slugline: 'Update 2'});

        // Minimise once more
        await editor.minimiseButton.click();
        await editor.waitTillClosed();

        // Attempt to close from the workqueue, and ignore
        await workqueue.closeItem(0);
        await modal.waitTillOpen();
        await modal.getFooterButton('Ignore').click();
        await modal.waitTillClosed();

        // Make sure the item is unlocked
        await workqueue.expectItemCount(1);
        await workqueue.expectItems([{
            title: 'Event Feb 2',
            icon: '.icon-event',
            active: false,
        }]);
        await expect(list.item(0).locator('.sd-list-item__border--locked')).not.toBeAttached();

        // Close the last item
        await workqueue.closeItem(0);
        await workqueue.expectItemCount(0);
        await expect(list.item(1).locator('.sd-list-item__border--locked')).not.toBeAttached();
    });

    test('infinite load with goto from workqueue', async({page}) => {
        // Add the Event/Planning items we'll use for testing against
        await addItems(page.request, 'events', [TEST_EVENTS.draft]);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        // Make a few changes
        await editor.type({slugline: 'edit-me'});
        await editor.waitForAutosave();

        // Attempt to close the item from the workqueue
        await workqueue.closeItem(0);
        await modal.waitTillOpen();
        await modal.getFooterButton('Go-To').click();
        await modal.waitTillClosed();

        // Wait until the loading has completed
        // await editor.waitLoadingComplete();
        await editor.closeButton.click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Ignore').click();
        await modal.waitTillClosed();
        await editor.waitTillClosed();
    });
});
