import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {AdvancedSearch, PlanningList, PlanningEditor} from '../../support/planning';
import {TEST_PLANNINGS, createPlanningFor} from '../../fixtures/planning';

describe('Search.Planning: searching planning items', () => {
    const search = new AdvancedSearch();
    const list = new PlanningList();
    const editor = new PlanningEditor();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can search planning metadata', () => {
        addItems('planning', [
            TEST_PLANNINGS.draft,
            TEST_PLANNINGS.spiked,
            TEST_PLANNINGS.featured,
        ]);
        search.viewPlanningOnly();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        search.runSearchTests([{
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
        }]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitForAutosavePost();
        search.runSearchTests([{
            params: {lock_state: 'Locked'},
            expectedCount: 1,
            clearAfter: true,
        }, {
            params: {lock_state: 'Not Locked'},
            expectedCount: 1,
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
            expectedCount: 2,
            clearAfter: true,
        }]);
    });

    it('can search planning dates', () => {
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
        search.viewPlanningOnly();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        search.runSearchTests([{
            params: {},
            expectedCount: 7,
            expectedText: [
                'Plan Today',
                'Plan Tomorrow',
                'Plan Next Week',
                'Plan Feb 1',
                'Plan Feb 2',
                'Plan Feb 3',
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
        }, {
            params: {date_filter: 'Next Week'},
            expectedCount: 1,
            expectedText: ['Plan Next Week'],
            clearAfter: true,
        }]);
    });
});
