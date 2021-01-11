import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {AdvancedSearch} from '../../support/planning';
import {TEST_EVENTS, createEventFor} from '../../fixtures/events';
import {TEST_PLANNINGS, createPlanningFor} from '../../fixtures/planning';

describe('Search.Combined: searching events and planning', () => {
    const search = new AdvancedSearch();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can search events and planning metadata', () => {
        addItems('events', [
            TEST_EVENTS.draft,
            TEST_EVENTS.spiked,
        ]);
        addItems('planning', [
            TEST_PLANNINGS.draft,
            TEST_PLANNINGS.spiked,
        ]);
        search.viewEventsAndPlanning();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        search.runSearchTests([{
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
        }]);
    });

    it('can search events and planning dates', () => {
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
        addItems('planning', [
            createPlanningFor.yesterday({slugline: 'Plan Yesterday'}),
            createPlanningFor.today({slugline: 'Plan Today'}),
            createPlanningFor.tomorrow({slugline: 'Plan Tomorrow'}),
            createPlanningFor.next_week({slugline: 'Plan Next Week'}),
            TEST_PLANNINGS.plan_date_01_02_2045,
            TEST_PLANNINGS.plan_date_02_02_2045,
            TEST_PLANNINGS.plan_date_03_02_2045,
            TEST_PLANNINGS.plan_date_04_02_2045,
        ]);
        search.viewEventsAndPlanning();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();
        search.runSearchTests([{
            params: {},
            expectedCount: 14,
            expectedText: [
                'Event Today',
                'Plan Today',
                'Event Tomorrow',
                'Plan Tomorrow',
                'Event Next Week',
                'Plan Next Week',
                'Event Feb 1',
                'Plan Feb 1',
                'Event Feb 2',
                'Plan Feb 2',
                'Event Feb 3',
                'Plan Feb 3',
                'Event Feb 4',
                'Plan Feb 4',
            ],
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
        }, {
            params: {date_filter: 'Next Week'},
            expectedCount: 2,
            expectedText: [
                'Event Next Week',
                'Plan Next Week',
            ],
            clearAfter: true,
        }]);
    });
});
