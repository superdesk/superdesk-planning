import {setup, login, addItems, waitForPageLoad, Modal} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
import {PlanningList, EventEditor, PlanningPreview} from '../../support/planning';
import {getMenuItem} from '../../support/common/ui/actionMenu';

describe('Planning.Events: event cancel action', () => {
    const editor = new EventEditor();
    const modal = new Modal();
    const preview = new PlanningPreview();
    const list = new PlanningList();
    let menu;
    let reason;

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('events', [{
            type: 'event',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            dates: {
                start: '2045-12-11' + TIME_STRINGS[0],
                end: '2045-12-11' + TIME_STRINGS[1],
                tz: 'Australia/Sydney',
            },
            calendars: [],
            state: 'draft',
            place: [],
            name: 'Test',
            slugline: 'Original',
        }]);

        login();

        waitForPageLoad.planning();
    });

    function cancelEvent() {
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.waitTillOpen(30000);
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();
    }

    function cancelEventFromListView(listItem) {
        getMenuItem(listItem, 'Cancel').click();

        modal.waitTillOpen(30000);
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();
    }

    function expectCancelledInPreview() {
        preview.waitTillOpen();
        preview.element
            .find('.label--yellow2', {timeout: 30000})
            .should('contain.text', 'Cancelled');

        preview.element
            .find('.internal-note__label')
            .parent()
            .should('contain.text', reason);
    }

    function expectCancelledInEditor() {
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.element
            .find('.internal-note__label')
            .parent()
            .should('contain.text', reason);
    }

    it('can cancel from the list', () => {
        // 1. Cancel Event from list
        // 1.a Create the Event
        reason = 'Cancelled due to some reason';

        list.item(0)
            .click();

        // 1.b Open the 'Cancel Event' modal, then close it
        getMenuItem(list.item(0), 'Cancel').click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Cancel')
            .click();
        modal.waitTillClosed();

        // 1.c Open the 'Cancel Event' modal again, and cancel the Event
        cancelEventFromListView(list.item(0));
        list.item(0)
            .find('.label--yellow2')
            .should('contain.text', 'Cancelled');

        // 1.d Open the preview/editor and check cancel label/reason
        // Open the preview
        list.item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        list.item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton
            .should('exist')
            .click();
    });

    it('can cancel from the preview', () => {
        // 2. Cancel Event from preview
        // 2.a Create the Event
        reason = 'Cancelling2 something else';

        // 2.b Open the 'Cancel Event' modal from the preview panel, and cancel the Event
        list.item(0)
            .click();
        menu = preview.actionMenu;
        cancelEvent();

        // 2.c Open the editor and check cancel label/reason
        // Open the preview
        list.item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        list.item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton
            .should('exist')
            .click();
    });

    it('can cancel from the editor', () => {
        // 3. Cancel from Editor with no unsaved changes
        // 3.a Create the Event
        reason = 'Cancelled three times';
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 3.b Open the Event in the editor
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        // 3.c Cancel the Event from the Editor
        menu = editor.actionMenu;
        cancelEvent();

        // 3.d Open the preview and editor and check cancel label/reason
        // Open the preview
        list.item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        list.item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton
            .should('exist')
            .click();
    });

    it('can cancel from the editor ignoring changes', () => {
        // 4. Cancel from Editor ignoring unsaved changes
        // 4.a Create the Event
        reason = 'Cancelled without changes';
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 4.b Open the Event in the editor and make changes
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.type({slugline: 'Changed2'});

        // 4.c Start cancel action, showing ignore/cancel/save dialog
        // And cancel
        menu = editor.actionMenu;
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.waitTillOpen();
        modal.getFooterButton('Cancel')
            .click();
        modal.waitTillClosed();

        // 4.d Start cancel action, showing ignore/cancel/save dialog
        // And ignore changes
        menu = editor.actionMenu;
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.waitTillOpen();
        modal.getFooterButton('Ignore')
            .click();
        modal.waitTillClosed();

        // 4.e Now cancel the Event
        modal.waitTillOpen();
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();

        // 4.f Open the preview and editor and check cancel label/reason
        // Open the preview
        list.item(0)
            .click();

        expectCancelledInPreview();

        // Open the editor
        list.item(0)
            .dblclick();
        expectCancelledInEditor();
    });

    it('can cancel from the editor saving changes', () => {
        // 5. Cancel from Editor saving changes
        // 5.a Create the Event
        reason = 'Cancelled savings changes';
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 5.b Open the Event in the editor and make changes
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();
        editor.type({slugline: 'Changed3'});

        // 5.c Start cancel action, showing ignore/cancel/save dialog
        // saving changes
        menu = editor.actionMenu;
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.waitTillOpen();
        modal.getFooterButton('Save')
            .click();
        modal.waitTillClosed();

        // 5.d Now cancel the Event
        modal.waitTillOpen();
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();

        // 5.e Open the preview and editor and check cancel label/reason
        // Open the preview
        list.item(0)
            .click();

        expectCancelledInPreview();

        // Open the editor
        list.item(0)
            .dblclick();
        expectCancelledInEditor();
    });
});
