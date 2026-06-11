import {test} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList, PlanningEditor} from '../page-object-models/planning';

import {TEST_PLANNINGS, createPlanningFor} from '../utils/fixtures/planning';
import {ADVANCED_SEARCH} from '../utils/fixtures/planning_types';
import {CVs} from '../utils/fixtures/cvs';

test.describe('Search.Planning: searching planning items', () => {
    let search: AdvancedSearch;
    let list: PlanningList;
    let editor: PlanningEditor;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);
        editor = new PlanningEditor(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can search planning metadata', async ({page}) => {
        await addItems(
            page.request,
            'planning',
            [
                TEST_PLANNINGS.draft,
                TEST_PLANNINGS.spiked,
                TEST_PLANNINGS.featured,
            ]
        );
        await addItems(page.request, 'vocabularies', [CVs.EVENT_TYPES]);
        await addItems(page.request, 'planning_types', [ADVANCED_SEARCH]);

        await page.reload(); // when adding vocabularies, the page needs to be reloaded to reflect the changes

        await search.viewPlanningOnly();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        // custom CVs
        await search.runSearchTests([
            {
                params: {event_types: 'Foo'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {event_types: 'Bar'},
                expectedCount: 0,
                clearAfter: true,
            },
        ]);

        // text fields
        await search.runSearchTests([
            {
                params: {description_text: 'description text'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {description_text: 'non-existing text'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {name: 'name'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {name: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {ednote: 'editorial note'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {ednote: 'non-existing note'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {headline: 'planning headline'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {headline: 'non-existing headline'},
                expectedCount: 0,
                clearAfter: true,
            },
        ]);

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 2,
                expectedText: [
                    'Original',
                    'Featured Planning',
                ]
            }, {
                params: {slugline: 'Originality'},
                expectedCount: 0,
            }, {
                params: {slugline: 'Original'},
                expectedCount: 1,
            }, {
                params: {
                    slugline: '',
                    anpa_category: ['Domestic Sport'],
                },
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {anpa_category: ['Overseas Sport']},
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {subject: ['archaeology', 'music']},
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {state: ['Draft']},
                expectedCount: 2,
                clearAfter: true,
            }, {
                params: {state: ['Cancelled']},
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {spike_state: true},
                expectedCount: 3,
                clearAfter: true,
            }, {
                params: {featured: true},
                expectedCount: 1,
                expectedText: ['Featured Planning'],
                clearAfter: true,
            }
        ]);

        await list.item(0).dblclick();
        await list.items().locator('.sd-list-item__border--locked').waitFor({state: 'visible'});
        await search.runSearchTests([
                {
                params: {lock_state: 'Locked'},
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {lock_state: 'Not Locked'},
                expectedCount: 1,
                clearAfter: true,
            }
        ]);
        await editor.closeButton.click();
        await editor.waitTillClosed();
        await search.runSearchTests([
            {
                params: {lock_state: 'Locked'},
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {lock_state: 'Not Locked'},
                expectedCount: 2,
                clearAfter: true,
            }
        ]);
    });

    test('can search planning dates', async ({page}) => {
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
        await search.viewPlanningOnly();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        await list.setDateInterval('Month');

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 3,
                expectedText: [
                    'Plan Today',
                    'Plan Tomorrow',
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
                expectedCount: 2,
                expectedText: [
                    'Plan Feb 2',
                    'Plan Feb 3',
                ],
                clearAfter: true,
            }, {
                params: {date_filter: 'Today'},
                expectedCount: 1,
                expectedText: ['Plan Today'],
                clearAfter: true,
            }, {
                params: {date_filter: 'Tomorrow'},
                expectedCount: 1,
                expectedText: ['Plan Tomorrow'],
                clearAfter: true,
            },
                // tomorrow can be next week too, needs fixing
                // {
                //     params: {date_filter: 'Next Week'},
                //     expectedCount: 1,
                //     expectedText: ['Plan Next Week'],
                //     clearAfter: true,
                // },
            ]
        );
    });
});
