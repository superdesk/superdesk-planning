
import {subNavBar} from '../helpers/subNavBar';
import {editor} from '../helpers/editor';
import {inputToField} from '../helpers/utils';
import {listPanel} from '../helpers/listPanel';

describe('edit_event', () => {
    beforeEach(() => {
        // Open an new event
        subNavBar.createEvent();
    });

    it('save, post and unpost an event', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);

        // Edit the event
        inputToField(editor.fromDateField, '12/12/2045');
        editor.allDayButton.click();
        inputToField(editor.slugField, 'slugline of the event');
        inputToField(editor.nameField, 'name of the event');

        // Create the event
        browser.wait(
            () => editor.createButton.isDisplayed(),
            7500,
            'Timeout while waiting for the Event Create button to be visible'
        );

        editor.createButton.click();
        browser.wait(
            () => listPanel.getItemCount(),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        // Check event created in list panel
        const eventCreated = listPanel.getItemByIndex('Tuesday December 12, 2045', 0);

        expect(eventCreated.getText()).toContain('SLUGLINE OF THE EVENT');
    });

    it('create a recurring event', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);

        // Edit the event
        editor.repeatButton.click();
        browser.wait(
            () => editor.createButton.isDisplayed(),
            7500,
            'Timeout while waiting for the Event Create button to be visible'
        );

        inputToField(editor.fromDateField, '12/12/2045');
        inputToField(editor.untilDateField, '13/12/2045');
        editor.allDayButton.click();
        inputToField(editor.slugField, 'slugline of the recurring event');
        inputToField(editor.nameField, 'name of the recurring event');

        // Create the event
        editor.createButton.click();
        browser.wait(
            () => listPanel.getItemCount(),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
        expect(listPanel.getItemCount()).toBe(2);

        // Check event created in list panel
        const event1Created = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);
        const event2Created = listPanel.getItemInGroupAtIndex('Wednesday December 13, 2045', 0);

        expect(event1Created.getText()).toContain('SLUGLINE OF THE RECURRING EVENT');
        expect(event2Created.getText()).toContain('SLUGLINE OF THE RECURRING EVENT');
    });
});
