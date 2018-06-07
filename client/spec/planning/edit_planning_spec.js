
import {subNavBar} from '../helpers/subNavBar';
import {editor} from '../helpers/editor';
import {inputToField} from '../helpers/utils';
import {listPanel} from '../helpers/listPanel';

describe('edit_planning', () => {
    beforeEach(() => {
        // Open an new planning
        subNavBar.createPlanning();
    });

    it('save, post and unpost a planning item', () => {
        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);

        // Edit the planning
        inputToField(editor.slugField, 'slugline of  the planning');
        inputToField(editor.planningDate, '12/12/2045');

        // Create the planning
        browser.wait(() => editor.createButton.isDisplayed(), 7500);
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount());

        // Check planning created in list panel
        const itemCreated = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);

        expect(itemCreated.getText()).toContain('SLUGLINE OF THE PLANNING');
    });
});
