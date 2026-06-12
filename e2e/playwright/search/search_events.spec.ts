import {test} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList, EventEditor} from '../page-object-models/planning';

import {TEST_EVENTS, createEventFor, LOCATIONS} from '../utils/fixtures/events';
import {ADVANCED_SEARCH} from '../utils/fixtures/planning_types';
import {CVs} from '../utils/fixtures/cvs';

test.describe('Search.Events: searching events', () => {
    let search: AdvancedSearch;
    let list: PlanningList;
    let editor: EventEditor;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);
        list = new PlanningList(page);
        editor = new EventEditor(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can search event metadata', async ({page}) => {
        await addItems(
            page.request,
            'locations',
            [LOCATIONS.sydney_opera_house, LOCATIONS.woy_woy_train_station]
        );
        await addItems(
            page.request,
            'events',
            [TEST_EVENTS.draft, TEST_EVENTS.spiked]
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

        await search.viewEventsOnly();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        // Default items without search
        await list.expectItemCount(1);
        await list.expectItemText(0, 'Original');

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
            }
        ]);

        // events text fields
        await search.runSearchTests([
            {
                params: {reference: 'REF-1234'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {reference: 'REF-non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {definition_short: 'short description'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {definition_short: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {definition_long: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {definition_long: 'long description'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {registration_details: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {registration_details: 'registration details'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {invitation_details: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {invitation_details: 'invitation details'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {accreditation_info: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {accreditation_info: 'accreditation info'},
                expectedCount: 1,
                clearAfter: true,
            },
            {
                params: {registration: 'non-existing'},
                expectedCount: 0,
                clearAfter: true,
            },
            {
                params: {registration: 'registration'},
                expectedCount: 1,
                clearAfter: true,
            },
        ]);

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 1,
                expectedText: ['Original'],
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
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {state: ['Cancelled']},
                expectedCount: 0,
                clearAfter: true,
            }, {
                params: {spike_state: true},
                expectedCount: 2,
                clearAfter: true,
            }, {
                params: {no_calendar_assigned: true},
                expectedCount: 0,
            }, {
                params: {no_calendar_assigned: false},
                expectedCount: 1
            }, {
                params: {location: LOCATIONS.sydney_opera_house.name},
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {location: LOCATIONS.woy_woy_train_station.name},
                expectedCount: 0,
                clearAfter: true,
            }
        ]);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await search.runSearchTests([
            {
                params: {lock_state: 'Locked'},
                expectedCount: 1,
                clearAfter: true,
            }, {
                params: {lock_state: 'Not Locked'},
                expectedCount: 0,
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
                expectedCount: 1,
                clearAfter: true,
            }
        ]);
    });

    test('can search event dates', async ({page}) => {
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
        await search.viewEventsOnly();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();

        await list.setDateInterval('Month');

        await search.runSearchTests([
            {
                params: {},
                expectedCount: 3,
                expectedText: [
                    'Event Today',
                    'Event Tomorrow',
                    'Event Next Week',
                ]
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
                    'end_date.date': '03/02/2045'
                },
                expectedCount: 2,
                expectedText: [
                    'Event Feb 2',
                    'Event Feb 3',
                ],
                clearAfter: true,
            }, {
                params: {date_filter: 'Today'},
                expectedCount: 1,
                expectedText: ['Event Today'],
                clearAfter: true,
            }, {
                params: {date_filter: 'Tomorrow'},
                expectedCount: 1,
                expectedText: ['Event Tomorrow'],
                clearAfter: true,
            },
                // tomorrow can be next week too, needs fixing
                // {
                //     params: {date_filter: 'Next Week'},
                //     expectedCount: 1,
                //     expectedText: ['Event Next Week'],
                //     clearAfter: true,
                // },
        ]);
    });
});
