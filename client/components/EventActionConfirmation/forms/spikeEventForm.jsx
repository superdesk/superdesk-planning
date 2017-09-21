import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector } from 'redux-form'
import * as actions from '../../../actions'
import moment from 'moment'
import { EventUpdateMethods } from '../../fields/index'
import '../style.scss'
import { UpdateMethodSelection } from '../UpdateMethodSelection'
import { RelatedEvents } from '../../index'
import { getDateFormat } from '../../../selectors'
import { get } from 'lodash'

const Component = ({ handleSubmit, initialValues, relatedEvents=[], dateFormat }) => {
    let event = initialValues
    const isRecurring = !!event.recurrence_id

    // Default the update_method to 'Spike this event only'
    event.update_method = EventUpdateMethods[0]
    let startStr = moment(event.dates.start).format('MMMM Do YYYY, h:mm:ss a')
    let endStr = moment(event.dates.end).format('MMMM Do YYYY, h:mm:ss a')

    const updateMethodLabel = 'Would you like to spike all recurring events or just this one?'

    const eventsInUse = relatedEvents.filter((e) => (
        get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
    ))

    const numEvents = relatedEvents.length + 1 - eventsInUse.length

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
                </dl>
            </div>

            <UpdateMethodSelection
                showMethodSelection={isRecurring}
                updateMethodLabel={updateMethodLabel}
                handleSubmit={handleSubmit}
                showSpace={false}
                action='spike' />

            {eventsInUse.length > 0 &&
                <div className="sd-alert sd-alert--hollow sd-alert--alert">
                    <strong>The following Events are in use and will not be spiked:</strong>
                    <RelatedEvents
                        events={eventsInUse}
                        dateFormat={dateFormat}/>
                </div>
            }
        </div>
    )
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string.isRequired,
}

// Decorate the form container
export const SpikeEvent = reduxForm({ form: 'spikeEvent' })(Component)

const selector = formValueSelector('spikeEvent')
const mapStateToProps = (state) => ({
    relatedEvents: selector(state, '_events'),
    dateFormat: getDateFormat(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        dispatch(actions.events.ui.spike(event))
    ),
})

export const SpikeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(SpikeEvent)
