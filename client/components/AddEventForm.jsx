import React from 'react';
import Formsy from 'formsy-react';
import { DayPickerInput, InputText } from './index';
import { set, get } from 'lodash';

export class AddEventForm extends React.Component {
    constructor(props) {
        super(props);
        Formsy.addValidationRule('isUniqueName', this.isUniqueNameValidator);
        this.state = { fullDay: false };
    }

    onFullDayChange(e) {
        this.setState({ fullDay: e.target.checked });
    }

    render() {
        let event = this.mapping(this.props.event);
        return (
            <Formsy.Form ref="form"
                         onValid={this.props.onValid}
                         onInvalid={this.props.onInvalid}>
                <label>What</label>
                <InputText value={event.uniqueName} name="uniqueName"
                       validations="isUniqueName"
                       validationError="This is not an unique name"
                       required/>
                <label>Description</label>
                <InputText value={event.description} name="description"/>
                <label>Where</label>
                <InputText value={event.location} name="location"/>
                <label>When</label>
                <div>
                    <DayPickerInput defaultValue={event.dates.from}
                                    name="dates.from"
                                    withTime={!this.state.fullDay}
                                    required/> to
                    <DayPickerInput defaultValue={event.dates.to}
                                    name="dates.to"
                                    withTime={!this.state.fullDay}/>
                </div>
                <label>Full day</label>
                <input type="checkbox" onChange={this.onFullDayChange.bind(this)}/>
            </Formsy.Form>
        );
    }

    // Validators
    isUniqueNameValidator() { return true; }

    /** Save the event with the API and notify its parent afterward */
    save() {
        let model = this.refs.form.getModel();
        // Clone the original event (immutable props rocks!)
        let original = this.props.event ? Object.assign({}, this.props.event) :  {};
        return this.props.api('events')
            // Map the field names and save through the API
            .save(original, this.mapping(model, true))
            // Notify the parent the event has been saved
            .then((r) => this.props.onSave(r));
    }

    /**
    * Map the event fields both way between names of API and form fields
    * @param {object} obj - the object to convert
    * @param {boolean} leftToRight - the way to convert.
    * False by default, it convert from right to left (ex: `unique_name` to `uniqueName`)
    * @return {object} newEvent - the new mapped event
    */
    mapping(obj, leftToRight) {
        var mapping = {
            uniqueName: 'unique_name',
            description: 'event_details.description.definition_short',
            'dates.from': 'event_details.dates.start',
            'dates.to': 'event_details.dates.end',
            location: 'event_details.location[0].name',
        };
        var newEvent = {};
        for (var name in mapping) {
            if (mapping.hasOwnProperty(name)) {
                var from = leftToRight ? name : mapping[name];
                var to = leftToRight ? mapping[name] : name;
                set(newEvent, to, get(obj, from));
            }
        }

        return newEvent;
    }
}
