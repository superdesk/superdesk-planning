import {get, isBoolean} from 'lodash';

import {Input, SelectMetaTerms, RadioInputs, SpikeStateInput, ToggleInput, SelectInput} from '../common/inputs';
import {PlanningList} from './planningList';

interface ISearchTest {
    params: {[key: string]: any};
    expectedCount?: number;
    expectedText?: Array<string>;
    clearAfter?: boolean;
}

export class AdvancedSearch {
    fields: {[key: string]: any};
    list: PlanningList;
    getParent?(): Cypress.Chainable;

    constructor(getParent: () => Cypress.Chainable = null) {
        this.getParent = getParent;
        const getSearchPanel = () => this.searchPanel;

        this.fields = {
            name: new Input(getSearchPanel, '[data-test-id=field-name] input'),
            slugline: new Input(getSearchPanel, '[data-test-id=field-slugline] input'),
            anpa_category: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-subject]'),
            state: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-state]'),
            spike_state: new SpikeStateInput(getSearchPanel, '[data-test-id=field-spike_state]'),
            start_date: {
                date: new Input(getSearchPanel, 'input[name="start_date.date"]'),
                time: new Input(getSearchPanel, 'input[name="start_date.time"]'),
            },
            end_date: {
                date: new Input(getSearchPanel, 'input[name="end_date.date"]'),
                time: new Input(getSearchPanel, 'input[name="end_date.time"]'),
            },
            calendars: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-calendars]'),
            date_filter: new RadioInputs(getSearchPanel, '[data-test-id=field-date_filter]'),
            no_calendar_assigned: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-no_calendar_assigned] .sd-toggle'
            ),
            featured: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-featured] .sd-toggle'
            ),
            filter_name: new Input(
                getSearchPanel,
                '[data-test-id=field-filter_name] input'
            ),
            item_type: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-item_type] select'
            ),
            frequency: new RadioInputs(
                getSearchPanel,
                '[data-test-id=field-frequency]'
            ),
            week_days: new RadioInputs(
                getSearchPanel,
                '[data-test-id=field-week_days]',
                '.sd-check-button'
            ),
            hour: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-hour] select'
            ),
            desk: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-desk] select'
            ),
            month_day: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-month_day] select'
            ),
        };
        this.list = new PlanningList();
    }

    get filtersBar() {
        return cy.get('[data-test-id=subnav-filters]');
    }

    get searchPanel() {
        if (this.getParent != null) {
            return this.getParent();
        } else {
            return cy.get('[data-test-id=search-panel]');
        }
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

    enterSearchParams(params: ISearchTest['params']) {
        Object.keys(params).forEach(
            (name: string) => {
                const value = params[name];
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
    }

    expectSearchResultCount(run: ISearchTest) {
        cy.log('Search: ' + JSON.stringify(run.params));
        if (Object.keys(run.params).length > 0) {
            this.enterSearchParams(run.params);
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
