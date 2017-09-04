import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector, Field } from 'redux-form'
import * as actions from '../../../actions'
import moment from 'moment'
import { EventUpdateMethods, InputTextAreaField } from '../../fields/index'
import { UpdateMethodSelection } from '../UpdateMethodSelection'
import '../style.scss'

const Component = ({ handleSubmit, initialValues, relatedPlannings=[] }) => {
    let event = initialValues

    // Default the update_method to 'Cancel this event only'
    event.update_method = EventUpdateMethods[0]
    let startStr = moment(event.dates.start).format('MMMM Do YYYY, h:mm:ss a')
    let endStr = moment(event.dates.end).format('MMMM Do YYYY, h:mm:ss a')
    let showRecurring = event.recurrence_id &&
            event._recurring &&
            event._recurring.events &&
            event._recurring.events.length > 1

    const updateMethodLabel = 'Would you like to cancel all recurring events or just this one?'

    return (
        <div className="EventActionConfirmation">
            <strong>{ event.name }</strong>
            <div className="metadata-view">
                <dl>
                    <dt>Starts:</dt>
                    <dd>{ startStr }</dd>
                    <dt>Ends:</dt>
                    <dd>{ endStr }</dd>
                    { showRecurring && (<dt>Events:</dt>)}
                    { showRecurring && (<dd>{ event._recurring.events.length }</dd>)}
                    { showRecurring && (<dt>Plannings:</dt>)}
                    { showRecurring && (<dd>{ relatedPlannings.length }</dd>)}
                </dl>
            </div>

            {<UpdateMethodSelection
                showMethodSelection={showRecurring}
                updateMethodLabel={updateMethodLabel}
                relatedPlannings={relatedPlannings}
                handleSubmit={handleSubmit}
                action='cancel' />}

            <label>Reason for Event cancellation:</label>
            <Field name="reason"
                component={InputTextAreaField}
                type="text"
                readOnly={false}/>
        </div>
    )
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

export const CancelEvent = reduxForm({ form: 'cancelEvent' })(Component)

const selector = formValueSelector('cancelEvent')
const mapStateToProps = (state) => ({ relatedPlannings: selector(state, '_plannings') })

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.cancelEvent(event)),
    onHide: (event) => dispatch(actions.events.api.unlock(event)),
})

export const CancelEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(CancelEvent)
