import React from 'react'
import PropTypes from 'prop-types'
import { fields } from '../../components'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, propTypes, formValueSelector } from 'redux-form'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import './style.scss'

class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { handleSubmit, readOnly, headline, slugline, users } = this.props
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
                            name="description_text"
                            component={fields.InputTextAreaField}
                            label="Description"
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
                        <Field
                            name="agendas"
                            component={fields.AgendaField}
                            label="Agenda"
                            readOnly={readOnly} />
                        <Field
                            name="urgency"
                            component={fields.UrgencyField}
                            readOnly={readOnly} />
                    </fieldset>
                    <h3>Coverages</h3>
                    <FieldArray
                        name="coverages"
                        component={fields.CoveragesFieldArray}
                        headline={headline}
                        slugline={slugline}
                        users={users}
                        readOnly={readOnly} />
                </div>
            </form>
        )
    }
}

Component.propTypes = {
    ...propTypes,
    headline: PropTypes.string,
    slugline: PropTypes.string,
    users: PropTypes.array.isRequired,
}

// Decorate the form component
const PlanningReduxForm = reduxForm({
    form: 'planning', // a unique name for this form
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector('planning') // same as form name
const mapStateToProps = (state) => ({
    initialValues: selectors.getCurrentPlanning(state),
    headline: selector(state, 'headline'), // Used to parse current headline to new coverages
    slugline: selector(state, 'slugline'), // Used to parse current slugline to new coverages
    users: selectors.getUsers(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (planning) => (
        // save the planning through the API
        dispatch(actions.planning.ui.saveAndReloadCurrentAgenda(planning))
    ),
})

export const PlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(PlanningReduxForm)
