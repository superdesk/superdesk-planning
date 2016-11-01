import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { DayPickerInput } from './index'
import { GeoSuggestInput } from './index'
import { Field, reduxForm, SubmissionError } from 'redux-form'
import { set, get } from 'lodash'

export const renderInputField = ({ input, label, type, meta: { touched, error, warning } }) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <input {...input} placeholder={label} type={type}/>
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    </div>
)

export const renderGeoSuggestInput = ({ input, label, googleApiKey, meta: { touched, error, warning } }) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <GeoSuggestInput onChange={input.onChange} googleApiKey={googleApiKey} />
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    </div>
)
        
/**
* Form for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isFullDay: false
        }
    }

    handleIsFullDayChange(e) {
        this.setState({ isFullDay: e.target.checked })
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit}>
                <div>
                    <Field name="unique_name"
                           component={renderInputField}
                           type="text"
                           label="What"/>
                </div>
                <div>
                    <Field name="description.definition_short"
                           component={renderInputField}
                           type="text"
                           label="Description"/>
                </div>
                <div>
                    <Field name="location[0].name"
                           component={renderGeoSuggestInput}
                           googleApiKey={this.props.googleApiKey}
                           label="Location"/>
                </div>
                <div>
                    <label htmlFor="dates.start">When</label>
                </div>
                <div>
                    <Field name="dates.start"
                           component={DayPickerInput}
                           withTime={!this.state.isFullDay}/>
                    &nbsp;to&nbsp;
                    <Field name="dates.end"
                           component={DayPickerInput}
                           withTime={!this.state.isFullDay}/>
                </div>
                <label htmlFor="isFullDay">Is full day</label>
                <input type="checkbox" onChange={this.handleIsFullDayChange.bind(this)}/>
                {this.props.error && <div><strong>{this.props.error}</strong></div>}
            </form>
        )
    }
}

const requiredFields = ['unique_name', 'dates.start']

const validate = values => {
    const errors = {}
    requiredFields.forEach((field) => {
        if (!get(values, field)) {
            set(errors, field, 'Required')
        }
    })

    return errors
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate,
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapStateToProps = (state) => ({
    googleApiKey: state.config.google.key
})

const mapDispatchToProps = (dispatch) => ({
    // `handleSubmit` will call `onSubmit` after validation
    onSubmit: (event) => (
        dispatch(actions.saveEvent(event))
        .then((()=> (undefined)), (error) => {
            // in case of API error
            if (error.data._error) {
                if (error.data._issues.unique_name && error.data._issues.unique_name.unique === 1) {
                    throw new SubmissionError({
                        unique_name: 'Name must be unique',
                        _error: 'Name must be unique'
                    })
                }
            }
        })
    ),
})

const AddEventForm = connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(FormComponent)
export default AddEventForm
