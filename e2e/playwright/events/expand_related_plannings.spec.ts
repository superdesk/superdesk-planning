import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad, overrideClientConfig} from '../utils/common';
import {PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {createPlanningFor} from '../utils/fixtures/planning';

const EVENT_ID = 'expanded_event_1';

const VIEWS = [
    {title: 'Events & Planning', filter: 'COMBINED'},
    {title: 'Events only', filter: 'EVENTS'},
];

test.describe('Planning.Events: related plannings expanded by default', () => {
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);

        // The e2e server runs with `PLANNING_EXPAND_RELATED_PLANNINGS` off
        await overrideClientConfig(page, {planning_expand_related_plannings: true});
    });

    for (const view of VIEWS) {
        test(`lists the planning item of an event in the "${view.title}" view`, async ({page}) => {
            // The view is opened from the URL, because switching to it in the app
            // would reuse the planning items that the previous view has already loaded
            await setup(page, 'planning_prepopulate_data', `/#/planning?filter=${view.filter}`);
            await addItems(page.request, 'events', [createEventFor.today({
                guid: EVENT_ID,
                name: 'Event',
                slugline: 'Event',
            })]);
            await addItems(page.request, 'planning', [createPlanningFor.today({
                slugline: 'Planning',
                related_events: [{_id: EVENT_ID, link_type: 'primary'}],
            })]);
            await login(page);
            await waitForPageLoad.planning(page);

            const toggle = list.associatedPlanningToggle(0);
            const plannings = list.nestedPlanningItems(0);

            await expect(toggle).toContainText('Hide 1 planning item');
            await expect(plannings).toHaveCount(1);

            await list.toggleAssociatedPlanning(0);
            await expect(toggle).toContainText('Show 1 planning item');
            await expect(plannings).toHaveCount(0);

            await list.toggleAssociatedPlanning(0);
            await expect(toggle).toContainText('Hide 1 planning item');
            await expect(plannings).toHaveCount(1);
        });
    }
});
