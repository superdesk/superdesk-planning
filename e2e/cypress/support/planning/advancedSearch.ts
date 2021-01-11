import {get, isBoolean} from 'lodash';

import {Input, SelectMetaTerms, RadioInputs, SpikeStateInput, ToggleInput} from '../common/inputs';
import {PlanningList} from './planningList';

interface ISearchTest {
    params: {[key: string]: any},
    expectedCount?: number,
    expectedText?: Array<string>,
    clearAfter?: boolean,
}

export class AdvancedSearch {
    fields: {[key: string]: any};
    list: PlanningList;

    constructor() {
        this.fields = {
            name: new Input(() => this.searchPanel, 'input[name="name"]'),
            slugline: new Input(() => this.searchPanel, 'input[name="slugline"]'),
            anpa_category: new SelectMetaTerms(() => this.searchPanel, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(() => this.searchPanel, '[data-test-id=field-subject]'),
            state: new SelectMetaTerms(() => this.searchPanel, '[data-test-id=field-state]'),
            spike_state: new SpikeStateInput(() => this.searchPanel, '[data-test-id=field-spike_state]'),
            start_date: {
                date: new Input(() => this.searchPanel, 'input[name="start_date.date"]'),
                time: new Input(() => this.searchPanel, 'input[name="start_date.time"]'),
            },
            end_date: {
                date: new Input(() => this.searchPanel, 'input[name="end_date.date"]'),
                time: new Input(() => this.searchPanel, 'input[name="end_date.time"]'),
            },
            calendars: new SelectMetaTerms(() => this.searchPanel, '[data-test-id=field-calendars]'),
            date_filter: new RadioInputs(() => this.searchPanel, '[data-test-id=field-date_filter]'),
            no_calendar_assigned: new ToggleInput(
                () => this.searchPanel,
                '[data-test-id=field-no_calendar_assigned] .sd-toggle'
            ),
            featured: new ToggleInput(
                () => this.searchPanel,
                '[data-test-id=field-featured] .sd-toggle'
            )
        };
        this.list = new PlanningList();
    }

    get filtersBar() {
        return cy.get('[data-test-id=subnav-filters]');
    }

    get searchPanel() {
        return cy.get('[data-test-id=search-panel]');
    }

    get searchPanelFooter() {
        return this.searchPanel.find('.side-panel__footer--button-box');
    }

    waitForSearch() {
        cy.intercept('GET', '**/api/events_planning_search*').as('getPlanningEventsSearch');
        cy.wait('@getPlanningEventsSearch', {timeout: 360000});
    }

    toggleSearchPanel() {
        this.filtersBar
            .find('[data-test-id=toggle-filters]')
            .click();
    }

    viewEventsAndPlanning() {
        this.filtersBar
            .find('[data-test-id=view-COMBINED]')
            .click();
        this.waitForSearch();
    }

    viewEventsOnly() {
        this.filtersBar
            .find('[data-test-id=view-EVENTS]')
            .click();
        this.waitForSearch();
    }

    viewPlanningOnly() {
        this.filtersBar
            .find('[data-test-id=view-PLANNING]')
            .click();
        this.waitForSearch();
    }

    openAllToggleBoxes() {
        cy.log('Planning.SearchPanel.openAllToggleBoxes');
        this.searchPanel
            .find('.toggle-box.toggle-box--circle.hidden')
            .click({multiple: true});
    }

    clickSearch() {
        this.searchPanelFooter
            .contains('Search')
            .should('exist')
            .click();
        this.waitForSearch();
    }

    clickClear() {
        this.searchPanelFooter
            .contains('Clear')
            .should('exist')
            .click();
        this.waitForSearch();
    }

    expectSearchResultCount(run: ISearchTest) {
        cy.log('Search: ' + JSON.stringify(run.params));
        if (Object.keys(run.params).length > 0) {
            Object.keys(run.params).forEach(
                (name: string) => {
                    const value = run.params[name];
                    const field: Input = get(this.fields, name);

                    if (!field) {
                        throw new Error(`Field "${name}" not registered with e2e search helper`);
                    } else if (value?.length || isBoolean(value)) {
                        field.type(value);
                    } else {
                        field.clear();
                    }
                }
            );

            this.clickSearch();
        }

        if (run.expectedCount != null) {
            this.list.expectItemCount(run.expectedCount);
        }

        if (run.expectedText?.length) {
            run.expectedText.forEach(
                (expectedText, index) => {
                    this.list.expectItemText(index, expectedText);
                }
            );
        }

        if (run.clearAfter) {
            this.clickClear();
        }
    }

    runSearchTests(runs: Array<ISearchTest>) {
        runs.forEach((run) => {
            cy.wrap(run)
                .then(() => this.expectSearchResultCount(run));
        });
    }
}
