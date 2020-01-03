import {
    App,
    UI,
    Preview,
    Editors,
} from '../../support';

describe('event action cancel', () => {
    const editor = new Editors.EventEditor();
    const modal = new UI.Modal();
    let menu;

    const event = {
        'dates.start.date': '12/12/2045',
        'dates.start.time': '00:00',
        slugline: 'Original',
        name: 'Test',
    };
    let reason;

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});

        cy.visit('/#/planning');
        App.login();

        UI.waitForPageLoad();
    });

    function cancelEvent() {
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.wait(30000);
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();
    }

    function expectCancelledInPreview() {
        Preview.waitTillOpen();
        Preview.element
            .find('.label--yellow2')
            .should('contain.text', 'Cancelled');

        Preview.element
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
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);
        reason = 'Cancelled due to some reason';

        UI.ListPanel
            .item(0)
            .click();

        // 1.b Open the 'Cancel Event' modal, then close it
        menu = UI.ListPanel.getActionMenu(0);
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.wait(30000);
        modal.getFooterButton('Cancel')
            .click();
        modal.waitForClose();

        // 1.c Open the 'Cancel Event' modal again, and cancel the Event
        cancelEvent();
        UI.ListPanel
            .item(0)
            .find('.label--yellow2')
            .should('contain.text', 'Cancelled');

        // 1.d Open the preview/editor and check cancel label/reason
        // Open the preview
        UI.ListPanel
            .item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton.click();
    });

    it('can cancel from the preview', () => {
        // 2. Cancel Event from preview
        // 2.a Create the Event
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);
        reason = 'Cancelling2 something else';

        // 2.b Open the 'Cancel Event' modal from the preview panel, and cancel the Event
        UI.ListPanel
            .item(0)
            .click();
        menu = Preview.actionMenu;
        cancelEvent();

        // 2.c Open the editor and check cancel label/reason
        // Open the preview
        UI.ListPanel
            .item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton.click();
    });

    it('can cancel from the editor', () => {
        // 3. Cancel from Editor with no unsaved changes
        // 3.a Create the Event
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);
        reason = 'Cancelled three times';
        UI.ListPanel
            .item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 3.b Open the Event in the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        // 3.c Cancel the Event from the Editor
        menu = editor.actionMenu;
        cancelEvent();

        // 3.d Open the preview and editor and check cancel label/reason
        // Open the preview
        UI.ListPanel
            .item(0)
            .click();
        expectCancelledInPreview();

        // Open the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        expectCancelledInEditor();
        editor.closeButton.click();
    });

    it('can cancel from the editor ignoring changes', () => {
        // 4. Cancel from Editor ignoring unsaved changes
        // 4.a Create the Event
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);
        reason = 'Cancelled without changes';
        UI.ListPanel
            .item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 4.b Open the Event in the editor and make changes
        UI.ListPanel
            .item(0)
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
        modal.wait();
        modal.getFooterButton('Cancel')
            .click();
        modal.waitForClose();

        // 4.d Start cancel action, showing ignore/cancel/save dialog
        // And ignore changes
        menu = editor.actionMenu;
        menu.open();
        menu.getAction('Cancel')
            .click();
        modal.wait();
        modal.getFooterButton('Ignore')
            .click();
        modal.waitForClose();

        // 4.e Now cancel the Event
        modal.wait();
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();

        // 4.f Open the preview and editor and check cancel label/reason
        // Open the preview
        UI.ListPanel
            .item(0)
            .click();

        expectCancelledInPreview();

        // Open the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        expectCancelledInEditor();
    });

    it('can cancel from the editor saving changes', () => {
        // 5. Cancel from Editor saving changes
        // 5.a Create the Event
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);
        reason = 'Cancelled savings changes';
        UI.ListPanel
            .item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        // 5.b Open the Event in the editor and make changes
        UI.ListPanel
            .item(0)
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
        modal.wait();
        modal.getFooterButton('Save')
            .click();
        modal.waitForClose();

        // 5.d Now cancel the Event
        modal.wait();
        modal.element
            .find('textarea[name="reason"]')
            .type(reason);
        modal.getFooterButton('Cancel Event')
            .click();

        // 5.e Open the preview and editor and check cancel label/reason
        // Open the preview
        UI.ListPanel
            .item(0)
            .click();

        expectCancelledInPreview();

        // Open the editor
        UI.ListPanel
            .item(0)
            .dblclick();
        expectCancelledInEditor();
    });
});
