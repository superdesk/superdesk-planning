
import {createEvent} from './helpers/subNavBar';

const editor = require('./helpers/editor');
const listPanel = require('./helpers/listPanel');
const inputToField = require('./helpers/utils').inputToField;

describe('edit_event', () => {
    beforeEach(() => {
        // Open an new event
        createEvent();
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
        inputToField(editor.slugField, 'slugline of  the event');
        inputToField(editor.nameField, 'name of  the event');
        inputToField(editor.fromDateField, '12/12/2045');
        inputToField(editor.toDateField, '00:58');

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
        const postState = element.all(by.className('label--success')).first();

        expect(postState.getText()).toBe('SCHEDULED');

        // Unpost the eveent
        editor.unpostButton.click();
        browser.wait(() => editor.postButton.isDisplayed(), 7500);
        const unpostState = element.all(by.className('label--warning')).first();

        expect(unpostState.getText()).toBe('KILLED');
    });

    it('create a recurring event', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);

        // Edit the event
        editor.repeatButton.click();
        browser.wait(() => editor.createButton.isDisplayed(), 7500);

        inputToField(editor.slugField, 'slugline of  the event');
        inputToField(editor.nameField, 'name of  the event');
        inputToField(editor.fromDateField, '12/12/2045');
        inputToField(editor.toDateField, '00:58');
        inputToField(editor.countField, '3');

        // Create the event
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount(), 7500);
        browser.sleep(500);
    });
});
