import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector } from 'redux-form'
import * as actions from '../../../actions'
import '../style.scss'
import { get } from 'lodash'
import { ChainValidators, EndDateAfterStartDate } from '../../../validators'
import { EventScheduleForm, EventScheduleSummary } from '../../index'
import moment from 'moment'

export class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        this.props.change('dates.recurring_rule',
            {
                frequency: 'YEARLY',
                interval: 1,
            })
    }

    onFromTimeChange(value) {
        this.props.change('dates.start', value)
    }

    onToTimeChange(value) {
        this.props.change('dates.end', value)
    }

    render() {
        const { handleSubmit, initialValues, currentSchedule, change } = this.props

        let event = initialValues
        event.dates.start = moment(event.dates.start)
        event.dates.end = moment(event.dates.end)

        return (
            <div className='EventActionConfirmation'>
                <form onSubmit={handleSubmit}>
                    <div className="metadata-view">
                        <dl>
                            { event.slugline && (<dt>Slugline:</dt>) }
                            { event.slugline && (<dd>{ event.slugline }</dd>) }
                            { event.name && (<dt>Name:</dt>) }
                            { event.name && (<dd>{ event.name }</dd>) }
                        </dl>
                    </div>

                    <EventScheduleSummary schedule={currentSchedule}/>

                    <EventScheduleForm
                        readOnly={false}
                        currentSchedule={currentSchedule}
                        initialSchedule={event.dates}
                        change={change}
                        showRepeat={true}
                        showRepeatToggle={false} />

                </form>
            </div>
        )
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    change: PropTypes.func,
    currentSchedule: PropTypes.object,
}

// Decorate the form container
export const UpdateTime = reduxForm({
    form: 'addEvent',
    validate: ChainValidators([EndDateAfterStartDate]),
})(Component)

const selector = formValueSelector('addEvent')

const mapStateToProps = (state) => ({
    relatedEvents: selector(state, '_events' ),
    currentSchedule: selector(state, 'dates'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        dispatch(actions.uploadFilesAndSaveEvent(event))
        .then(() => {
            if (get(event, '_publish', false)) {
                dispatch(actions.publishEvent(event._id))
            }

            dispatch(actions.hideModal())
        })
    ),
    onHide: (event) => {
        if (event.lock_action === 'convert_recurring') {
            dispatch(actions.events.api.unlock(event))
        }
    },
})

export const ConvertToRecurringEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(UpdateTime)
