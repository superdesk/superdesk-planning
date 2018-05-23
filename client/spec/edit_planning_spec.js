
import {createPlanning} from './helpers/subNavBar';

const editor = require('./helpers/editor');
const listPanel = require('./helpers/listPanel');
const inputToField = require('./helpers/utils').inputToField;

describe('edit_planning', () => {
    beforeEach(() => {
        // Open an new planning
        createPlanning();
    });

    afterEach(() => {
        // Close the editor to unlock
        editor.closeButton.click();
    });

    it('save, post and unpost a planning item', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);

        // Edit the planning
        inputToField(editor.slugField, 'slugline of  the planing');
        inputToField(editor.planningDate, '12/12/2045');

        // Create the planning
        browser.wait(() => editor.createButton.isDisplayed(), 7500);
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount(), 7500);
        browser.sleep(500);

        // Check planning created in list panel
        const itemCreated = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);

        expect(itemCreated.getText()).toContain('SLUGLINE OF THE PLANNING');

        // Post the planning
        editor.postButton.click();
        browser.wait(() => editor.unpostButton.isDisplayed(), 7500);
        expect(editor.isItemPosted()).toBe(true);

        // Unpost the planning
        editor.unpostButton.click();
        browser.wait(() => editor.postButton.isDisplayed(), 7500);
        expect(editor.isItemUnposted()).toBe(true);
    });
});
