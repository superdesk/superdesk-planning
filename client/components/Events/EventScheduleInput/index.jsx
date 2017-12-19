import React from 'react';
import PropTypes from 'prop-types';
import {get, isNil, isEqual} from 'lodash';
import moment from 'moment';

import {eventUtils} from '../../../utils';
import {eventValidators} from '../../../validators';

import {Toggle} from '../../UI';
import {Row, DateTimeInput, Label, LineInput} from '../../UI/Form';
import {RecurringRulesInput} from '../RecurringRulesInput';

export class EventScheduleInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            doesRepeat: false,
            recurringRuleEdited: false,
            isAllDay: false,
            error: null,
        };

        this.onChange = this.onChange.bind(this);
        this.handleAllDayChange = this.handleAllDayChange.bind(this);
        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this);
    }

    componentWillMount() {
        const dates = get(this.props, 'item.dates');
        const validation = eventValidators.validateEventDates(dates,
            this.props.maxRecurrentEvents);

        this.setState({
            doesRepeat: !isNil(get(dates, 'recurring_rule.frequency')),
            recurringRuleEdited: false,
            isAllDay: eventUtils.isEventAllDay(dates.start, dates.end),
            error: validation.hasErrors ? validation.data : null
        });
    }

    onChange(field, value) {
        if (field === 'dates.start.date') {
            this.changeStartDate(value);
        } else if (field === 'dates.start.time') {
            this.changeStartTime(value);
        } else if (field === 'dates.end.date') {
            this.changeEndDate(value);
        } else if (field === 'dates.end.time') {
            this.changeEndTime(value);
        } else if (field === 'dates.recurring_rule.count' && !value) {
            // Count is an integer. So set it to null, not to ''
            this.props.onChange(field, null);
        } else {
            this.props.onChange(field, value);
        }
    }

    changeStartDate(value) {
        const startDate = get(this.props, 'diff.dates.start');
        const endDate = get(this.props, 'diff.dates.end');

        if (!startDate) {
            value
                .hour(0)
                .minute(0);
        }

        if (endDate && endDate.isBefore(value)) {
            // If we have an end date set, and the end date is before the new start date
            // then set the end date to be the same as this new start date

            this.props.onChange(
                'dates.end',
                endDate
                    .clone()
                    .add(value.diff(startDate))
            );
        } else if (!endDate) {
            // If we have a new start date with no end date set
            // then set the end date to be 'All Day'
            this.props.onChange(
                'dates.end',
                value.clone().endOf('day')
            );
        }

        this.props.onChange('dates.start', value);
    }

    changeStartTime(value) {
        const startDate = get(this.props, 'diff.dates.start');

        if ((startDate && this.state.isAllDay) || !startDate) {
            this.props.onChange(
                'dates.end',
                value.clone().add(1, 'h')
            );
        }

        this.props.onChange('dates.start', value);
    }

    changeEndDate(value) {
        const startDate = get(this.props, 'diff.dates.start');

        if (!startDate) {
            // If we have a new end date with no start date set
            // then set the start date to be 'All Day'
            this.props.onChange(
                'dates.start',
                value.clone().startOf('day')
            );
            value.endOf('day');
        }
        this.props.onChange('dates.end', value);
    }

    changeEndTime(value) {
        const endDate = get(this.props, 'diff.dates.end');

        if ((endDate && this.state.isAllDay) || !endDate) {
            this.props.onChange(
                'dates.start',
                value.clone().subtract(1, 'h')
            );
        }

        this.props.onChange('dates.end', value);
    }

    componentWillReceiveProps(nextProps) {
        const nextDates = get(nextProps, 'diff.dates') || {};

        const doesRepeat = !isNil(get(nextDates, 'recurring_rule.frequency'));
        const recurringRuleNextState = this.getNextRecurringRuleState(nextProps);

        const isAllDay = eventUtils.isEventAllDay(nextDates.start, nextDates.end);
        const validation = eventValidators.validateEventDates(nextDates,
            nextProps.maxRecurrentEvents);

        const newState = {};

        if (isAllDay !== this.state.isAllDay) {
            newState.isAllDay = isAllDay;
        }

        if (doesRepeat || this.state.recurringRuleEdited !== recurringRuleNextState) {
            newState.doesRepeat = true;
            newState.recurringRuleEdited = recurringRuleNextState;
        }

        newState.error = validation.hasErrors ? validation.data : null;

        this.setState(newState);
    }

    getNextRecurringRuleState(nextProps) {
        const recurringRuleFields = [
            'dates.start',
            'dates.end',
            'dates.recurring_rule'
        ];

        // Return true if any recurring-rules field got changes
        return recurringRuleFields.some(
            (field) => !isEqual(
                get(nextProps.diff, field),
                get(this.props.item, field)
            )
        );
    }

    handleAllDayChange(event) {
        let newStart;
        let newEnd;

        if (event.target.value) {
            // If allDay is enabled, then set the event to all day
            newStart = get(this.props, 'diff.dates.start', moment())
                .clone()
                .startOf('day');
            newEnd = get(this.props, 'diff.dates.end', moment())
                .clone()
                .endOf('day');
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save
            newStart = get(this.props, 'item.dates.start', moment()).clone();
            newEnd = get(this.props, 'item.dates.end', moment()).clone();

            // If the initial values were all day, then set the end minutes to 55
            // So that the allDay toggle is turned off
            if (eventUtils.isEventAllDay(newStart, newEnd)) {
                newEnd.minutes(55);
            }
        }

        this.onChange('dates.start', newStart);
        this.onChange('dates.end', newEnd);
    }

    handleDoesRepeatChange(event) {
        if (!event.target.value) {
            // If unchecked, remove the recurring rules
            this.onChange(
                'dates.recurring_rule',
                null
            );
        } else {
            // If checked, set default recurring rule
            this.onChange(
                'dates.recurring_rule',
                {
                    frequency: 'DAILY',
                    interval: 1,
                    endRepeatMode: 'count',
                    count: 1,
                }
            );
        }

        // Update the state to hide the recurrent date form
        this.setState({doesRepeat: event.target.value});
    }

    render() {
        const {diff, showRepeat, showRepeatToggle, timeFormat, dateFormat, readOnly} = this.props;
        const {doesRepeat, isAllDay, error} = this.state;

        return (
            <div>
                <DateTimeInput
                    field="dates.start"
                    label="From"
                    value={get(diff, 'dates.start', null)}
                    onChange={this.onChange}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    readOnly={readOnly}
                />

                <DateTimeInput
                    field="dates.end"
                    label="To"
                    value={get(diff, 'dates.end', null)}
                    onChange={this.onChange}
                    invalid={get(error, 'dates.end', false)}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    readOnly={readOnly}
                />
                {get(error, 'dates.end', false) && <Row>
                    <LineInput invalid={true}
                        message={error.dates.end}
                        readOnly={true} />
                </Row>}

                <Row flex={true} className="event-toggle">
                    <Label text=" " row={true} />

                    {showRepeat && showRepeatToggle && (
                        <LineInput labelLeftAuto={true} readOnly={readOnly}>
                            <Label text="Repeat" />
                            <Toggle
                                value={doesRepeat}
                                onChange={this.handleDoesRepeatChange}
                                readOnly={readOnly}
                                className="sd-line-input__input"
                            />
                        </LineInput>
                    )}

                    <LineInput labelLeftAuto={true} readOnly={readOnly}>
                        <Label text="All Day" />
                        <Toggle
                            value={isAllDay}
                            onChange={this.handleAllDayChange}
                            readOnly={readOnly}
                            className="sd-line-input__input"
                        />
                    </LineInput>
                </Row>

                {showRepeat && doesRepeat && (
                    <RecurringRulesInput
                        onChange={this.onChange}
                        schedule={diff || {}}
                        dateFormat={dateFormat}
                        readOnly={readOnly}
                        error={get(error, 'dates.recurring_rule')}
                    />
                )}
            </div>
        );
    }
}

EventScheduleInput.propTypes = {
    item: PropTypes.object.isRequired,
    diff: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    showRepeat: PropTypes.bool,
    showRepeatSummary: PropTypes.bool,
    showRepeatToggle: PropTypes.bool,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    maxRecurrentEvents: PropTypes.number.isRequired,
};

EventScheduleInput.defaultProps = {
    readOnly: false,
    showRepeat: true,
    showRepeatSummary: true,
    showRepeatToggle: true
};
