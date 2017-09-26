import React from 'react'
import PropTypes from 'prop-types'
import { fieldRenders } from '../EventForm/fieldRenders'
import { Toggle, RepeatEventForm } from '../index'
import { eventUtils } from '../../utils'
import { get, isNil, isEqual } from 'lodash'
import moment from 'moment'

export class EventScheduleForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            doesRepeat: !isNil(get(props, 'currentSchedule.recurring_rule.frequency')),
            recurringRuleEdited: false,
            isAllDay: eventUtils.isEventAllDay(
                get(props, 'currentSchedule.start'),
                get(props, 'currentSchedule.end')
            ),
            overlaps: eventUtils.doesRecurringEventsOverlap(
                get(props, 'currentSchedule.start'),
                get(props, 'currentSchedule.end'),
                get(props, 'currentSchedule.recurring_rule', {})
            ),
        }

        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this)
        this.handleAllDayChange = this.handleAllDayChange.bind(this)
    }

    componentWillReceiveProps(nextProps) {
        const doesRepeat = !isNil(get(nextProps.currentSchedule, 'recurring_rule.frequency'))
        const recurringRuleNextState = this.getNextRecurringRuleState(nextProps)

        const isAllDay = eventUtils.isEventAllDay(
            get(nextProps, 'currentSchedule.start'),
            get(nextProps, 'currentSchedule.end')
        )

        const wasAllDay = eventUtils.isEventAllDay(
            get(this.props, 'currentSchedule.start'),
            get(this.props, 'currentSchedule.end')
        )

        if (isAllDay !== this.state.isAllDay) {
            this.setState({ isAllDay })
        }

        const overlaps = eventUtils.doesRecurringEventsOverlap(
            get(nextProps, 'currentSchedule.start'),
            get(nextProps, 'currentSchedule.end'),
            get(nextProps, 'currentSchedule.recurring_rule', {})
        )

        if (overlaps !== this.state.overlaps) {
            this.setState({ overlaps })
        }

        if (doesRepeat || this.state.recurringRuleEdited !== recurringRuleNextState) {
            this.setState({
                doesRepeat: true,
                recurringRuleEdited: recurringRuleNextState,
            })
        }

        const oldStartDate = get(this.props, 'currentSchedule.start')
        const newStartDate = get(nextProps, 'currentSchedule.start')
        const newEndDate = get(nextProps, 'currentSchedule.end')

        if (!this.props.initialSchedule) {
            // This should only occur when creating a new Event
            if (newStartDate && !newEndDate) {
                // If we have a new start date with no end date set,
                // then set the end date to be 'All Day'
                this.props.change('dates.end', moment(newStartDate).clone().endOf('day'))
            } else if (wasAllDay && !isAllDay && !oldStartDate.isSame(newStartDate, 'minute')) {
                // Otherwise if only the time has been changed for the startDate
                // then set the end time to be 1 hour after the start time
                this.props.change('dates.end', moment(newStartDate).clone().add(1, 'h'))
            }
        } else {
            // This should only occur when performing an action on an Event
            if (wasAllDay && !isAllDay && !oldStartDate.isSame(newStartDate, 'minute')) {
                // If only the time has been changed for the startDate
                // then set the end time to be 1 hour after the start time
                this.props.change('dates.end', moment(newStartDate).clone().add(1, 'h'))
            }
        }
    }

    getNextRecurringRuleState(nextProps) {
        const recurringRuleFields = [
            'start',
            'end',
            'recurring_rule',
        ]

        // CTRL-Z was done to bring form back to pristine: reset its state value
        if (nextProps.pristine || !get(this.props.initialSchedule, 'recurring_rule') ||
            !nextProps.doesRepeat)
            return false

        // Return true if any recurring-rules field got changed
        return recurringRuleFields.some((field) => {
            if (!isEqual(get(nextProps.currentSchedule, field), get(this.props.initialSchedule, field))) {
                return true
            }
        })
    }

    handleAllDayChange(event) {
        let newStart
        let newEnd

        if (event.target.value) {
            // If allDay is enabled, then set the event to all day
            newStart = get(this.props.currentSchedule, 'start', moment()).clone().startOf('day')
            newEnd = get(this.props.currentSchedule, 'end', moment()).clone().endOf('day')
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save
            newStart = get(this.props, 'initialSchedule.start', moment()).clone()
            newEnd = get(this.props, 'initialSchedule.end', moment()).clone()

            // If the initial values were all day, then set the end minutes to 55
            // So that the allDay toggle is turned off
            if (eventUtils.isEventAllDay(newStart, newEnd)) {
                newEnd.minutes(55)
            }
        }

        this.props.change('dates.start', newStart)
        this.props.change('dates.end', newEnd)
    }

    handleDoesRepeatChange(event) {
        // let doesRepeat = !event.target.value
        if (!event.target.value) {
            // if unchecked, remove the recurring rules
            this.props.change('dates.recurring_rule', null)
        } else {
            // if checked, set default recurring rule
            this.props.change('dates.recurring_rule',
                {
                    frequency: 'YEARLY',
                    interval: 1,
                })
        }
        // update the state to hide the recurrent date form
        this.setState({ doesRepeat: event.target.value })
    }

    render() {
        const {
            readOnly,
            currentSchedule,
            showRepeat,
            showRepeatSummary,
            showRepeatToggle,
        } = this.props
        const { doesRepeat, isAllDay, overlaps } = this.state

        const RepeatEventFormProps = {
            ...this.props,
            showRepeatSummary,
            schedule: currentSchedule,
        }

        return <div>
            {fieldRenders.renderDate(
                readOnly,
                true,
                overlaps
            )}
            {fieldRenders.renderDate(
                readOnly,
                false,
                overlaps
            )}

            <label className="form__row form__row--flex">
                {(showRepeat && showRepeatToggle) ? (
                    <div className="form__row--item" style={{ width: '50%' }}>
                        <Toggle
                            name="doesRepeat"
                            value={doesRepeat}
                            onChange={this.handleDoesRepeatChange}
                            readOnly={readOnly}/>
                        <span className="sd-line-input__label">
                            Repeat
                        </span>
                    </div>
                ) : (
                    <div className="form__row--item" style={{ width: '50%' }} />
                )}

                <div className="form__row--item">
                    <span className="sd-line-input__label">All Day</span>
                    <Toggle
                        value={isAllDay}
                        onChange={this.handleAllDayChange}
                        readOnly={readOnly}/>
                </div>
            </label>

            {showRepeat && doesRepeat &&
                // as <RepeatEventForm/> contains fields, we provide the props in this form
                // see http://redux-form.com/6.2.0/docs/api/Props.md
                <RepeatEventForm { ...RepeatEventFormProps } />
            }
        </div>
    }
}

EventScheduleForm.propTypes = {
    readOnly: PropTypes.bool.isRequired,
    currentSchedule: PropTypes.object,
    initialSchedule: PropTypes.object,
    change: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    pristine: PropTypes.bool,
    showRepeat: PropTypes.bool,
    showRepeatSummary: PropTypes.bool,
    showRepeatToggle: PropTypes.bool,
}

EventScheduleForm.defaultProps = {
    showRepeat: true,
    showRepeatSummary: true,
    showRepeatToggle: true,
}
