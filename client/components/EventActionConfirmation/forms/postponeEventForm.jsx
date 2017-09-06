import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector, Field } from 'redux-form'
import * as actions from '../../../actions'
import moment from 'moment'
import { EventUpdateMethods, InputTextAreaField } from '../../fields/index'
import { UpdateMethodSelection } from '../UpdateMethodSelection'
import '../style.scss'

const Component = ({ handleSubmit, initialValues, relatedEvents=[], relatedPlannings=[] }) => {
    let event = initialValues
    const isRecurring = !!event.recurrence_id

    // Default the update_method to 'Postpone this event only'
    event.update_method = EventUpdateMethods[0]
    let startStr = moment(event.dates.start).format('MMMM Do YYYY, h:mm:ss a')
    let endStr = moment(event.dates.end).format('MMMM Do YYYY, h:mm:ss a')

    const numEvents = relatedEvents.length + 1
    const numPlannings = relatedPlannings.length

    const updateMethodLabel = 'Would you like to postpone all recurring events or just this one?'

    return (
        <div className="EventActionConfirmation">
            <strong>{ event.name }</strong>
            <div className="metadata-view">
                <dl>
                    <dt>Starts:</dt>
                    <dd>{ startStr }</dd>
                    <dt>Ends:</dt>
                    <dd>{ endStr }</dd>
                    { isRecurring && (<dt>Events:</dt>)}
                    { isRecurring && (<dd>{ numEvents }</dd>)}
                    { isRecurring && (<dt>Plannings:</dt>)}
                    { isRecurring && (<dd>{ numPlannings }</dd>)}
                </dl>
            </div>

            {<UpdateMethodSelection
                showMethodSelection={isRecurring}
                updateMethodLabel={updateMethodLabel}
                relatedPlannings={relatedPlannings}
                handleSubmit={handleSubmit}
                action='postpone' />}

            <label>Reason for Event postponement:</label>
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
    relatedEvents: PropTypes.array,
    relatedPlannings: PropTypes.array,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

export const PostponeEvent = reduxForm({ form: 'postponeEvent' })(Component)

const selector = formValueSelector('postponeEvent')
const mapStateToProps = (state) => ({
    relatedPlannings: selector(state, '_relatedPlannings'),
    relatedEvents: selector(state, '_events'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.postponeEvent(event)),
    onHide: (event) => {
        if (event.lock_action === 'postpone_event') {
            dispatch(actions.events.api.unlock(event))
        }
    },
})

export const PostponeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(PostponeEvent)
