import {test, expect} from '@playwright/test';

import {setup, addItems, login, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList, PlanningPreview} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

const NAME = 'Add to workflow from event list';

function eventWithDraftCoverage() {
    const event = createEventFor.today({name: NAME, slugline: NAME});

    return {
        ...event,
        coverages: [{
            workflow_status: 'draft',
            news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
            planning: {
                g2_content_type: 'text',
                language: 'en',
                slugline: NAME,
                scheduled: event.dates.end,
            },
        }],
    };
}

test.describe('Planning.Events: bulk add to workflow from the event list', () => {
    let list: PlanningList;
    let preview: PlanningPreview;
    let search: AdvancedSearch;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        preview = new PlanningPreview(page);
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [eventWithDraftCoverage()]);
    });

    test('adds the coverages of the selected events to workflow', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);
        await search.viewEventsOnly();
        await list.expectItemCount(1);
        await expect(list.item(0)).toContainText(NAME);

        await list.selectItem(0);

        const actions = await list.selectionToolbar.getByRole('button').evaluateAll(
            (buttons) => buttons.map((button) => button.getAttribute('aria-label'))
        );

        expect(actions.indexOf('Add to workflow')).toBeGreaterThan(-1);
        expect(actions.indexOf('Add to workflow')).toBeLessThan(actions.indexOf('Export'));

        await list.addToWorkflow('events');
        await expect(list.selectionToolbar).not.toBeVisible();

        await page.reload();
        await waitForPageLoad.planning(page);
        await list.item(0).click();
        await preview.waitTillOpen();

        await expect(preview.coverageCards).toHaveCount(1);
        await expect(preview.coverageCard(0)).toContainText('Added to workflow');
    });
});
