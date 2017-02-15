import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { RequiredFieldsValidator } from '../../utils'
import { Field, reduxForm, formValueSelector, propTypes } from 'redux-form'
import { fields } from '../../components'
import './style.scss'

export class Component extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        const { handleSubmit, pristine, submitting } = this.props
        return (
            <form onSubmit={handleSubmit} className="AdvancedSearchForm">
                <fieldset>
                    <Field name="name"
                           component={fields.InputField}
                           type="text"
                           label="What"/>
                    <Field name="location"
                           component={fields.InputField}
                           type="text"
                           label="Location"/>
                    <Field name="dates.start"
                           component={fields.DayPickerInput}
                           withTime={true}/>
                    &nbsp;to&nbsp;
                    <Field name="dates.end"
                           component={fields.DayPickerInput}
                           withTime={true}/>
                </fieldset>
                <button
                    className="btn btn-default"
                    type="submit"
                    disabled={pristine || submitting}>Submit</button>
                {this.props.error && <div><strong>{this.props.error}</strong></div>}
            </form>
        )
    }
}

Component.propTypes = propTypes

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'advanced-search', // a unique name for this form
    validate: RequiredFieldsValidator([]),
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector('advanced-search') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end')
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (form) => (
        dispatch(actions.searchEvents({form}))
    )
})

export const AdvancedSearchForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
