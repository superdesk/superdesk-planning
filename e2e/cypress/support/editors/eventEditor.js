import BaseEditor from './baseEditor';
import Form from '../form';

export default class EventEditor extends BaseEditor {
    constructor() {
        super('.icon-event');
        this.fields = {
            name: new Form.Input(this, 'input[name="name"]'),
            slugline: new Form.Input(this, 'input[name="slugline"]'),
            definition_short: new Form.Input(this, 'textarea[name="definition_short"]'),
            definition_long: new Form.Input(this, 'textarea[name="definition_long"]'),
            internal_note: new Form.Input(this, 'textarea[name="internal_note"]'),
            ednote: new Form.Input(this, 'textarea[name="ednote"]'),
            dates: {
                start: {
                    date: new Form.Input(this, 'input[name="dates.start.date"]'),
                    time: new Form.Input(this, 'input[name="_startTime"]'),
                },
                end: {
                    date: new Form.Input(this, 'input[name="dates.end.date"]'),
                    time: new Form.Input(this, 'input[name="_endTime"]'),
                },
                allDay: new Form.ToggleInput(this, 'button[name="dates.all_day"]'),
                recurring: {
                    enable: new Form.ToggleInput(this, 'button[name="dates.recurring"]'),
                    until: new Form.Input(this, 'input[name="dates.recurring_rule.until"]'),
                },
            },
            occur_status: new Form.SelectInput(this, 'select[name="occur_status"]'),
            calendars: new Form.SelectMetaTerms(this, '#form-row-calendars'),
            anpa_category: new Form.SelectMetaTerms(this, '#form-row-anpa_category'),
            subject: new Form.SelectMetaTerms(this, '#form-row-subject'),
            links: new Form.LinkInput(this, ''),
        };
    }
}
