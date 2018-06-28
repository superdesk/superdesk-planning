
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
        browser.wait(
            () => editor.createButton.isDisplayed(),
            7500,
            'Timeout while waiting for the Planning Create button to be visible'
        );

        editor.createButton.click();
        browser.wait(
            () => listPanel.getItemCount(),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        // Check planning created in list panel
        const itemCreated = listPanel.getItemInGroupAtIndex('Tuesday December 12, 2045', 0);

        expect(itemCreated.getText()).toContain('SLUGLINE OF THE PLANNING');
    });

    it('add coverage to workflow', () => {
        let plan = {
            slugline: 'Plan',
            name: 'Namer',
            planning_date: {
                date: '12/12/2045',
                time: '12:13',
            },
            coverages: [{
                news_coverage_status: 'ncostat:int',
                planning: {
                    g2_content_type: 'picture',
                },
                assigned_to: {
                    desk: 'Politic Desk',
                },
            }],
        };


        subNavBar.createPlanning();

        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);

        editor.openAllToggleBoxes();
        editor.inputValues(plan);
        editor.expectValues(plan);

        // Create the item
        editor.createButton.click();
        browser.wait(
            () => listPanel.getItemCount(),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );
        editor.addCoverageToWorkflow(0, plan);

        browser.sleep(1500);
        editor.openAllToggleBoxes();
        editor.expectValues(plan);
        expect(editor.saveButton.getAttribute('class')).toMatch('btn--disabled');
        expect(editor.closeButton.isEnabled()).toBe(true);
    });
});
