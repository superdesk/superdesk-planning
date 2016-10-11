import React from 'react';
import Formsy from 'formsy-react';
import { DayPickerInput, InputText } from './index';

export class AddEventForm extends React.Component {
    constructor(props) {
        super(props);
        // resource to connect to API
        this.eventsResource = props.eventsResource;
        this.state = {
            canSubmit: false
        };
        Formsy.addValidationRule('isUniqueName', this.isUniqueNameValidator);
    }

    isUniqueNameValidator() { return true; }

    enableButton() { this.setState({ canSubmit: true }); }

    disableButton() { this.setState({ canSubmit: false }); }

    handleSubmit(model) {
        let event = {
            unique_name: model.uniqueName,
            event_details: {
                description: {
                    definition_short: model.description
                },
                dates: {
                    start: model.dates.from,
                    end: model.dates.to
                },
                location: [
                    {
                        qcode: 'FIXME',
                        name: model.location
                    }
                ]
            }
        };
        this.eventsResource.save({}, event);
        return model;
    }

    render() {
        return (
            <Formsy.Form onValidSubmit={this.handleSubmit.bind(this)}
                         onValid={this.enableButton.bind(this)}
                         onInvalid={this.disableButton.bind(this)}>
                <label>What</label>
                <InputText name="uniqueName"
                       validations="isUniqueName"
                       validationError="This is not an unique name"
                       required/>
                <label>Description</label>
                <InputText name="description"/>
                <label>Where</label>
                <InputText name="location"/>
                <label>When</label>
                <div>
                    <DayPickerInput name="dates.from"/> to <DayPickerInput name="dates.to"/>
                </div>
                <button type="submit" disabled={!this.state.canSubmit}>Submit</button>
            </Formsy.Form>
        );
    }
}
