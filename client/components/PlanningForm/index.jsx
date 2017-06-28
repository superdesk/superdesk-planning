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
        const { handleSubmit, readOnly } = this.props
        return (
            <form onSubmit={handleSubmit} className="PlanningForm">
                <div>
                    <fieldset>
                        <Field
                            name="slugline"
                            component={fields.InputField}
                            type="text"
                            label="Slugline"
                            readOnly={readOnly} />
                        <Field
                            name="headline"
                            component={fields.InputField}
                            type="text"
                            label="Headline"
                            readOnly={readOnly} />
                        <Field
                            name="anpa_category"
                            component={fields.CategoryField}
                            label="Category"
                            readOnly={readOnly} />
                        <Field
                            name="subject"
                            component={fields.SubjectField}
                            label="Subject"
                            readOnly={readOnly} />
                    </fieldset>
                    <h3>Coverages</h3>
                    <FieldArray name="coverages" component={fields.CoveragesFieldArray} readOnly={readOnly} />
                </div>
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
