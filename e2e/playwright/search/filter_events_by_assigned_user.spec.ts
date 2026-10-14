import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad, baseBackendUrl} from '../utils/common';
import {AdvancedSearch, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

const ASSIGNEE = 'admin1';
const DESK = 'Sports Desk';

async function getIdByField(page: Page, resource: string, field: string, value: string): Promise<string> {
    const response = await page.request.get(`${baseBackendUrl}/${resource}`, {failOnStatusCode: true});
    const items: Array<{[key: string]: string}> = (await response.json())._items;
    const item = items.find((entry) => entry[field] === value);

    if (item == null) {
        throw new Error(`The planning prepopulate profile must include ${resource} "${value}"`);
    }

    return item._id;
}

test.describe('Search.Events: filter by assigned user', () => {
    let search: AdvancedSearch;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
    });

    test('lists only the events with a coverage assigned to the selected user', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        const assignedEvent = createEventFor.today({name: 'Event with assigned coverage', slugline: 'assigned'});

        // The profile generates new user and desk ids on every reset
        await addItems(page.request, 'events', [
            {
                ...assignedEvent,
                coverages: [{
                    workflow_status: 'active',
                    news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
                    planning: {
                        g2_content_type: 'text',
                        slugline: 'assigned',
                        scheduled: assignedEvent.dates.end,
                    },
                    assigned_to: {
                        desk: await getIdByField(page, 'desks', 'name', DESK),
                        user: await getIdByField(page, 'users', 'username', ASSIGNEE),
                    },
                }],
            },
            createEventFor.today({name: 'Event without coverages', slugline: 'unassigned'}),
        ]);

        await search.viewEventsOnly();
        await list.expectItemCount(2);

        await search.filterByAssignedUser(ASSIGNEE);
        await list.expectItemCount(1);
        await list.expectItemText(0, 'Event with assigned coverage');

        await search.clearAssignedUser();
        await list.expectItemCount(2);
    });

    test('hides the filter when the event profile has no coverages field', async ({page}) => {
        await addItems(page.request, 'planning_types', [{
            name: 'event',
            type: 'event',
            editor: {coverages: {enabled: false}},
        }]);
        await login(page);
        await waitForPageLoad.planning(page);

        await search.viewPlanningOnly();
        await expect(search.assignedToFilter).toBeVisible();

        await search.viewEventsOnly();
        await expect(search.assignedToFilter).not.toBeAttached();
    });
});
