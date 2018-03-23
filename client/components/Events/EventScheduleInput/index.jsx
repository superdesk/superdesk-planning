import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import moment from 'moment';

import {eventUtils, gettext} from '../../../utils';

import {Row, DateTimeInput, LineInput, ToggleInput, Field} from '../../UI/Form';
import {RecurringRulesInput} from '../RecurringRulesInput';

export class EventScheduleInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {isAllDay: false};

        this.onChange = this.onChange.bind(this);
        this.handleAllDayChange = this.handleAllDayChange.bind(this);
        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this);
    }

    componentWillMount() {
        const dates = get(this.props, 'item.dates') || {};

        this.setState({isAllDay: eventUtils.isEventAllDay(dates.start, dates.end)});
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

        const changes = {'dates.start': value};

        if (!startDate) {
            value
                .hour(0)
                .minute(0);
        }

        if (endDate && endDate.isBefore(value)) {
            // If we have an end date set, and the end date is before the new start date
            // then set the end date to be the same as this new start date
            changes['dates.end'] = endDate.clone().add(value.diff(startDate));
        } else if (!endDate) {
            // If we have a new start date with no end date set
            // then set the end date to be 'All Day'
            changes['dates.end'] = value.clone().endOf('day');
        }

        this.props.onChange(changes, null);
    }

    changeStartTime(value) {
        const startDate = get(this.props, 'diff.dates.start');
        const defaultDurationOnChange = get(this.props.formProfile, 'editor.dates.default_duration_on_change', 1);

        const changes = {'dates.start': value};

        if (((startDate && this.state.isAllDay) || !startDate) && defaultDurationOnChange > 0) {
            changes['dates.end'] = value.clone().add(defaultDurationOnChange, 'h');
        }

        this.props.onChange(changes, null);
    }

    changeEndDate(value) {
        const startDate = get(this.props, 'diff.dates.start');
        const changes = {'dates.end': value};

        if (!startDate) {
            // If we have a new end date with no start date set
            // then set the start date to be 'All Day'
            changes['dates.start'] = value.clone().startOf('day');
            changes['dates.end'].endOf('day');
        }
        this.props.onChange(changes, null);
    }

    changeEndTime(value) {
        const endDate = get(this.props, 'diff.dates.end');
        const defaultDurationOnChange = get(this.props.formProfile, 'editor.dates.default_duration_on_change', 1);
        const changes = {'dates.end': value};

        if (((endDate && this.state.isAllDay) || !endDate) && defaultDurationOnChange > 0) {
            changes['dates.start'] = value.clone().subtract(defaultDurationOnChange, 'h');
        }

        this.props.onChange(changes, null);
    }

    componentWillReceiveProps(nextProps) {
        const nextDates = get(nextProps, 'diff.dates') || {};
        const isAllDay = eventUtils.isEventAllDay(nextDates.start, nextDates.end);

        const newState = {};

        if (isAllDay !== this.state.isAllDay) {
            newState.isAllDay = isAllDay;
        }

        this.setState(newState);
    }

    handleAllDayChange(field, value) {
        let newStart;
        let newEnd;

        if (value) {
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
            const dates = get(this.props, 'item.dates', get(this.props, 'diff.dates', {}));

            newStart = get(dates, 'start', moment()).clone();
            newEnd = get(dates, 'end', moment().add(1, 'h')).clone();

            // If the initial values were all day, then set the end minutes to 55
            // So that the allDay toggle is turned off
            if (eventUtils.isEventAllDay(newStart, newEnd)) {
                newEnd.minutes(55);
            }
        }

        this.props.onChange({
            'dates.start': newStart,
            'dates.end': newEnd
        }, null);
    }

    handleDoesRepeatChange(field, value) {
        if (!value) {
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
                    count: 2,
                }
            );
        }
    }

    render() {
        const {
            item,
            diff,
            showRepeat,
            showRepeatToggle,
            timeFormat,
            dateFormat,
            readOnly,
            errors,
            showErrors,
            popupContainer,
        } = this.props;
        const {isAllDay} = this.state;

        const doesRepeat = !!get(diff, 'dates.recurring_rule');

        const fieldProps = {
            item: item,
            diff: diff,
            readOnly: readOnly,
            onChange: this.onChange,
            formProfile: {
                schema: {
                    'dates.start': {required: true},
                    'dates.end': {required: true},
                }
            },
            errors: errors,
            showErrors: showErrors
        };

        const toggleProps = {
            row: false,
            component: ToggleInput,
            readOnly: readOnly,
            className: 'sd-line-input__input',
            labelLeftAuto: true,
            defaultValue: false
        };

        return (
            <div>
                <Field
                    component={DateTimeInput}
                    field="dates.start"
                    label={gettext('From')}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    {...fieldProps}
                />

                <Field
                    component={DateTimeInput}
                    field="dates.end"
                    label={gettext('To')}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    {...fieldProps}
                />

                <Row
                    enabled={!!get(errors, 'dates.range')}
                    noPadding={true}
                >
                    <LineInput invalid={true}
                        message={get(errors, 'dates.range')}
                        readOnly={true} />
                </Row>


                <Row flex={true} className="event-toggle">
                    <Field
                        enabled={showRepeat && showRepeatToggle}
                        onChange={this.handleDoesRepeatChange}
                        field="dates.recurring"
                        label={gettext('Repeat')}
                        value={doesRepeat}
                        {...toggleProps}
                    />

                    <Field
                        onChange={this.handleAllDayChange}
                        field="dates.all_day"
                        label={gettext('All Day')}
                        value={!!isAllDay}

                        {...toggleProps}
                    />
                </Row>

                {showRepeat && doesRepeat && (
                    <RecurringRulesInput
                        onChange={this.onChange}
                        schedule={diff || {}}
                        dateFormat={dateFormat}
                        readOnly={readOnly}
                        errors={get(errors, 'dates.recurring_rule')}
                        popupContainer={popupContainer}
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
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    dirty: PropTypes.bool,
    formProfile: PropTypes.object,
    popupContainer: PropTypes.func,
};

EventScheduleInput.defaultProps = {
    readOnly: false,
    showRepeat: true,
    showRepeatSummary: true,
    showRepeatToggle: true
};
