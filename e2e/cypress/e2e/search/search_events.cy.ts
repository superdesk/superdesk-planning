import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {AdvancedSearch, PlanningList, EventEditor} from '../../support/planning';
import {TEST_EVENTS, createEventFor, LOCATIONS} from '../../fixtures/events';

describe('Search.Events: searching events', () => {
    const search = new AdvancedSearch();
    const list = new PlanningList();
    const editor = new EventEditor();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can search event metadata', () => {
        addItems('locations', [
            LOCATIONS.sydney_opera_house,
            LOCATIONS.woy_woy_train_station,
        ]);
        addItems('events', [
            TEST_EVENTS.draft,
            TEST_EVENTS.spiked,
        ]);
        search.viewEventsOnly();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        search.runSearchTests([{
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
        }]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        search.runSearchTests([{
            params: {lock_state: 'Locked'},
            expectedCount: 1,
            clearAfter: true,
        }, {
            params: {lock_state: 'Not Locked'},
            expectedCount: 0,
            clearAfter: true,
        }]);
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();
        search.runSearchTests([{
            params: {lock_state: 'Locked'},
            expectedCount: 0,
            clearAfter: true,
        }, {
            params: {lock_state: 'Not Locked'},
            expectedCount: 1,
            clearAfter: true,
        }]);
    });

    it('can search event dates', () => {
        addItems('events', [
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
        ]);
        search.viewEventsOnly();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        search.runSearchTests([{
            params: {},
            expectedCount: 7,
            expectedText: [
                'Event Today',
                'Event Tomorrow',
                'Event Next Week',
                'Event Feb 1',
                'Event Feb 2',
                'Event Feb 3',
                'Event Feb 4',
            ]
        }, {
            params: {
                'start_date.date': '12/12/2025',
                'end_date.date': '12/12/2025',
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
        }, {
            params: {date_filter: 'Next Week'},
            expectedCount: 1,
            expectedText: ['Event Next Week'],
            clearAfter: true,
        }]);
    });
});
