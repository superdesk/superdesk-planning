import {subNavBar} from '../helpers/subNavBar';
import {listPanel} from '../helpers/listPanel';
import {editor} from '../helpers/editor';
import {preview} from '../helpers/preview';
import {ConfirmationModal} from '../helpers/confirmationModal';
import {waitAndClick} from '../helpers/utils';


it('can create Planning items from an event', () => {
    let event;
    let expectedValues;
    let modal;
    let eventItem;

    event = {
        slugline: 'Original',
        name: 'Test',
        definition_short: 'Desc.',
        dates: {start: {date: '12/12/2045', time: '00:00'}},
        anpa_category: ['Finance'],
        subject: ['sports awards'],
        ednote: 'Ed. Note',
    };

    expectedValues = {
        slugline: 'Original',
        planning_date: {date: '12/12/2045', time: '00:00'},
        name: 'Test',
        subject: ['sports awards'],
        anpa_category: ['Finance'],
        description_text: 'Desc.',
        ednote: 'Ed. Note',
        agendas: [],
    };

    subNavBar.createAndSaveEvent(event);

    eventItem = listPanel.getByIndex(0, 0);
    browser.sleep(500);
    eventItem.waitPresent();

    const createFromList = () => {
        browser.sleep(250);
        // 1.a Create Planning from list
        eventItem.actionMenu
            .open()
            .clickAction('Create Planning Item');

        expect(eventItem.element.getText()).toContain('(1) Show planning item(s)');
        eventItem.toggleAssociated();
        expect(eventItem.element.getText()).toContain('(1) Hide planning item(s)');

        // 1.b Change slugline and date
        eventItem.getAssociatedItem('Original')
            .actionMenu
            .open()
            .clickAction('Edit');

        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan1',
            planning_date: {time: '01:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createAndOpenFromList = () => {
        browser.sleep(500);
        // 2.a Create and Open Planning from list
        eventItem.actionMenu
            .open()
            .clickAction('Create and Open Planning Item');

        editor.waitTillOpen(editor.saveButton);
        expect(eventItem.element.getText()).toContain('(2) Hide planning item(s)');

        // 2.b Change slugline and date
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan2',
            planning_date: {time: '02:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createFromPreview = () => {
        browser.sleep(250);
        // 3.a Create Planning Item from preview
        eventItem.preview();
        preview.actionMenu
            .open()
            .clickAction('Create Planning Item');
        preview.closeButton.click();
        expect(eventItem.element.getText()).toContain('(3) Hide planning item(s)');

        // 3.b Change slugline and date
        eventItem.getAssociatedItem('Original')
            .actionMenu
            .open()
            .clickAction('Edit');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan3',
            planning_date: {time: '03:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createAndOpenFromPreview = () => {
        browser.sleep(250);
        // 4.a Create and Open Planning Item from preview
        eventItem.preview();
        preview.actionMenu
            .open()
            .clickAction('Create and Open Planning Item');
        preview.closeButton.click();
        expect(eventItem.element.getText()).toContain('(4) Hide planning item(s)');

        // 4.b change slugline and date
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan4',
            planning_date: {time: '04:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createFromEditor = () => {
        browser.sleep(250);
        // 5.a Create Planning Item while Event Editor is open
        eventItem.edit();
        editor.actionMenu
            .open()
            .clickAction('Create Planning Item');
        expect(eventItem.element.getText()).toContain('(5) Hide planning item(s)');
        editor.closeButton.click();

        // 5.b Change slugline and date
        eventItem.getAssociatedItem('Original')
            .actionMenu
            .open()
            .clickAction('Edit');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan5',
            planning_date: {time: '05:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createFromEditorIgnoringChanges = () => {
        browser.sleep(250);
        // 6.a Create and Open Planning item while Event Editor is open and dirty
        // Ignoring changes
        eventItem.edit();
        editor.inputValues({slugline: 'Changed'});
        editor.actionMenu
            .open()
            .clickAction('Create and Open Planning Item');

        // 6.b Ignore changes to Event
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.ignore.click();
        ConfirmationModal.waitForClose();
        expect(eventItem.element.getText()).toContain('(6) Hide planning item(s)');

        // 6.c Change slugline and date
        editor.waitTillOpen(editor.planningType);
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
        editor.inputValues({
            slugline: 'Plan6',
            planning_date: {time: '06:00'},
        });
        waitAndClick(editor.saveButton);
        return editor.closeButton.click();
    };

    const createFromEditorSavingChanges = () => {
        browser.sleep(250);
        // 7.a Create and Open Planning item while Event Editor is open and dirty
        // Cancel modal, then saving changes to the Event
        eventItem.edit();
        editor.inputValues({slugline: 'Changed2'});
        editor.actionMenu
            .open()
            .clickAction('Create and Open Planning Item');

        // 7.b Cancel confirmation modal
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.cancel.click();
        ConfirmationModal.waitForClose();

        // 7.c Save changes to Event
        editor.actionMenu
            .open()
            .clickAction('Create and Open Planning Item');
        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        modal.save.click();
        ConfirmationModal.waitForClose();
        expect(eventItem.element.getText()).toContain('(7) Hide planning item(s)');

        // 7.c Change slugline and date
        editor.waitTillOpen(editor.planningType);
        editor.openAllToggleBoxes();
        expectedValues.slugline = 'Changed2';
        editor.expectValues(expectedValues);
    };

    createFromList()
        .then(() => createAndOpenFromList())
        .then(() => createFromPreview())
        .then(() => createAndOpenFromPreview())
        .then(() => createFromEditor())
        .then(() => createFromEditorIgnoringChanges())
        .then(() => createFromEditorSavingChanges());
});
