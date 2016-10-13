import React from 'react';
import Formsy from 'formsy-react';
import { DayPickerInput, InputText } from './index';
import lodash from 'lodash';

export class AddEventForm extends React.Component {
    constructor(props) {
        super(props);
        // resource to connect to API
        this.eventsResource = props.eventsResource;
        Formsy.addValidationRule('isUniqueName', this.isUniqueNameValidator);
    }

    /**
    * Represents a book.
    * @constructor
    * @param {object} obj - the object to convert
    * @param {boolean} leftToRight - the way to convert.
    * False by default, it convert from right to left (ex: `unique_name` to `uniqueName`)
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
                lodash.set(newEvent, to, lodash.get(obj, from));
            }
        }

        return newEvent;
    }

    isUniqueNameValidator() { return true; }

    handleSubmit(model) {
        let newEvent = this.mapping(model, true);
        let original = this.props.event ? this.props.event : {};
        this.eventsResource.save(original, newEvent);
        return model;
    }

    render() {
        let event = this.mapping(this.props.event);
        return (
            <Formsy.Form onValidSubmit={this.handleSubmit.bind(this)}
                         ref="form"
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
                    <DayPickerInput defaultValue={event.dates.from} name="dates.from"/> to
                    <DayPickerInput defaultValue={event.dates.to} name="dates.to"/>
                </div>
            </Formsy.Form>
        );
    }
}
