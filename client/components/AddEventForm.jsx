import React from 'react';
import Formsy from 'formsy-react';
import { DayPickerInput, InputText } from './index';

export class AddEventForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: { from: null, to: null },
            canSubmit: false,
            selectedDay: new Date(),
        };
        Formsy.addValidationRule('isUniqueName', this.isUniqueNameValidator);
    }

    isUniqueNameValidator() { return true; }

    enableButton() { this.setState({ canSubmit: true }); }

    disableButton() { this.setState({ canSubmit: false }); }

    handleSubmit(model) {
        // TODO: implement
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
                <DayPickerInput name="date"/>
                <button type="submit" disabled={!this.state.canSubmit}>Submit</button>
            </Formsy.Form>
        );
    }
}
