import React from 'react'
import PropTypes from 'prop-types'
import { fields, ToggleBox, EventMetadata } from '../../components'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, propTypes, formValueSelector } from 'redux-form'
import * as selectors from '../../selectors'
import { isItemPublic } from '../../utils/index'
import './style.scss'
import { get } from 'lodash'

class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const {
            handleSubmit,
            readOnly,
            headline,
            slugline,
            pubstatus,
            users,
            formProfile,
            event,
            desks,
        } = this.props
        const isPublic = isItemPublic(pubstatus)
        return (
            <form onSubmit={handleSubmit} className="PlanningForm">
                <fieldset>
                    {get(formProfile, 'editor.slugline.enabled') && <Field
                        name="slugline"
                        component={fields.InputField}
                        type="text"
                        label="Slugline"
                        readOnly={readOnly} /> }
                    {get(formProfile, 'editor.description_text.enabled') && <Field
                        name="description_text"
                        component={fields.InputTextAreaField}
                        label="Description"
                        readOnly={readOnly} />}
                    {get(formProfile, 'editor.internal_note.enabled') && <Field name="internal_note"
                        component={fields.InputTextAreaField}
                        label="Internal Note"
                        readOnly={readOnly}/>}
                    {get(formProfile, 'editor.agendas.enabled') && <Field
                        name="agendas"
                        component={fields.AgendaField}
                        label="Agenda"
                        readOnly={readOnly} />}
                    <ToggleBox title="Details" isOpen={false}>
                        {get(formProfile, 'editor.ednote.enabled') && <Field
                            name="ednote"
                            component={fields.InputField}
                            type="text"
                            label="Ed. Note"
                            readOnly={readOnly} />}
                        {get(formProfile, 'editor.headline.enabled') && <Field
                            name="headline"
                            component={fields.InputField}
                            type="text"
                            label="Headline"
                            readOnly={readOnly} />}
                        {get(formProfile, 'editor.anpa_category.enabled') && <Field
                            name="anpa_category"
                            component={fields.CategoryField}
                            label="Category"
                            readOnly={readOnly} />}
                        {get(formProfile, 'editor.subject.enabled') && <Field
                            name="subject"
                            component={fields.SubjectField}
                            label="Subject"
                            readOnly={readOnly} />}
                        {get(formProfile, 'editor.urgency.enabled') && <Field
                            name="urgency"
                            component={fields.UrgencyField}
                            readOnly={readOnly} />}
                        {get(formProfile, 'editor.flags') && !isPublic &&
                            <Field
                                name="flags.marked_for_not_publication"
                                component={fields.ToggleField}
                                label="Not for Publication"
                                readOnly={readOnly}/>
                        }
                    </ToggleBox>
                </fieldset>
                {event &&
                    <ToggleBox isOpen={false} title="Associated event">
                        <EventMetadata event={event} />
                    </ToggleBox>
                }
                <h3>Coverages</h3>
                <FieldArray
                    name="coverages"
                    component={fields.CoveragesFieldArray}
                    headline={headline}
                    slugline={slugline}
                    users={users}
                    readOnly={readOnly}
                    desks={desks} />
            </form>
        )
    }
}

Component.propTypes = {
    ...propTypes,
    headline: PropTypes.string,
    slugline: PropTypes.string,
    pubstatus: PropTypes.string,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
    onSubmit: PropTypes.func,
    formProfile: PropTypes.object,
    event: PropTypes.object,
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
    pubstatus: selector(state, 'pubstatus'), // Used to determine `Published State`
    users: selectors.getUsers(state),
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
    formProfile: selectors.getPlanningsFormsProfile(state),
})

export const PlanningForm = connect(
    mapStateToProps,
    null,
    null,
    { withRef: true })(PlanningReduxForm)
