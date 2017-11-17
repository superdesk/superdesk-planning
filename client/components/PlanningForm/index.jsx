import React from 'react'
import PropTypes from 'prop-types'
import { fields, ToggleBox, EventMetadata } from '../../components'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, propTypes, formValueSelector } from 'redux-form'
import * as selectors from '../../selectors'
import { isItemPublic } from '../../utils/index'
import { FORM_NAMES } from '../../constants'
import './style.scss'
import { get } from 'lodash'
import {
    ChainValidators,
    RequiredFieldsValidatorFactory,
    MaxLengthValidatorFactory } from '../../validators'

class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const {
            handleSubmit,
            readOnly,
            slugline,
            pubstatus,
            users,
            formProfile,
            event,
            desks,
            initialValues,
        } = this.props
        const isPublic = isItemPublic(pubstatus)
        return (
            <form onSubmit={handleSubmit} className="PlanningForm">
                <fieldset>
                    {get(formProfile.planning, 'editor.slugline.enabled') &&
                        <div className="form__row">
                            <Field
                                name="slugline"
                                component={fields.InputField}
                                type="text"
                                label="Slugline"
                                required={get(formProfile.planning, 'schema.slugline.required')}
                                readOnly={readOnly} />
                        </div>
                    }
                    {get(formProfile.planning, 'editor.description_text.enabled') &&
                        <div className="form__row">
                            <Field
                            name="description_text"
                            component={fields.InputTextAreaField}
                            label="Description"
                            required={get(formProfile.planning, 'schema.description_text.required')}
                            readOnly={readOnly} />
                        </div>
                    }
                    {get(formProfile.planning, 'editor.internal_note.enabled') &&
                        <div className="form__row">
                            <Field name="internal_note"
                                component={fields.InputTextAreaField}
                                label="Internal Note"
                                required={get(formProfile.planning, 'schema.internal_note.required')}
                                readOnly={readOnly}/>
                        </div>
                    }
                    {get(formProfile.planning, 'editor.agendas.enabled') &&
                        <div className="form__row">
                            <Field
                                name="agendas"
                                component={fields.AgendaField}
                                label="Agenda"
                                readOnly={readOnly} />
                        </div>
                    }
                    <ToggleBox title="Details" isOpen={false}>
                        {get(formProfile.planning, 'editor.ednote.enabled') &&
                        <div className="form__row">
                            <Field
                                name="ednote"
                                component={fields.InputTextAreaField}
                                label="Ed Note"
                                required={get(formProfile.planning, 'schema.ednote.required')}
                                readOnly={readOnly} />
                        </div>
                        }
                        {get(formProfile.planning, 'editor.anpa_category.enabled') &&
                        <div className="form__row">
                            <Field
                                name="anpa_category"
                                component={fields.CategoryField}
                                label="Category"
                                required={get(formProfile.planning, 'schema.anpa_category.required')}
                                readOnly={readOnly} />
                        </div>
                        }
                        {get(formProfile.planning, 'editor.subject.enabled') &&
                        <div className="form__row">
                            <Field
                                name="subject"
                                component={fields.SubjectField}
                                label="Subject"
                                required={get(formProfile.planning, 'schema.subject.required')}
                                readOnly={readOnly} />
                        </div>
                        }
                        {get(formProfile.planning, 'editor.urgency.enabled') &&
                        <div className="form__row">
                            <Field
                                name="urgency"
                                component={fields.UrgencyField}
                                labelLeft={true}
                                label="Urgency"
                                required={get(formProfile.planning, 'schema.urgency.required')}
                                readOnly={readOnly} />
                        </div>
                        }
                        {get(formProfile.planning, 'editor.flags') && readOnly &&
                            get(initialValues, 'flags.marked_for_not_publication', false) &&
                            <div className="form__row">
                                <span className="state-label not-for-publication">Not for Publication</span>
                            </div>
                        }
                        {get(formProfile.planning, 'editor.flags') && !isPublic && !readOnly &&
                            <div className="form__row">
                                <Field
                                    name="flags.marked_for_not_publication"
                                    component={fields.ToggleField}
                                    label="Not for Publication"
                                    readOnly={readOnly}/>
                            </div>
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
    form: FORM_NAMES.PlanningForm, // a unique name for this form
    validate: ChainValidators([
        RequiredFieldsValidatorFactory(),
        MaxLengthValidatorFactory(),
    ]),
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector(FORM_NAMES.PlanningForm) // same as form name
const mapStateToProps = (state) => ({
    slugline: selector(state, 'slugline'), // Used to parse current slugline to new coverages
    pubstatus: selector(state, 'pubstatus'), // Used to determine `Published State`
    users: selectors.getUsers(state),
    desks: selectors.getDesks(state),
    formProfile: selectors.getPlanningTypeProfile(state),
})

export const PlanningForm = connect(
    mapStateToProps,
    null,
    null,
    { withRef: true })(PlanningReduxForm)
