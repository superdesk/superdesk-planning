import {subNavBar} from '../helpers/subNavBar';
import {listPanel} from '../helpers/listPanel';
import {ConfirmationModal} from '../helpers/confirmationModal';
import {Input} from '../helpers/form';
import {editor} from '../helpers/editor';
import {preview} from '../helpers/preview';
import {waitPresent} from '../helpers/utils';


it('can cancel an event', () => {
    let event;
    let eventItem;
    let modal;
    let input;
    let reason;

    event = {
        slugline: 'Original',
        name: 'Test',
        dates: {
            start: {date: '12/12/2045', time: '00:00'},
        },
    };

    const cancelEvent = (parent, reason) => {
        parent.actionMenu
            .open()
            .clickAction('Cancel');

        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        input = new Input(modal.element, 'reason', 'textarea', false);
        input.setValue(reason);
        modal.ok.click();

        return waitPresent(eventItem.element.all(by.className('label--yellow2')));
    };

    const expectCancelledInPreview = (reason) => (
        preview.waitTillOpen()
            .then(() => {
                expect(
                    eventItem.element.element(by.className('label--yellow2')).getText()
                ).toBe('CANCELLED');

                expect(
                    preview.element.element(by.className('label--yellow2')).getText()
                ).toBe('CANCELLED');
                expect(
                    preview.element
                        .element(by.className('internal-note__label'))
                        .element(by.xpath('..'))
                        .getText()
                ).toContain(reason);
            })
    );

    const expectCancelledInEditor = (reason) => {
        editor.waitTillOpen();
        expect(
            editor.editor
                .element(by.className('internal-note__label'))
                .element(by.xpath('..'))
                .getText()
        ).toContain(reason);
    };

    const cancelFromList = () => {
        browser.sleep(250);
        // 1. Cancel Event from list
        // 1.a Create the Event
        reason = 'Cancelled due to some reason';
        subNavBar.createAndSaveEvent(event, false);
        eventItem = listPanel.getByIndex(0, 0);
        eventItem.waitPresent();

        // 1.b Open the 'Cancel Event' modal, then close it
        eventItem.actionMenu
            .open()
            .clickAction('Cancel');
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.cancel.click();

        // 1.c Open the 'Cancel Event' modal again, and cancel the Event
        cancelEvent(eventItem, reason);

        // 1.d Open the preview/editor and check cancel label/reason
        eventItem.preview();
        expectCancelledInPreview(reason);
        preview.closeButton.click();

        eventItem.edit(editor.closeButton);
        expectCancelledInEditor(reason);
        return editor.closeButton.click();
    };

    const cancelFromPreview = () => {
        browser.sleep(250);
        // 2. Cancel Event from preview
        // 2.a Create the Event
        reason = 'Cancelling2 something else';
        event.dates.start.time = '01:00';
        subNavBar.createAndSaveEvent(event, false);
        eventItem = listPanel.getByIndex(0, 1);
        eventItem.waitPresent();

        // 2.b Open the 'Cancel Event' modal from the preview panel, and cancel the Event
        eventItem.preview();
        cancelEvent(preview, reason);

        // 2.c Open the editor and check cancel label/reason
        // await preview.waitTillOpen();
        expectCancelledInPreview(reason);
        preview.closeButton.click();

        eventItem.edit(editor.closeButton);
        expectCancelledInEditor(reason);
        return editor.closeButton.click();
    };

    const cancelFromEditor = () => {
        browser.sleep(250);
        // 3. Cancel from Editor with no unsaved changes
        // 3.a Create the Event
        reason = 'Cancelled three times';
        event.dates.start.time = '02:00';
        subNavBar.createAndSaveEvent(event, false);
        eventItem = listPanel.getByIndex(0, 2);
        eventItem.waitPresent();

        // 3.b Open the Event in the editor
        eventItem.edit();
        editor.waitTillOpen();

        // 3.c Cancel the Event from the Editor
        cancelEvent(editor, reason);

        // 3.d Open the preview and editor and check cancel label/reason
        expectCancelledInEditor(reason);
        editor.closeButton.click();
        editor.waitTillClose();

        eventItem.preview();
        expectCancelledInPreview(reason);
        return preview.closeButton.click();
    };

    const cancelFromEditorIgnoringChanges = () => {
        browser.sleep(250);
        // 4. Cancel from Editor ignoring unsaved changes
        // 4.a Create the Event
        reason = 'Cancelled without changes';
        event.dates.start.time = '03:00';
        subNavBar.createAndSaveEvent(event, false);
        eventItem = listPanel.getByIndex(0, 3);
        eventItem.waitPresent();

        // 4.b Open the Event in the editor and make changes
        eventItem.edit();
        editor.inputValues({slugline: 'Changed2'});

        // 4.c Start cancel action, showing ignore/cancel/save dialog
        // And cancel
        editor.actionMenu
            .open()
            .clickAction('Cancel');
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.cancel.click();
        ConfirmationModal.waitForClose();

        // 4.d Start cancel action, showing ignore/cancel/save dialog
        // And ignore changes
        editor.actionMenu
            .open()
            .clickAction('Cancel');
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.ignore.click();
        ConfirmationModal.waitForClose();

        // 4.e Now cancel the Event
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        input = new Input(modal.element, 'reason', 'textarea', false);
        input.setValue(reason);
        modal.ok.click();
        ConfirmationModal.waitForClose();

        expectCancelledInEditor(reason);
        editor.closeButton.click();
        editor.waitTillClose();

        // 4.f Open the preview and editor and check cancel label/reason
        eventItem.preview();
        expectCancelledInPreview(reason);
        return preview.closeButton.click();
    };

    const cancelFromEditorSavingChanges = () => {
        browser.sleep(250);
        // 5. Cancel from Editor saving changes
        // 5.a Create the Event
        reason = 'Cancelled savings changes';
        event.dates.start.time = '04:00';
        subNavBar.createAndSaveEvent(event, false);
        eventItem = listPanel.getByIndex(0, 4);
        eventItem.waitPresent();

        // 5.b Open the Event in the editor and make changes
        eventItem.edit();
        editor.inputValues({slugline: 'Changed3'});

        // 5.c Start cancel action, showing ignore/cancel/save dialog
        // saving changes
        editor.actionMenu
            .open()
            .clickAction('Cancel');
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.save.click();
        ConfirmationModal.waitForClose();

        // 5.d Now cancel the Event
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        input = new Input(modal.element, 'reason', 'textarea', false);
        input.setValue(reason);
        modal.ok.click();
        ConfirmationModal.waitForClose();

        // 5.e Open the preview and editor and check cancel label/reason
        expect(eventItem.getText()).toContain('CHANGED3');
        expectCancelledInEditor(reason);
        editor.closeButton.click();
        editor.waitTillClose();

        eventItem.preview();
        expectCancelledInPreview(reason);
    };

    cancelFromList()
        .then(() => cancelFromPreview())
        .then(() => cancelFromEditor())
        .then(() => cancelFromEditorIgnoringChanges())
        .then(() => cancelFromEditorSavingChanges());
});
