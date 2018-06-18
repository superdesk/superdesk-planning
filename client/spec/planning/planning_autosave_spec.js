import {subNavBar} from '../helpers/subNavBar';
import {editor} from '../helpers/editor';
import {listPanel} from '../helpers/listPanel';
import {workqueue} from '../helpers/workqueue';

import {nav} from 'superdesk-core/spec/helpers/utils';

describe('planning_autosave', () => {
    let plan;

    beforeEach(() => {
        plan = {
            slugline: 'Plan',
            name: 'Namer',
            planning_date: {
                date: '12/12/2045',
                time: '12:13',
            },
            description_text: 'Desc. Text',
            internal_note: 'Int. Note',

            ednote: 'Ed. Note',
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],
            urgency: '2',
            'flags.marked_for_not_publication': true,
            coverages: [{
                news_coverage_status: 'ncostat:notdec',
                planning: {
                    g2_content_type: 'picture',
                    slugline: 'Cov. Slug',
                    ednote: 'Note Ed.',
                    internal_note: 'Note Int.',
                    scheduled: {
                        date: '13/12/2045',
                        time: '15:45',
                    },
                },
            }],
        };
    });

    it('creating a new Plan', () => {
        subNavBar.createPlanning();

        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);
        expect(workqueue.getItemCount()).toBe(1);
        expect(workqueue.getItemTitles()).toEqual(['Untitled*']);

        const item1 = workqueue.getItem(0);

        editor.openAllToggleBoxes();
        editor.inputValues(plan);
        editor.expectValues(plan);

        // Wait for the Autosave to save the item
        // Which will then update the Workqueue item title
        browser.wait(() => item1.isTitle('Plan*'));

        // Minimize then open the item
        editor.minimizeButton.click();
        item1.openItem();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);
        editor.expectValues(plan);

        // Navigate to Workspace, then back to Planning
        nav('/workspace');
        nav('/planning');

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);
        editor.expectValues(plan);

        // Refresh the page while the Event is open in the Editor
        browser.navigate().refresh();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);
        editor.expectValues(plan);

        // Now minimize the item and reload the page (so the editor is not open when the page opens)
        editor.minimizeButton.click();
        browser.navigate().refresh();
        item1.openItem();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.planningType.count()).toBe(1);
        editor.expectValues(plan);

        // Now save the Planning item
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount());
    });
});
