import {Page, Locator} from '@playwright/test';
import {get, isBoolean} from 'lodash';

import {
    Input,
    SelectMetaTerms,
    RadioInputs,
    ToggleInput,
    SelectInput,
    LocationInput,
    TreeSelect,
    TimePickerInput,
    UrgencyTreeSelectInput,
    clickAll,
} from '../../utils/common';
import {PlanningList} from './planningList';

interface ISearchTest {
    params: {[key: string]: any};
    expectedCount?: number;
    expectedText?: Array<string>;
    clearAfter?: boolean;
}

export class AdvancedSearch {
    page: Page;
    fields: {[key: string]: any};
    list: PlanningList;
    getParent: () => Locator;

    constructor(page: Page, getParent?: () => Locator) {
        this.page = page;
        this.getParent = getParent || page.getByTestId.bind(page, 'search-panel');

        this.fields = {
            full_text: new Input(page, this.getParent, '[data-test-id=field-full_text] input'),
            name: new Input(page, this.getParent, '[data-test-id=field-name] input'),
            slugline: new Input(page, this.getParent, '[data-test-id=field-slugline] input'),
            anpa_category: new TreeSelect(page, this.getParent, '[data-test-id=field-anpa_category]'),
            subject: new SelectMetaTerms(page, this.getParent, '[data-test-id=field-subject]'),
            state: new SelectMetaTerms(page, this.getParent, '[data-test-id=field-state]'),
            only_posted: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-posted]'
            ),
            include_killed: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-include_killed]'
            ),
            spike_state: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-spike_state]'
            ),
            lock_state: new SelectInput(
                page,
                this.getParent,
                '[data-test-id=field-lock_state] select'
            ),
            start_date: {
                date: new Input(page, this.getParent, 'input[name="start_date.date"]'),
                time: new Input(page,this.getParent, 'input[name="start_date.time"]'),
            },
            end_date: {
                date: new Input(page, this.getParent, 'input[name="end_date.date"]'),
                time: new Input(page, this.getParent, 'input[name="end_date.time"]'),
            },
            calendars: new TreeSelect(page, this.getParent, '[data-test-id=field-calendars]', true),
            agendas: new SelectMetaTerms(page, this.getParent, '[data-test-id=field-agendas]'),
            date_filter: new RadioInputs(page, this.getParent, '[data-test-id=field-date_filter]'),
            no_calendar_assigned: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-no_calendar_assigned]'
            ),
            source: new SelectMetaTerms(page, this.getParent, '[data-test-id=field-source]'),
            location: new LocationInput(page, this.getParent, '[data-test-id=field-location]'),
            featured: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-featured]'
            ),
            urgency: new UrgencyTreeSelectInput(page, this.getParent, '[data-test-id=field-urgency]'),
            g2_content_type: new SelectInput(
                page,
                this.getParent,
                '[data-test-id=field-g2_content_type] select'
            ),
            no_agenda_assigned: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-no_agenda_assigned]'
            ),
            ad_hoc_planning: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-ad_hoc_planning]'
            ),
            no_coverage: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-no_coverage]'
            ),
            include_scheduled_updates: new ToggleInput(
                page,
                this.getParent,
                '[data-test-id=field-include_scheduled_updates]'
            ),
            filter_name: new Input(
                page,
                this.getParent,
                '[data-test-id=field-filter_name] input'
            ),
            item_type: new SelectInput(
                page,
                this.getParent,
                '[data-test-id=field-item_type] select'
            ),
            frequency: new RadioInputs(
                page,
                this.getParent,
                '[data-test-id=field-frequency]'
            ),
            week_days: new RadioInputs(
                page,
                this.getParent,
                '[data-test-id=field-week_days]',
                '.sd-check-button'
            ),
            hour: new TimePickerInput(
                page,
                this.getParent,
                '[data-test-id=field-hour]'
            ),
            desk: new SelectInput(
                page,
                this.getParent,
                '[data-test-id=field-desk] select'
            ),
            month_day: new SelectInput(
                page,
                this.getParent,
                '[data-test-id=field-month_day] select'
            ),
            reference: new Input(
                page,
                this.getParent,
                '[data-test-id=field-reference] input',
            ),
            definition_short: new Input(
                page,
                this.getParent,
                '[data-test-id=field-definition_short] input',
            ),
            definition_long: new Input(
                page,
                this.getParent,
                '[data-test-id=field-definition_long] input',
            ),
            registration_details: new Input(
                page,
                this.getParent,
                '[data-test-id=field-registration_details] input',
            ),
            invitation_details: new Input(
                page,
                this.getParent,
                '[data-test-id=field-invitation_details] input',
            ),
            accreditation_info: new Input(
                page,
                this.getParent,
                '[data-test-id=field-accreditation_info] input',
            ),
            registration: new Input(
                page,
                this.getParent,
                '[data-test-id=field-registration] input',
            ),
            event_types: new TreeSelect(
                page,
                this.getParent,
                '[data-test-id=field-event_types]',
                true,
            ),
            description_text: new Input(
                page,
                this.getParent,
                '[data-test-id=field-description_text] input',
            ),
            ednote: new Input(
                page,
                this.getParent,
                '[data-test-id=field-ednote] input',
            ),
            headline: new Input(
                page,
                this.getParent,
                '[data-test-id=field-headline] input',
            ),
        };
        this.list = new PlanningList(page);
    }

    get filtersBar(): Locator {
        return this.page.locator('.subnav + .subnav');
    }

    get searchPanelFooter(): Locator {
        return this.getParent().locator('.side-panel__footer--button-box');
    }

    async waitForSearch(): Promise<void> {
        await this.page.waitForResponse((response) => (
            response.url().includes('/api/events_planning_search') &&
            response.request().method() === 'GET'
        ));
    }

    async switchView(view: 'COMBINED' | 'EVENTS' | 'PLANNING'): Promise<void> {
        const button = this.filtersBar.getByTestId(`view-${view}`);
        const isSelected = await button.getAttribute('aria-pressed') === 'true';

        if (isSelected) {
            await this.list.panel.waitFor({state: 'visible'});
            return;
        }

        await Promise.all([
            this.waitForSearch(),
            button.click(),
        ]);
    }

    async toggleSearchPanel(): Promise<void> {
        await this.filtersBar
            .getByRole('button', {name: 'Toggle advanced Filters', exact: true})
            .click();
    }

    async viewEventsAndPlanning(): Promise<void> {
        await this.switchView('COMBINED');
    }

    async viewEventsOnly(): Promise<void> {
        await this.switchView('EVENTS');
    }

    async viewPlanningOnly(): Promise<void> {
        await this.switchView('PLANNING');
    }

    async openAllToggleBoxes(): Promise<void> {
        await clickAll(this.getParent(), '.toggle-box.toggle-box--circle.hidden');
    }

    async clickSearch(): Promise<void> {
        await Promise.all([
            this.waitForSearch(),
            this.searchPanelFooter
                .getByRole('button', {name: 'Search', exact: true})
                .click(),
        ]);
    }

    async clickClear(): Promise<void> {
        await Promise.all([
            this.waitForSearch(),
            this.searchPanelFooter
                .getByRole('button', {name: 'Clear', exact: true})
                .click(),
        ]);
    }

    async enterSearchParams(params: ISearchTest['params']): Promise<void> {
        for (const [name, value] of Object.entries(params)) {
            const field: Input | undefined = get(this.fields, name);

            if (!field) {
                throw new Error(`Field "${name}" not registered with e2e search helper`);
            } else if (value?.length || isBoolean(value)) {
                await field.type(value);
                await this.page.waitForTimeout(100); // Wait for any potential debounce
            } else {
                await field.clear();
            }
        }
    }

    async expectSearchResultCount(run: ISearchTest): Promise<void> {
        if (Object.keys(run.params).length > 0) {
            await this.searchFor(run.params);
        }

        if (run.expectedCount != null) {
            await this.list.expectItemCount(run.expectedCount);
        }

        if (run.expectedText?.length) {
            for (let index = 0; index < run.expectedText.length; index++) {
                await this.list.expectItemText(index, run.expectedText[index]);
            }
        }

        if (run.clearAfter) {
            await this.clickClear();
        }
    }

    async runSearchTests(runs: Array<ISearchTest>): Promise<void> {
        for (const run of runs) {
            await this.expectSearchResultCount(run);
        }
    }

    async clearDate(field: 'start' | 'end'): Promise<void> {
        await this.getParent()
            .getByTestId(`field-${field}_date`)
            .locator('.icon-close-small')
            .click();
    }

    async searchFor(params: ISearchTest['params']): Promise<void> {
        await this.enterSearchParams(params);
        await this.clickSearch();
    }

    async setStartDate(date: string): Promise<void> {
        await this.toggleSearchPanel();
        await this.openAllToggleBoxes();
        await this.searchFor({'start_date.date': date});
        await this.toggleSearchPanel();
    }
}
