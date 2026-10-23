import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {createPlanningFor} from '../utils/fixtures/planning';

const COVERAGE = {
    workflow_status: 'draft',
    news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
    planning: {g2_content_type: 'text'},
};

function eventWithCoverage(name: string) {
    const event = createEventFor.today({name: name, slugline: name});

    return {
        ...event,
        coverages: [{
            ...COVERAGE,
            planning: {...COVERAGE.planning, slugline: name, scheduled: event.dates.end},
        }],
    };
}

// Field names in the order they are rendered in the search panel
function fieldOrder(search: AdvancedSearch): Promise<Array<string>> {
    return search.getParent().locator('[data-test-id^="field-"]').evaluateAll((elements) => (
        elements.map((element) => (element.getAttribute('data-test-id') ?? '').replace('field-', ''))
    ));
}

test.describe('Search: With Coverages only filter', () => {
    let search: AdvancedSearch;
    let list: PlanningList;

    async function expectItems(names: Array<string>) {
        await list.expectItemCount(names.length);

        for (const name of names) {
            await expect(list.items().filter({hasText: name})).toHaveCount(1);
        }
    }

    async function expectRightBelowWithoutCoverage() {
        const fields = await fieldOrder(search);

        expect(fields.indexOf('with_coverage')).toBe(fields.indexOf('no_coverage') + 1);
    }

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
    });

    test('Events only shows only events with coverages', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        await addItems(page.request, 'events', [
            eventWithCoverage('Event with coverage'),
            createEventFor.today({name: 'Event without coverages', slugline: 'none'}),
        ]);

        await search.viewEventsOnly();
        await list.expectItemCount(2);

        await search.openSearchPanel();
        await expect(search.field('with_coverage')).toBeVisible();
        await expectRightBelowWithoutCoverage();

        await search.searchFor({with_coverage: true});
        await expect(search.field('g2_content_type')).toBeVisible();
        await expectItems(['Event with coverage']);

        // Turning on "Without Coverage" turns "With Coverages only" off
        await search.searchFor({no_coverage: true});
        await search.fields.with_coverage.expect(false);
        await expectItems(['Event without coverages']);

        // And the other way around
        await search.searchFor({with_coverage: true});
        await search.fields.no_coverage.expect(false);
        await expectItems(['Event with coverage']);
    });

    test('Planning only shows only planning items with coverages', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        await addItems(page.request, 'planning', [
            createPlanningFor.today({slugline: 'Planning with coverage', coverages: [COVERAGE]}),
            createPlanningFor.today({slugline: 'Planning without coverages'}),
        ]);

        await search.viewPlanningOnly();
        await list.expectItemCount(2);

        await search.openSearchPanel();
        await expectRightBelowWithoutCoverage();

        await search.searchFor({with_coverage: true});
        await expectItems(['Planning with coverage']);
    });

    test('Events & Planning shows only items with coverages', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        await addItems(page.request, 'events', [
            eventWithCoverage('Event with coverage'),
            createEventFor.today({name: 'Event without coverages', slugline: 'none'}),
        ]);
        await addItems(page.request, 'planning', [
            createPlanningFor.today({slugline: 'Planning with coverage', coverages: [COVERAGE]}),
            createPlanningFor.today({slugline: 'Planning without coverages'}),
        ]);

        await search.viewEventsAndPlanning();
        await list.expectItemCount(4);

        await search.openSearchPanel();
        await expectRightBelowWithoutCoverage();

        await search.searchFor({with_coverage: true});
        await expectItems(['Event with coverage', 'Planning with coverage']);
    });

    test('hides the filter in Events only when the event profile has no coverages field', async ({page}) => {
        await addItems(page.request, 'planning_types', [{
            name: 'event',
            type: 'event',
            editor: {coverages: {enabled: false}},
        }]);
        await login(page);
        await waitForPageLoad.planning(page);

        await search.viewEventsOnly();
        await search.openSearchPanel();

        // Make sure the Events group is open, so the check below is not trivially true
        await expect(search.field('no_calendar_assigned')).toBeVisible();
        await expect(search.field('with_coverage')).not.toBeAttached();
    });
});
