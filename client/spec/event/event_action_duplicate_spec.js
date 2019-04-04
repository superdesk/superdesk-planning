import {subNavBar} from '../helpers/subNavBar';
import {listPanel} from '../helpers/listPanel';
import {editor} from '../helpers/editor';
import {preview} from '../helpers/preview';
import {ConfirmationModal} from '../helpers/confirmationModal';
import {waitAndClick} from '../helpers/utils';

it('can duplicate an event', () => {
    let event;
    let expectedValues;
    let listItem;
    let modal;

    event = {
        slugline: 'Original',
        name: 'Test',
        definition_short: 'Desc.',
        dates: {
            start: {date: '12/12/2045', time: '00:00'},
        },
        occur_status: 'eocstat:eos5',
        calendars: ['Sport'],
        anpa_category: ['Finance'],
        subject: ['sports awards'],
        definition_long: 'Desc. Long',
        internal_note: 'Internal',
        ednote: 'Ed. Note',
        files: ['uploads/file1.test'],
        links: ['https://www.google.com.au'],
    };

    expectedValues = Object.assign({}, event, {
        dates: {
            start: {
                date: '12/12/2045',
                time: '00:00',
            },
            end: {
                date: '12/12/2045',
                time: '01:00',
            },
        },
        files: ['file1.test\xA0 (0kB)'],
    });

    const duplicateFromList = () => {
        // 1. Duplicate from list
        browser.sleep(250);
        listItem.actionMenu
            .open()
            .clickAction('Duplicate');

        // Wait till the Editor is open and change the slugline
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);

        // Change the values and test the form values
        editor.inputValues({
            slugline: 'Duplicate',
            dates: {
                start: {time: '01:00'},
                end: {time: '02:00'},
            },
        });

        browser.sleep(250);
        waitAndClick(editor.createButton);
        browser.sleep(250);
        return editor.closeButton.click();
    };

    const cancelDuplicateIgnoringChanges = () => {
        // 2. Cancel duplication, ignoring changes
        browser.sleep(250);
        listItem.actionMenu
            .open()
            .clickAction('Duplicate');

        editor.waitTillOpen(editor.createButton);
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);

        editor.inputValues({slugline: 'Duplicate2'});

        waitAndClick(editor.closeButton);

        ConfirmationModal.wait();
        modal = new ConfirmationModal();
        return modal.ignore.click();
    };

    const cancelDuplicateSavingChanges = () => {
        // 3. Cancel duplication, saving changes
        browser.sleep(250);
        listItem.actionMenu
            .open()
            .clickAction('Duplicate');

        editor.waitTillOpen(editor.createButton);
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);

        editor.inputValues({slugline: 'Duplicate3'});
        browser.sleep(500);
        waitAndClick(editor.closeButton);

        ConfirmationModal.wait();
        browser.sleep(500);
        waitAndClick(modal.cancel);

        editor.inputValues({
            slugline: 'Duplicate4',
            dates: {
                start: {time: '02:00'},
                end: {time: '03:00'},
            },
        });
        waitAndClick(editor.closeButton);

        ConfirmationModal.wait();
        return modal.create.click();
    };

    const duplicateFromPreview = () => {
        // 4. Duplicate from preview panel
        browser.sleep(250);
        listItem.preview();
        preview.actionMenu
            .open()
            .clickAction('Duplicate');

        editor.waitTillOpen(editor.createButton);
        editor.openAllToggleBoxes();
        editor.expectValues(expectedValues);
    };

    // Create the original Event
    browser.sleep(5000);
    subNavBar.createAndSaveEvent(event);
    browser.sleep(500);
    listItem = listPanel.getByIndex(0, 0);
    browser.sleep(500);
    listItem.waitPresent();

    duplicateFromList()
        .then(() => cancelDuplicateIgnoringChanges())
        .then(() => cancelDuplicateSavingChanges())
        .then(() => duplicateFromPreview());
});
