import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

const COVERAGE_FILTERS = ['no_coverage', 'g2_content_type', 'coverage_assignment_status'];

function eventWithCoverage(name: string, contentType: string) {
    const event = createEventFor.today({name: name, slugline: name});

    return {
        ...event,
        coverages: [{
            workflow_status: 'draft',
            news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
            planning: {
                g2_content_type: contentType,
                slugline: name,
                scheduled: event.dates.end,
            },
        }],
    };
}

test.describe('Search.Events: filter by coverages', () => {
    let search: AdvancedSearch;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
    });

    test('filters events by coverage type and without coverage', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        await addItems(page.request, 'events', [
            eventWithCoverage('Event with text coverage', 'text'),
            eventWithCoverage('Event with picture coverage', 'picture'),
            createEventFor.today({name: 'Event without coverages', slugline: 'none'}),
        ]);

        await search.viewEventsOnly();
        await list.expectItemCount(3);

        await search.openSearchPanel();

        for (const name of COVERAGE_FILTERS) {
            await expect(search.field(name)).toBeVisible();
        }

        await search.searchFor({g2_content_type: 'Text'});
        await list.expectItemCount(1);
        await list.expectItemText(0, 'Event with text coverage');

        await search.searchFor({g2_content_type: '', no_coverage: true});
        await expect(search.field('g2_content_type')).not.toBeAttached();
        await list.expectItemCount(1);
        await list.expectItemText(0, 'Event without coverages');
    });

    test('hides the filters in Events only when the event profile has no coverages field', async ({page}) => {
        await addItems(page.request, 'planning_types', [{
            name: 'event',
            type: 'event',
            editor: {coverages: {enabled: false}},
        }]);
        await login(page);
        await waitForPageLoad.planning(page);

        await search.viewEventsOnly();
        await search.openSearchPanel();

        // Make sure the Events group is open, so the checks below are not trivially true
        await expect(search.field('no_calendar_assigned')).toBeVisible();

        for (const name of COVERAGE_FILTERS) {
            await expect(search.field(name)).not.toBeAttached();
        }

        await search.toggleSearchPanel();
        await search.viewEventsAndPlanning();
        await search.openSearchPanel();

        for (const name of COVERAGE_FILTERS) {
            await expect(search.field(name)).toBeVisible();
        }
    });
});
