import {setup, login, addItems, waitForPageLoad, SubNavBar} from '../../support/common';
import {createPlanningFor} from '../../fixtures/planning';
import {FeaturedModal} from '../../support/planning/planning/featuredModal';
import {PlanningList, PlanningEditor, PlanningPreview} from '../../support/planning';

describe('Planning.Featured', () => {
    const subnav = new SubNavBar();
    const modal = new FeaturedModal();
    const list = new PlanningList();
    const editor = new PlanningEditor();
    const preview = new PlanningPreview();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('planning', [
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
        ]);
        login();
        waitForPageLoad.planning();
    });

    function openFeaturedStoriesModal() {
        // Open 'Featured Stories' modal
        subnav.menuBtn.click();
        subnav.menu
            .contains('Featured stories')
            .should('exist')
            .click();

        // Wait for the Modal to open
        modal.waitTillOpen(30000);
        modal.waitTillLoadingFinished();
        modal.shouldContainTitle('Featured Stories');
    }

    function postPlanningItem(slugline: string) {
        // postPlanningItemUsingApi(slugline);
        list.items()
            .contains(slugline)
            .dblclick();

        editor.waitLoadingComplete();
        editor.postButton
            .should('exist')
            .click()
        editor.waitForAutosave();
        editor.closeButton
            .should('exist')
            .click()
        editor.waitTillClosed();
    }

    function addPlanningToFeaturedStories(slugline: string) {
        list.items().contains(slugline).click();

        preview.element
            .contains(slugline)
            .should('exist');
        preview.clickAction('Add to featured stories');
    }

    function removePlanningFromFeaturedStories(slugline: string) {
        list.items().contains(slugline).click();

        preview.element
            .contains(slugline)
            .should('exist');
        preview.clickAction('Remove from featured stories');
    }

    it('can add a new item', () => {
        openFeaturedStoriesModal();

        // 1. Open the Modal with a new FeaturedStory
        // Because this is a new FeaturedStory list, we should have unsaved changes
        // So make sure all 3 footer buttons exist
        modal.expectFooterButtons(['Cancel', 'Save', 'Post']);
        modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_1'],
            removed: null,
        });

        // 2. Attempt to close the Modal, then cancel
        modal.footerButton('Cancel')
            .should('exist')
            .click();
        modal.shouldContainTitle('Save Changes?');
        modal
            .getFooterButton('Cancel')
            .should('exist')
            .click();
        modal.shouldContainTitle('Featured Stories');

        // 3. Attempt to close the Modal again, ignoring unsaved changes
        modal.footerButton('Cancel')
            .should('exist')
            .click();
        modal.shouldContainTitle('Save Changes?');
        modal
            .getFooterButton('Ignore')
            .should('exist')
            .click();
        modal.waitTillClosed(30000);

        // 4. Attempt to open -> close the Modal again, this time saving the changes
        openFeaturedStoriesModal();
        modal.footerButton('Cancel')
            .should('exist')
            .click();
        modal.shouldContainTitle('Save Changes?');
        modal.footerButton('Save')
            .should('exist')
            .click();
        modal.waitTillClosed(30000);

        // 5. Post the Planning item
        postPlanningItem('Today_Featured_1');
        postPlanningItem('Today_Featured_2');

        // 6. Make sure there are no unsaved changes when re-opening the modal
        openFeaturedStoriesModal();
        modal.expectFooterButtons(['Close', 'Post']);

        // 7. Post the FeaturedStory list, and make sure there are no unsaved changes afterwards
        modal.footerButton('Post')
            .should('exist')
            .click();
        modal.waitTillLoadingFinished();
        // Make sure the modal is not dirty, and only `Close` is available
        modal.expectFooterButtons(['Close']);
        modal.footerButton('Close')
            .should('exist')
            .click();

        // 8. Add a new item to FeaturedStories, and make sure it appears
        addPlanningToFeaturedStories('Today_Featured_2');
        openFeaturedStoriesModal();
        // Check list lengths
        modal.expectListEntries({
            available: ['Today_Featured_2'],
            selected: ['Today_Featured_1'],
            removed: null,
        });

        // 9. Move the new item to the Selected list, and update the FeaturedStory
        modal.addItemToSelected(0);
        modal.expectFooterButtons(['Cancel', 'Update', 'Save']);
        modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2', 'Today_Featured_1'],
            removed: null,
        });
        // Make sure this item is highlighted after moving it
        modal.expectListItemHighlighted('selected', 0)
        // Update the FeaturedStory, then close the modal
        modal.footerButton('Update')
            .should('exist')
            .click();
        modal.waitTillLoadingFinished();
        modal.footerButton('Close')
            .should('exist')
            .click();
        modal.waitTillClosed();

        // 10. Remove an item from FeaturedStories, and make sure it's auto-removed
        removePlanningFromFeaturedStories('Today_Featured_1');
        openFeaturedStoriesModal();
        modal.expectFooterButtons(['Cancel', 'Update', 'Save']);
        modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2'],
            removed: ['Today_Featured_1'],
        });

        // 11. Make sure the auto-removed item is removed on update of FeaturedStory
        modal.footerButton('Update')
            .should('exist')
            .click();
        modal.waitTillLoadingFinished();
        modal.expectFooterButtons(['Close']);
        modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_2'],
            removed: null,
        });
        modal.footerButton('Close')
            .should('exist')
            .click();
        modal.waitTillClosed();

        // 12. Add an un-posted item to FeaturedStories, making sure we can't post the Featured Story
        // As ALL Planning items must be posted
        addPlanningToFeaturedStories('Today_Featured_3');
        openFeaturedStoriesModal();
        modal.expectFooterButtons(['Close']);
        // Make sure the item is available to be selected
        modal.expectListEntries({
            available: ['Today_Featured_3'],
            selected: ['Today_Featured_2'],
            removed: null,
        });

        // Add the item, making sure dirty changes are registered
        modal.addItemToSelected(0);
        modal.expectFooterButtons(['Cancel', 'Update', 'Save']);
        modal.expectListEntries({
            available: [],
            selected: ['Today_Featured_3', 'Today_Featured_2'],
            removed: null,
        });

        // Attempt to update the FeaturedStory, checking the error message
        modal.footerButton('Update')
            .should('exist')
            .click();
        cy.get('[data-test-id="notifications"] [data-test-id="notification--error"]')
            .should('exist')
            .contains('Some selected items have not yet been posted');
    });
});
