import React from 'react'
import { fields } from '../../components'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, propTypes } from 'redux-form'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import './style.scss'

class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { handleSubmit, pristine, submitting, reset } = this.props
        return (
            <form onSubmit={handleSubmit} className="PlanningForm">
                <div>
                    <fieldset>
                        <Field
                            name="slugline"
                            component={fields.InputField}
                            type="text"
                            label="Slugline"/>
                        <Field
                            name="headline"
                            component={fields.InputField}
                            type="text"
                            label="Headline"/>
                        <Field
                            name="anpa_category"
                            component={fields.CategoryField}
                            label="Category"/>
                    </fieldset>
                    <h3>Coverages</h3>
                    <FieldArray name="coverages" component={fields.CoveragesFieldArray} />
                </div>

                <footer>
                    <button
                        className="btn btn--primary"
                        type="submit"
                        disabled={pristine || submitting}>Save</button>
                    <button
                        className="btn"
                        type="button"
                        disabled={pristine || submitting} onClick={reset}>Cancel</button>
                </footer>

            </form>
        )
    }
}

Component.propTypes = propTypes

// Decorate the form component
const PlanningReduxForm = reduxForm({
    form: 'planning', // a unique name for this form
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapStateToProps = (state) => ({ initialValues: selectors.getCurrentPlanning(state) })

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (planning) => (
        // save the planning through the API
        dispatch(actions.savePlanningAndReloadCurrentAgenda(planning))
    ),
})

export const PlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(PlanningReduxForm)
