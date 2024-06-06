import {Editor} from '../../common/editor';
import {Input, ToggleInput, SelectInput, SelectMetaTerms, LocationInput, TreeSelect} from '../../common/inputs';
import {ContactsInput} from '../../contacts';
import {LinkInput} from './linkInput';

/**
 * Wrapper class for Superdesk's Event editor component
 * @extends Editor
 */
export class EventEditor extends Editor {
    fields: {[key: string]: any};

    constructor(languages: Array<string> = [], multilingualFields: Array<string> = []) {
        super('.icon-event', 'event');

        const getParent = () => this.element;

        this.fields = {
            name: new Input(getParent, '[data-test-id="field-name"] input'),
            slugline: new Input(getParent, '[data-test-id="field-slugline"] input'),
            definition_short: new Input(getParent, '[data-test-id="field-definition_short"] textarea'),
            definition_long: new Input(getParent, '[data-test-id="field-definition_long"] textarea'),
            internal_note: new Input(getParent, '[data-test-id="field-internal_note"] textarea'),
            ednote: new Input(getParent, '[data-test-id="field-ednote"] textarea'),
            dates: {
                start: {
                    date: new Input(getParent, '[data-test-id="field-dates_start"] input[name="dates.start.date"]'),
                    time: new Input(getParent, '[data-test-id="field-dates_start"] input[name="_startTime"]'),
                },
                end: {
                    date: new Input(getParent, '[data-test-id="field-dates_end"] input[name="dates.end.date"]'),
                    time: new Input(getParent, '[data-test-id="field-dates_end"] input[name="_endTime"]'),
                },
                allDay: new ToggleInput(getParent, '[data-test-id="field-dates_all_day"]'),
                recurring: {
                    enable: new ToggleInput(
                        getParent,
                        '[data-test-id="field-recurring_rules_toggle"]'
                    ),
                    until: new Input(
                        getParent,
                        '[data-test-id="field-recurring_rules_rules"] input[name="dates.recurring_rule.until"]'
                    ),
                },
            },
            occur_status: new SelectInput(getParent, '[data-test-id="field-occur_status"] select'),
            calendars: new TreeSelect(getParent, '[data-test-id=field-calendars]', true),
            anpa_category: new SelectMetaTerms(getParent, '[data-test-id="field-anpa_category"]'),
            subject: new SelectMetaTerms(getParent, '[data-test-id="field-subject"]'),
            links: new LinkInput(getParent, '[data-test-id="field-links"]'),
            event_contact_info: new ContactsInput(getParent, '[data-test-id="field-event_contact_info"]'),
            location: new LocationInput(getParent, '[data-test-id=field-location]'),
        };

        if (languages.length > 0) {
            this.fields.language = new TreeSelect(getParent, '[data-test-id=field-language]', true);

            const firstLanguage = languages[0];
            multilingualFields.forEach((field) => {
                const originalField = this.fields[field];

                languages.forEach((languageQcode) => {
                    this.fields[`${field}.${languageQcode}`] = new Input(
                        getParent,
                        originalField.selector.replace(field, `${field}.${languageQcode}`)
                    )
                });
                this.fields[field] = this.fields[`${field}.${firstLanguage}`];
            });
        } else {
            this.fields.language = new TreeSelect(getParent, '[data-test-id=field-language]', false);
        }
    }

    toggleShowAllLanguages() {
        this.element.find('#editor--language-controls [role="checkbox"]')
            .should('exist')
            .click();
    }

    getMainLanguageButton(languageQcode: string) {
        return  this.element.find(`#editor--language-controls [data-test-id="main-language--${languageQcode}"]`);
    }
}
