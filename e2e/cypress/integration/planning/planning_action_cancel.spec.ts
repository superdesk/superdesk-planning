import {setup, addItems, login, waitForPageLoad, Modal} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
import {PlanningList, PlanningEditor, PlanningPreview} from '../../support/planning';
import {getMenuItem} from '../../support/common/ui/actionMenu';

describe('Planning.Planning: cancel planning item', () => {
    const editor = new PlanningEditor();
    const modal = new Modal();
    const preview = new PlanningPreview();
    const list = new PlanningList();
    let reason;

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('planning', [{
            slugline: 'Test Planning Item',
            planning_date: '2045-12-11' + TIME_STRINGS[0],
        }]);

        login();
        waitForPageLoad.planning();
    });

    it('can cancel a Planning item', () => {
        reason = 'Not covering anymore';
        list.item(0)
            .click();

        // Make sure 'Cancel Planning' is not available on
        // Planning items that haven't been published

        getMenuItem(list.item(0), 'Cancel Planning').should('not.exist');


        // Post the Planning item
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.postButton
            .should('exist')
            .click();
        editor.waitForAutosave();
        editor.waitLoadingComplete();
        editor.closeButton
            .should('exist')
            .click();

        // Make sure the list item shows the 'Scheduled' badge
        // and is no longer locked
        list.item(0)
            .find('.label--success')
            .should('contain.text', 'Scheduled');
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // Now make sure the 'Cancel Planning' action is there
        // and cancel the item
        list.item(0)
            .click();

        getMenuItem(list.item(0), 'Cancel Planning').realClick();

        modal.waitTillOpen(30000);

        // Make sure the item is locked at this point in time
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('exist');
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Planning')
            .click();
        modal.waitTillClosed();

        // Now make sure the list item shows the 'Cancelled' badge
        // and is no longer locked
        list.item(0)
            .find('.label--yellow2')
            .should('contain.text', 'Cancelled');
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // Make sure the 'Cancelled' badge and reason appears in the Preview
        list.item(0)
            .click();
        preview.waitTillOpen();
        preview.element
            .find('.label--yellow2', {timeout: 30000})
            .should('contain.text', 'Cancelled');
        preview.element
            .find('.internal-note__label')
            .parent()
            .should('contain.text', reason);

        // Make sure the 'Cancelled' badge and reason appears in the Editor
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.element
            .find('.internal-note__label')
            .parent()
            .should('contain.text', reason);
        editor.closeButton
            .should('exist')
            .click();
    });
});
