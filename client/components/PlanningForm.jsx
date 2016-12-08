import React from 'react'
import { InputField } from './index'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../actions'
import { RequiredFieldsValidator } from '../utils'
import * as selectors from '../selectors'

class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { handleSubmit, pristine, submitting } = this.props
        return (
            <form onSubmit={handleSubmit} className="PlanningForm">
                <fieldset>
                    <Field name="slugline" component={InputField} type="text" label="Slugline"/>
                    <Field name="headline" component={InputField} type="text" label="Headline"/>
                </fieldset>
                <button
                    className="btn btn-default"
                    type="submit"
                    disabled={pristine || submitting}>Submit</button>
            </form>
        )
    }
}

// Decorate the form component
const PlanningReduxForm = reduxForm({
    form: 'planning', // a unique name for this form
    validate: RequiredFieldsValidator([]),
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapStateToProps = (state) => ({
    initialValues: selectors.getCurrentPlanning(state)
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (planning) => (
        // save the planning through the API
        dispatch(actions.savePlanningAndReloadCurrentAgenda(planning))
    )
})

export const PlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(PlanningReduxForm)
