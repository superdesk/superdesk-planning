import {Editor} from '../../common/editor';
import {Input, ToggleInput, SelectInput, SelectMetaTerms, LocationInput} from '../../common/inputs';
import {ContactsInput} from '../../contacts';
import {LinkInput} from './linkInput';

/**
 * Wrapper class for Superdesk's Event editor component
 * @extends Editor
 */
export class EventEditor extends Editor {
    fields: {[key: string]: any};

    constructor() {
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
                allDay: new ToggleInput(getParent, '[data-test-id="field-dates_all_day"] > :first-child'),
                recurring: {
                    enable: new ToggleInput(
                        getParent,
                        '[data-test-id="field-dates.recurring_rules_toggle"] > :first-child'
                    ),
                    until: new Input(
                        getParent,
                        '[data-test-id="field-dates.recurring_rules_rules"] input[name="dates.recurring_rule.until"]'
                    ),
                },
            },
            occur_status: new SelectInput(getParent, '[data-test-id="field-occur_status"] select'),
            calendars: new SelectMetaTerms(getParent, '[data-test-id="field-calendars"]'),
            anpa_category: new SelectMetaTerms(getParent, '[data-test-id="field-anpa_category"]'),
            subject: new SelectMetaTerms(getParent, '[data-test-id="field-subject"]'),
            links: new LinkInput(getParent, '[data-test-id="field-links"]'),
            event_contact_info: new ContactsInput(getParent, '[data-test-id="field-event_contact_info"]'),
            location: new LocationInput(getParent, '[data-test-id=field-location]'),
        };
    }
}
