import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { DayPickerInput, RepeatEventForm } from './index'
import { AddGeoSuggestInput } from './index'
import { Field, reduxForm, SubmissionError, formValueSelector } from 'redux-form'
import { set, get, isNil } from 'lodash'
import moment from 'moment'

export const renderInputField = ({
    input,
    label,
    type,
    meta: { touched, error, warning }
}) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <input {...input} placeholder={label} type={type}/>
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    </div>
)

export const renderGeoSuggestInput = ({
    input,
    label,
    meta: { touched, error, warning }
}) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <AddGeoSuggestInput
                onChange={input.onChange}
                initialValue={input.value || {}}/>
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
            doesRepeat: false,
        }
    }

    componentWillReceiveProps(props) {
        if (props.doesRepeat) {
            this.setState({ doesRepeat: true })
        }
    }

    theDayAfterStartingDate() {
        let nextDay
        if (this.props.startingDate) {
            nextDay = moment(this.props.startingDate).add(1, 'd')
        }

        return nextDay
    }

    handleDoesRepeatChange(event) {
        if (!event.target.checked) {
            // if unchecked, remove the recurring rules
            this.props.change('dates.recurring_rule', {})
        }
        // update the state to hide the recurrent date form
        this.setState({ doesRepeat: event.target.checked })
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="AddEventForm">
                <div>
                    <Field name="name"
                           component={renderInputField}
                           type="text"
                           label="What"/>
                </div>
                <div>
                    <Field name="definition_short"
                           component={renderInputField}
                           type="text"
                           label="Description"/>
                </div>
                <div>
                    <Field name="location[0]"
                           component={renderGeoSuggestInput}
                           label="Location"/>
                    <Field name="location[0].qcode"
                           component={renderInputField}
                           type="hidden"/>
                </div>
                <div>
                    <label htmlFor="dates.start">When</label>
                </div>
                <div>
                    <Field name="dates.start"
                           component={DayPickerInput}
                           withTime={true}/>
                    &nbsp;to&nbsp;
                    <Field name="dates.end"
                           defaultDate={this.theDayAfterStartingDate()}
                           component={DayPickerInput}
                           withTime={true}/>
                </div>
                <div>
                    <label htmlFor="repeat">Repeat ...</label>
                    <input
                        name="doesRepeat"
                        type="checkbox"
                        value={true}
                        checked={this.state.doesRepeat}
                        onChange={this.handleDoesRepeatChange.bind(this)}/>
                    {
                        this.state.doesRepeat &&
                        // as <RepeatEventForm/> contains fields, we provide the props in this form
                        // see http://redux-form.com/6.2.0/docs/api/Props.md
                        <RepeatEventForm {...this.props} />
                    }
                </div>
                {this.props.error && <div><strong>{this.props.error}</strong></div>}
            </form>
        )
    }
}

const validate = values => {
    const requiredFields = ['name', 'dates.start']
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

const selector = formValueSelector('addEvent') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
    doesRepeat: !isNil(selector(state, 'dates.recurring_rule.frequency')),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        // save the event through the API
        dispatch(actions.saveEvent(event))
    )
})

const AddEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
export default AddEventForm
