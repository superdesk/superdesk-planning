import React from 'react';
import Formsy from 'formsy-react';

export const InputText = React.createClass({
    // Add the Formsy Mixin
    mixins: [Formsy.Mixin],

    changeValue(event) {
        this.setValue(event.currentTarget.value);
    },

    render() {
        // Set a specific className based on the validation
        // state of this component. showRequired() is true
        // when the value is empty and the required prop is
        // passed to the input. showError() is true when the
        // value typed is invalid
        const className = this.showRequired() ? 'required' : this.showError() ? 'error' : null;

        // An error message is returned ONLY if the component is invalid
        // or the server has returned an error message
        const errorMessage = this.getErrorMessage();

        return (
            <div className={className}>
                <input type="text"
                       onClick={this.props.onClick}
                       onChange={this.changeValue}
                       value={this.getValue()}
                       placeholder={this.props.placeholder}/>
                <span>{errorMessage}</span>
            </div>
        );
    }
});
