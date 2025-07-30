import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {AdvancedSearch, PlanningList, PlanningEditor} from '../../support/planning';
import {TEST_PLANNINGS, createPlanningFor} from '../../fixtures/planning';
import {ADVANCED_SEARCH} from '../../fixtures/planning_types';
import {CVs} from '../../fixtures/cvs';

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
        addItems('vocabularies', [
            CVs.EVENT_TYPES,
        ]);
        addItems('planning_types', [
            ADVANCED_SEARCH,
        ]);

        cy.reload(); // when adding vocabularies, the page needs to be reloaded to reflect the changes

        search.viewPlanningOnly();
        search.toggleSearchPanel();
        search.openAllToggleBoxes();

        // custom CVs
        search.runSearchTests([
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
        search.runSearchTests([
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

        list.setDateInterval('Month');

        search.runSearchTests([{
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
        ]);
    });
});
