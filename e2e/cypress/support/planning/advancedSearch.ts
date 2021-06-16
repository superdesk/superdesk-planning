import {get, isBoolean} from 'lodash';

import {
    Input,
    SelectMetaTerms,
    RadioInputs,
    SpikeStateInput,
    ToggleInput,
    SelectInput,
    LocationInput,
    UrgencyInput,
} from '../common/inputs';
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
            full_text: new Input(getSearchPanel, '[data-test-id=field-full_text] input'),
            name: new Input(getSearchPanel, '[data-test-id=field-name] input'),
            slugline: new Input(getSearchPanel, '[data-test-id=field-slugline] input'),
            anpa_category: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-subject]'),
            state: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-state]'),
            only_posted: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-posted] .sd-switch__wrapper'
            ),
            include_killed: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-include_killed] .sd-switch__wrapper'
            ),
            spike_state: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-spike_state] .sd-switch__wrapper'
            ),
            lock_state: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-lock_state] select'
            ),
            start_date: {
                date: new Input(getSearchPanel, 'input[name="start_date.date"]'),
                time: new Input(getSearchPanel, 'input[name="start_date.time"]'),
            },
            end_date: {
                date: new Input(getSearchPanel, 'input[name="end_date.date"]'),
                time: new Input(getSearchPanel, 'input[name="end_date.time"]'),
            },
            calendars: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-calendars]'),
            agendas: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-agendas]'),
            date_filter: new RadioInputs(getSearchPanel, '[data-test-id=field-date_filter]'),
            no_calendar_assigned: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-no_calendar_assigned] .sd-switch__wrapper'
            ),
            source: new SelectMetaTerms(getSearchPanel, '[data-test-id=field-source]'),
            location: new LocationInput(getSearchPanel, '[data-test-id=field-location]'),
            featured: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-featured] .sd-switch__wrapper'
            ),
            urgency: new UrgencyInput(getSearchPanel, '[data-test-id=field-urgency]'),
            g2_content_type: new SelectInput(
                getSearchPanel,
                '[data-test-id=field-g2_content_type] select'
            ),
            no_agenda_assigned: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-no_agenda_assigned] .sd-switch__wrapper'
            ),
            ad_hoc_planning: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-ad_hoc_planning] .sd-switch__wrapper'
            ),
            no_coverage: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-no_coverage] .sd-switch__wrapper'
            ),
            include_scheduled_updates: new ToggleInput(
                getSearchPanel,
                '[data-test-id=field-include_scheduled_updates] .sd-switch__wrapper'
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
        return cy.get('.subnav + .subnav');
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
            .find('.icon-filter-large')
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

    clearDate(field: 'start' | 'end') {
        this.searchPanel.find(`[data-test-id=field-${field}_date]`)
            .find('.icon-close-small')
            .should('exist')
            .click();
    }
}
