import type {Page, Locator} from '@playwright/test';
import {Editor} from '../../../utils/common/editor';
import {
    Input,
    ToggleInput,
    SelectInput,
    TreeSelect,
    SelectMetaTerms,
    LinkInput,
    ContactsInput,
    LocationInput,
} from '../../../utils/common/inputs';

export class EventEditor extends Editor {
    constructor(page: Page, languages: Array<string> = [], multilingualFields: Array<string> = []) {
        super(page, '.icon-event', 'event');

        const getParent = () => this.element;

        this.fields = {
            name: new Input(page, getParent, '[data-test-id="field-name"] input'),
            slugline: new Input(page, getParent, '[data-test-id="field-slugline"] input'),
            definition_short: new Input(page, getParent, '[data-test-id="field-definition_short"] textarea'),
            definition_long: new Input(page, getParent, '[data-test-id="field-definition_long"] textarea'),
            internal_note: new Input(page, getParent, '[data-test-id="field-internal_note"] textarea'),
            ednote: new Input(page, getParent, '[data-test-id="field-ednote"] textarea'),
            dates: {
                start: {
                    date: new Input(
                        page,
                        getParent,
                        '[data-test-id="field-dates_start"] input[name="dates.start.date"]',
                    ),
                    time: new Input(
                        page,
                        getParent,
                        '[data-test-id="field-dates_start"] input[name="_startTime"]',
                    ),
                },
                end: {
                    date: new Input(
                        page,
                        getParent,
                        '[data-test-id="field-dates_end"] input[name="dates.end.date"]',
                    ),
                    time: new Input(
                        page,
                        getParent,
                        '[data-test-id="field-dates_end"] input[name="_endTime"]',
                    ),
                },
                recurring: {
                    enable: new ToggleInput(
                        page,
                        getParent,
                        '[data-test-id="field-recurring_rules_toggle"]',
                    ),
                    until: new Input(
                        page,
                        getParent,
                        '[data-test-id="field-recurring_rules_rules"] [data-test-id="dates.recurring_rule.until"]',
                    ),
                },
            },
            occur_status: new SelectInput(page, getParent, '[data-test-id="field-occur_status"] select'),
            calendars: new TreeSelect(page, getParent, '[data-test-id=field-calendars]', true),
            anpa_category: new TreeSelect(page, getParent, '[data-test-id="field-anpa_category"]'),
            subject: new SelectMetaTerms(page, getParent, '[data-test-id="field-subject"]'),
            links: new LinkInput(page, getParent, '[data-test-id="field-links"]'),
            event_contact_info: new ContactsInput(page, getParent, '[data-test-id="field-event_contact_info"]'),
            location: new LocationInput(page, getParent, '[data-test-id=field-location]'),
        };

        if (languages.length > 0) {
            const firstLanguage = languages[0];

            this.fields.language = new TreeSelect(
                page,
                getParent,
                '[data-test-id=field-language]',
                true
            );
            for (const field of multilingualFields) {
                const originalField = this.fields[field];

                for (const languageQcode of languages) {
                    this.fields[`${field}.${languageQcode}`] = new Input(
                        page,
                        getParent,
                        originalField.selector.replace(field, `${field}.${languageQcode}`)
                    );
                }
                this.fields[field] = this.fields[`${field}.${firstLanguage}`];
            }
        } else {
            this.fields.language = new TreeSelect(page, getParent, '[data-test-id=field-language]', false);
        }
    }

    async toggleShowAllLanguages(): Promise<void> {
        await this.element.locator('#editor--language-controls')
            .getByRole('checkbox')
            .click();
    }

    getMainLanguageButton(languageQcode: string): Locator {
        return this.element.locator('#editor--language-controls')
            .getByTestId(`main-language--${languageQcode}`);
    }
}
