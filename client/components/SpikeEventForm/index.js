import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { RelatedPlannings } from '../index'
import * as actions from '../../actions'
import moment from 'moment'
import { EventUpdateMethodField, EventUpdateMethods } from '../fields/index'
import './style.scss'

const Component = ({ handleSubmit, initialValues, relatedPlannings=[] }) => {
    let event = initialValues

    // Default the update_method to 'Spike this event only'
    event.update_method = EventUpdateMethods[0]
    let startStr = moment(event.dates.start).format('MMMM Do YYYY, h:mm:ss a')
    let endStr = moment(event.dates.end).format('MMMM Do YYYY, h:mm:ss a')
    let showRecurring = event.recurrence_id &&
            event._recurring &&
            event._recurring.events &&
            event._recurring.events.length > 1

    const updateMethodLabel = 'Would you like to spike all recurring events or just this one?'

    return (
        <div className="SpikeEvent">
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

            <form onSubmit={handleSubmit} className="SpikeEventForm">
                { showRecurring && (
                    <div className="MethodSelect">
                        <span>
                            <strong>This event is a recurring event!</strong>
                        </span>

                        <Field name="update_method"
                               component={EventUpdateMethodField}
                               label={updateMethodLabel}/>
                    </div>
                )}
                <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
            </form>
            { showRecurring && relatedPlannings.length <= 0 && (
                <div className="Spacing" />
            )}

            { relatedPlannings && relatedPlannings.length > 0 && (
                <div>
                    <div className="sd-alert sd-alert--hollow sd-alert--alert">
                        <strong>This will also spike the following planning items</strong>
                        <RelatedPlannings
                            plannings={relatedPlannings}
                            openPlanningItem={true}
                            short={true} />
                    </div>
                </div>
            )}
        </div>
    )
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,
}

// Decorate the form container
export const SpikeEvent = reduxForm({ form: 'spikeEvent' })(Component)

const selector = formValueSelector('spikeEvent')
const mapStateToProps = (state) => ({ relatedPlannings: selector(state, '_plannings') })

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
