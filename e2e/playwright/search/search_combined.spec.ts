import {test} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList} from '../page-object-models/planning';

import {TEST_EVENTS, createEventFor} from '../utils/fixtures/events';
import {TEST_PLANNINGS, createPlanningFor} from '../utils/fixtures/planning';
import {ADVANCED_SEARCH} from '../utils/fixtures/planning_types';
import {CVs} from '../utils/fixtures/cvs';

test.describe('Search.Combined: searching events and planning', () => {
    let search: AdvancedSearch;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can search events and planning metadata', async ({page}) => {
        await addItems(
            page.request,
            'events',
            [TEST_EVENTS.draft, TEST_EVENTS.spiked]
        );
        await addItems(
            page.request,
            'planning',
            [TEST_PLANNINGS.draft, TEST_PLANNINGS.spiked]
        );
        await addItems(
            page.request,
            'vocabularies',
            [CVs.EVENT_TYPES]
        );
        await addItems(
            page.request,
            'planning_types',
            [ADVANCED_SEARCH]
        );

        await page.reload(); // when adding vocabularies, the page needs to be reloaded to reflect the changes

        await search.viewEventsAndPlanning();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        // custom CVs
        await search.runSearchTests([
            {
                params: {event_types: 'Foo'},
                expectedCount: 2,
                clearAfter: true,
            },
            {
                params: {event_types: 'Bar'},
                expectedCount: 0,
                clearAfter: true,
            }
        ]);

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 2,
                expectedText: [
                    'Original',
                    'Original',
                ],
            }, {
                params: {name: 'Testing'},
                expectedCount: 0,
            }, {
                params: {name: 'Test'},
                expectedCount: 1,
            }, {
                params: {
                    name: '',
                    slugline: 'Originality',
                },
                expectedCount: 0,
            }, {
                params: {slugline: 'Original'},
                expectedCount: 2,
            }, {
                params: {
                    slugline: '',
                    anpa_category: ['Domestic Sport'],
                },
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {anpa_category: ['Overseas Sport']},
                expectedCount: 2,
                clearAfter: true,
            }, {
                params: {subject: ['archaeology', 'music']},
                expectedCount: 2,
                clearAfter: true,
            }
        ]);
    });

    test('can search events and planning dates', async ({page}) => {
        await addItems(
            page.request,
            'events',
            [
                createEventFor.yesterday({
                    name: 'Event Yesterday',
                    slugline: 'Event yesterday',
                }),
                createEventFor.today({
                    name: 'Event Today',
                    slugline: 'Event Today',
                }),
                createEventFor.tomorrow({
                    name: 'Event Tomorrow',
                    slugline: 'Event Tomorrow',
                }),
                createEventFor.next_week({
                    name: 'Event Next Week',
                    slugline: 'Event Next Week',
                }),
                TEST_EVENTS.date_01_02_2045,
                TEST_EVENTS.date_02_02_2045,
                TEST_EVENTS.date_03_02_2045,
                TEST_EVENTS.date_04_02_2045,
            ]
        );
        await addItems(
            page.request,
            'planning',
            [
                createPlanningFor.yesterday({slugline: 'Plan Yesterday'}),
                createPlanningFor.today({slugline: 'Plan Today'}),
                createPlanningFor.tomorrow({slugline: 'Plan Tomorrow'}),
                createPlanningFor.next_week({slugline: 'Plan Next Week'}),
                TEST_PLANNINGS.plan_date_01_02_2045,
                TEST_PLANNINGS.plan_date_02_02_2045,
                TEST_PLANNINGS.plan_date_03_02_2045,
                TEST_PLANNINGS.plan_date_04_02_2045,
            ]
        );
        await search.viewEventsAndPlanning();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        await list.setDateInterval('Month');

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 6,
                expectedText: [
                    'Event Today',
                    'Plan Today',
                    'Event Tomorrow',
                    'Plan Tomorrow',
                    'Event Next Week',
                    'Plan Next Week',
                ],
            }, {
                params: {
                    'start_date.date': '12/12/2045',
                    'end_date.date': '12/12/2045',
                },
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {
                    'start_date.date': '02/02/2045',
                    'end_date.date': '03/02/2045',
                },
                expectedCount: 4,
                expectedText: [
                    'Event Feb 2',
                    'Plan Feb 2',
                    'Event Feb 3',
                    'Plan Feb 3',
                ],
                clearAfter: true,
            }, {
                params: {date_filter: 'Today'},
                expectedCount: 2,
                expectedText: [
                    'Event Today',
                    'Plan Today',
                ],
                clearAfter: true,
            }, {
                params: {date_filter: 'Tomorrow'},
                expectedCount: 2,
                expectedText: [
                    'Event Tomorrow',
                    'Plan Tomorrow',
                ],
                clearAfter: true,
            },
                // tomorrow can be next week too, needs fixing
                // {
                //     params: {date_filter: 'Next Week'},
                //     expectedCount: 2,
                //     expectedText: [
                //         'Event Next Week',
                //         'Plan Next Week',
                //     ],
                //     clearAfter: true,
                // },
        ]);
    });
})
