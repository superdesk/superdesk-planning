
import {subNavBar} from './helpers/subNavBar';
import {editor} from './helpers/editor';

const listPanel = require('./helpers/listPanel');
const inputToField = require('./helpers/utils').inputToField;

describe('edit_event', () => {
    beforeEach(() => {
        // Open an new event
        subNavBar.createEvent();
    });

    afterEach(() => {
        // Close the editor to unlock
        editor.closeButton.click();
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
        browser.wait(() => editor.createButton.isDisplayed(), 7500);
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount(), 7500);
        browser.sleep(500);

        // Check event created in list panel
        const eventCreated = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);

        expect(eventCreated.getText()).toContain('SLUGLINE OF THE EVENT');

        // Post the event
        editor.postButton.click();
        browser.wait(() => editor.unpostButton.isDisplayed(), 7500);
        expect(editor.isItemPosted()).toBe(true);

        // Unpost the eveent
        editor.unpostButton.click();
        browser.wait(() => editor.postButton.isDisplayed(), 7500);
        expect(editor.isItemUnposted()).toBe(true);
    });

    it('create a recurring event', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);

        // Edit the event
        editor.repeatButton.click();
        browser.wait(() => editor.createButton.isDisplayed(), 7500);

        inputToField(editor.fromDateField, '12/12/2045');
        editor.allDayButton.click();
        inputToField(editor.slugField, 'slugline of the recurring event');
        inputToField(editor.nameField, 'name of the recurring event');
        inputToField(editor.countField, '3');

        // Create the event
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount(), 7500);
        browser.sleep(500);

        expect(listPanel.getItemCount()).toBe(3);

        // Check event created in list panel
        const event1Created = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);
        const event2Created = listPanel.getItemInGroupAtIndex('Wednesday December 13, 2045', 0);
        const event3Created = listPanel.getItemInGroupAtIndex('Thursday December 14, 2045', 0);

        expect(event1Created.getText()).toContain('SLUGLINE OF THE RECURRING EVENT');
        expect(event2Created.getText()).toContain('SLUGLINE OF THE RECURRING EVENT');
        expect(event3Created.getText()).toContain('SLUGLINE OF THE RECURRING EVENT');
    });
});
