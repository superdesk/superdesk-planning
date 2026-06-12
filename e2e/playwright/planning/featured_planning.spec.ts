import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad, SubNavBar, UiFrameworkModal} from '../utils/common';
import {PlanningList, PlanningEditor, PlanningPreview, FeaturedModal} from '../page-object-models/planning';
import {createPlanningFor} from '../utils/fixtures/planning';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';

test.describe('Planning.Featured', () => {
    let subnav: SubNavBar;
    let modal: FeaturedModal;
    let uiFrameworkModal: UiFrameworkModal;
    let list: PlanningList;
    let editor: PlanningEditor;
    let preview: PlanningPreview;

    test.beforeEach(async({page}) => {
        subnav = new SubNavBar(page);
        modal = new FeaturedModal(page);
        uiFrameworkModal = new UiFrameworkModal(page);
        list = new PlanningList(page);
        editor = new PlanningEditor(page);
        preview = new PlanningPreview(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await setupPlanningPublishing(page.request);
        await addItems(
            page.request,
            'planning',
            [
                createPlanningFor.today({
                    slugline: 'Today_Featured_1',
                    featured: true,
                }),
                createPlanningFor.today({
                    slugline: 'Today_Featured_2',
                    featured: false,
                }),
                createPlanningFor.today({
                    slugline: 'Today_Featured_3',
                    featured: false,
                }),
                createPlanningFor.today({slugline: 'Today_NOT_Featured'})
            ]
        );
        await login(page);
        await waitForPageLoad.planning(page);
    });

    async function openFeaturedStoriesModal(): Promise<void> {
        // Open 'Featured Stories' modal
        await subnav.menuBtn.click();
        await subnav.menu
            .getByText('Featured stories')
            .click();

        // Wait for the Modal to open
        await modal.waitTillOpen();
        await modal.waitTillLoadingFinished();
        await modal.shouldContainTitle('Featured Stories');
    }

    async function postPlanningItem(slugline: string): Promise<void> {
        await list.items()
            .getByText(slugline)
            .dblclick();

        await editor.waitLoadingComplete();
        await editor.postButton.click();
        await editor.waitForAutosave();
        await editor.closeButton.click();
        await editor.waitTillClosed();
    }

    async function addPlanningToFeaturedStories(slugline: string): Promise<void> {
        await list.items().getByText(slugline)
            .click();
        await expect(preview.element.getByText(slugline)).toBeVisible();
        await preview.clickAction('Add to featured stories');
    }

    async function removePlanningFromFeaturedStories(slugline: string): Promise<void> {
        await list.items().getByText(slugline)
            .click();

        await expect(preview.element
            .getByText(slugline)).toBeVisible();
        await preview.clickAction('Remove from featured stories');
    }

    test('can add a new item', async({page}) => {
        await openFeaturedStoriesModal();

        // 1. Open the Modal with a new FeaturedStory
        // Because this is a new FeaturedStory list, we should have unsaved changes
        // So make sure all 3 footer buttons exist
        await modal.expectFooterButtons(['Close', 'Save', 'Post']);
        await modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_1'],
            removed: null,
        });

        // 2. Attempt to close the Modal, then cancel
        await modal.footerButton('Close').click();
        await uiFrameworkModal.shouldContainTitle('Unsaved changes');
        await uiFrameworkModal.getFooterButton('Cancel').click();
        await modal.shouldContainTitle('Featured Stories');

        // 3. Attempt to close the Modal again, ignoring unsaved changes
        await modal.footerButton('Close').click();
        await uiFrameworkModal.shouldContainTitle('Unsaved changes');
        await uiFrameworkModal.getFooterButton('Ignore').click();
        await modal.waitTillClosed();

        // Wait a moment for the modal to fully clean up before reopening
        await page.waitForTimeout(500);

        // 4. Attempt to open -> close the Modal again, this time saving the changes
        await openFeaturedStoriesModal();
        // Wait until this new Featured Story instance is marked dirty
        // before closing, otherwise CI can close before the prompt is ready.
        await modal.expectFooterButtons(['Close', 'Save', 'Post']);
        await modal.footerButton('Close').click();
        await uiFrameworkModal.shouldContainTitle('Unsaved changes');
        await uiFrameworkModal.getFooterButton('Save').click();
        await modal.waitTillClosed();

        // 5. Post the Planning item
        await postPlanningItem('Today_Featured_1');
        await postPlanningItem('Today_Featured_2');

        // 6. Make sure there are no unsaved changes when re-opening the modal
        await openFeaturedStoriesModal();
        await modal.expectFooterButtons(['Close', 'Post']);

        // 7. Post the FeaturedStory list, and make sure there are no unsaved changes afterwards
        await modal.footerButton('Post').click();
        await modal.waitTillLoadingFinished();
        // Make sure the modal is not dirty, and only `Close` is available
        await modal.expectFooterButtons(['Close']);
        await modal.footerButton('Close').click();

        // 8. Add a new item to FeaturedStories, and make sure it appears
        await addPlanningToFeaturedStories('Today_Featured_2');
        await openFeaturedStoriesModal();
        // Check list lengths
        await modal.expectListEntries({
            available: ['Today_Featured_2'],
            selected: ['Today_Featured_1'],
            removed: null,
        });

        // 9. Move the new item to the Selected list, and update the FeaturedStory
        await modal.addItemToSelected(0);
        await modal.expectFooterButtons(['Close', 'Update', 'Save']);
        await modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2', 'Today_Featured_1'],
            removed: null,
        });
        // Make sure this item is highlighted after moving it
        await modal.expectListItemHighlighted('selected', 0);
        // Update the FeaturedStory, then close the modal
        await modal.footerButton('Update').click();
        await modal.waitTillLoadingFinished();
        await modal.footerButton('Close').click();
        await modal.waitTillClosed();

        // 10. Remove an item from FeaturedStories, and make sure it's auto-removed
        await removePlanningFromFeaturedStories('Today_Featured_1');
        await openFeaturedStoriesModal();
        await modal.expectFooterButtons(['Close', 'Update', 'Save']);
        await modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2'],
            removed: ['Today_Featured_1'],
        });

        // 11. Make sure the auto-removed item is removed on update of FeaturedStory
        await modal.footerButton('Update').click();
        await modal.waitTillLoadingFinished();
        await modal.expectFooterButtons(['Close']);
        await modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2'],
            removed: null,
        });
        await modal.footerButton('Close').click();
        await modal.waitTillClosed();

        // 12. Add an un-posted item to FeaturedStories, making sure we can't post the Featured Story
        // As ALL Planning items must be posted
        await addPlanningToFeaturedStories('Today_Featured_3');
        await openFeaturedStoriesModal();
        await modal.expectFooterButtons(['Close']);
        // Make sure the item is available to be selected
        await modal.expectListEntries({
            available: ['Today_Featured_3'],
            selected: ['Today_Featured_2'],
            removed: null,
        });

        // Add the item, making sure dirty changes are registered
        await modal.addItemToSelected(0);
        await modal.expectFooterButtons(['Close', 'Update', 'Save']);
        await modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_3', 'Today_Featured_2'],
            removed: null,
        });

        // Attempt to update the FeaturedStory, checking the error message
        await modal.footerButton('Update').click();
        await expect(
            page
                .getByTestId('notifications')
                .getByTestId('notification--error')
        ).toContainText('Some selected items have not yet been posted');
    });
});
