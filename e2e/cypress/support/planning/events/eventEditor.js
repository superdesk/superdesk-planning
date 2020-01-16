import {Editor} from '../../common/editor';
import {Input, ToggleInput, SelectInput, SelectMetaTerms} from '../../common/inputs';
import {ContactsInput} from '../../contacts';
import {LinkInput} from './linkInput';

/**
 * Wrapper class for Superdesk's Event editor component
 * @extends Editor
 */
export class EventEditor extends Editor {
    constructor() {
        super('.icon-event');
        this.fields = {
            name: new Input(() => this.element, 'input[name="name"]'),
            slugline: new Input(() => this.element, 'input[name="slugline"]'),
            definition_short: new Input(() => this.element, 'textarea[name="definition_short"]'),
            definition_long: new Input(() => this.element, 'textarea[name="definition_long"]'),
            internal_note: new Input(() => this.element, 'textarea[name="internal_note"]'),
            ednote: new Input(() => this.element, 'textarea[name="ednote"]'),
            dates: {
                start: {
                    date: new Input(() => this.element, 'input[name="dates.start.date"]'),
                    time: new Input(() => this.element, 'input[name="_startTime"]'),
                },
                end: {
                    date: new Input(() => this.element, 'input[name="dates.end.date"]'),
                    time: new Input(() => this.element, 'input[name="_endTime"]'),
                },
                allDay: new ToggleInput(() => this.element, 'button[name="dates.all_day"]'),
                recurring: {
                    enable: new ToggleInput(() => this.element, 'button[name="dates.recurring"]'),
                    until: new Input(() => this.element, 'input[name="dates.recurring_rule.until"]'),
                },
            },
            occur_status: new SelectInput(() => this.element, 'select[name="occur_status"]'),
            calendars: new SelectMetaTerms(() => this.element, '#form-row-calendars'),
            anpa_category: new SelectMetaTerms(() => this.element, '#form-row-anpa_category'),
            subject: new SelectMetaTerms(() => this.element, '#form-row-subject'),
            links: new LinkInput(() => this.element, ''),
            event_contact_info: new ContactsInput(() => this.element, '#form-row-event_contact_info'),
        };
    }
}
