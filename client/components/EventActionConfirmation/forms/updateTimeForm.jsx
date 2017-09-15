import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import * as actions from '../../../actions'
import { getDateFormat } from '../../../selectors'
import { EventUpdateMethods, TimePicker } from '../../fields'
import '../style.scss'
import { get } from 'lodash'
import { UpdateMethodSelection } from '../UpdateMethodSelection'
import { ChainValidators, EndDateAfterStartDate } from '../../../validators'

export class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    onFromTimeChange(value) {
        this.props.change('dates.start', value)
    }

    onToTimeChange(value) {
        this.props.change('dates.end', value)
    }

    render() {
        const { handleSubmit, initialValues, relatedEvents=[], dateFormat } = this.props

        let event = initialValues
        let isRecurring = !!event.recurrence_id

        const dateStr = event.dates.start.format('MMMM Do YYYY')

        // Default the update_method to 'Update this event only'
        event.update_method = EventUpdateMethods[0]

        let updateMethodLabel = 'Would you like to update all recurring events or just this one?'

        return (
            <div className='EventActionConfirmation'>
                <form onSubmit={handleSubmit}>
                    <div className="metadata-view">
                        <dl>
                            { event.slugline && (<dt>Slugline:</dt>) }
                            { event.slugline && (<dd>{ event.slugline }</dd>) }
                            { event.name && (<dt>Name:</dt>) }
                            { event.name && (<dd>{ event.name }</dd>) }
                            <dt>Date:</dt>
                            <dd>{ dateStr }</dd>
                            { isRecurring && (<dt>Events:</dt>)}
                            { isRecurring && (<dd>{ relatedEvents.length + 1 }</dd>)}
                        </dl>
                    </div>
                    <div>
                        <label>From:</label>
                    </div>
                    <div>
                        <Field
                            name='dates.start'
                            component={TimePicker}
                            placeholder="Time" />
                    </div>
                    <div>
                        <label>To:</label>
                    </div>
                    <div>
                        <Field
                            name='dates.end'
                            component={TimePicker}
                            placeholder="Time" />
                    </div>
                </form>

                <UpdateMethodSelection
                    showMethodSelection={!!isRecurring}
                    updateMethodLabel={updateMethodLabel}
                    relatedEvents={relatedEvents}
                    dateFormat={dateFormat}
                    handleSubmit={handleSubmit} />

            </div>
        )
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string.isRequired,
    change: PropTypes.func,
}

// Decorate the form container
export const UpdateTime = reduxForm({
    form: 'updateTime',
    validate: ChainValidators([EndDateAfterStartDate]),
})(Component)

const selector = formValueSelector('updateTime')

const mapStateToProps = (state) => ({
    relatedEvents: selector(state, '_events' ),
    dateFormat: getDateFormat(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        dispatch(actions.uploadFilesAndSaveEvent(event))
        .then(() => {
            if (get(event, '_publish', false)) {
                dispatch(actions.events.ui.publishEvent(event._id))
            }

            dispatch(actions.hideModal())
        })
    ),
    onHide: (event) => {
        if (event.lock_action === 'update_time') {
            dispatch(actions.events.api.unlock(event))
        }
    },
})

export const UpdateTimeForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(UpdateTime)
