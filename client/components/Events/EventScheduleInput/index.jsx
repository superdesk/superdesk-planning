import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import moment from 'moment';

import {eventUtils, gettext, timeUtils} from '../../../utils';

import {Row, DateTimeInput, LineInput, ToggleInput, Field, TimeZoneInput} from '../../UI/Form';
import {RecurringRulesInput} from '../RecurringRulesInput';

export class EventScheduleInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isAllDay: false,
            isMultiDay: false,
        };

        this.onChange = this.onChange.bind(this);
        this.handleAllDayChange = this.handleAllDayChange.bind(this);
        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this);
    }

    componentWillMount() {
        const dates = get(this.props, 'item.dates') || {};

        this.setState({
            isAllDay: eventUtils.isEventAllDay(dates.start, dates.end, true),
            isMultiDay: !eventUtils.isEventSameDay(dates.start, dates.end),
        });
    }

    onChange(field, value) {
        if (field === 'dates.start.date') {
            this.changeStartDate(value);
        } else if (field === '_startTime') {
            this.changeStartTime(value);
        } else if (field === 'dates.end.date') {
            this.changeEndDate(value);
        } else if (field === '_endTime') {
            this.changeEndTime(value);
        } else if (field === 'dates.recurring_rule.count' && !value) {
            // Count is an integer. So set it to null, not to ''
            this.props.onChange(field, null);
        } else if (field === 'dates.recurring_rule.until' && moment.isMoment(value)) {
            this.props.onChange(field, value.endOf('day'));
        } else if (field === 'dates.tz') {
            this.changeTimezone(value);
        } else {
            this.props.onChange(field, value);
        }
    }

    changeTimezone(value) {
        const dtFormat = 'DD/MM/YYYY HH:mm';
        const dates = get(this.props, 'diff.dates', {});
        const _startTime = get(this.props, 'diff._startTime');
        const _endTime = get(this.props, 'diff._endTime');

        let changes = {'dates.tz': value};

        const addChange = (field, fieldValue) => {
            if (!fieldValue) {
                return;
            }

            changes[field] = value ?
                moment.tz(fieldValue.format(dtFormat), dtFormat, value) :
                moment(fieldValue);
        };

        addChange('dates.start', dates.start);
        addChange('_startTime', _startTime);
        addChange('dates.end', dates.end);
        addChange('_endTime', _endTime);

        this.props.onChange(changes, null);
    }

    changeStartDate(value) {
        const startDate = get(this.props, 'diff.dates.start');
        const endDate = get(this.props, 'diff.dates.end');

        const changes = {'dates.start': value};

        if (!startDate) {
            value
                .hour(0)
                .minute(0);
        } else {
            value
                .hour(startDate.hour())
                .minute(startDate.minute());
        }

        if (!endDate || endDate.isBefore(value)) {
            // If we have an end date set, and the end date is before the new start date
            // then set the end date to be the same as this new start date
            changes['dates.end'] = (endDate || value).clone().add(value.diff(startDate));
        }

        this.props.onChange(changes, null);
    }

    changeStartTime(value) {
        if (!value) {
            this.props.onChange('_startTime', null);
            return;
        }

        const startDate = get(this.props, 'diff.dates.start');
        const _startTime = get(this.props, 'diff._startTime');
        const defaultDurationOnChange = get(this.props.formProfile, 'editor.dates.default_duration_on_change', 1);
        const newStartDate = startDate ? startDate.hour(value.hour()).minute(value.minute()) : value;

        const changes = {'dates.start': newStartDate};

        if (((_startTime && this.state.isAllDay) || !_startTime) &&
            defaultDurationOnChange > 0 &&
            !this.state.isMultiDay
        ) {
            changes['dates.end'] = newStartDate.clone().add(defaultDurationOnChange, 'h');
            changes['_endTime'] = changes['dates.end'].clone();
        }
        changes['_startTime'] = newStartDate;
        this.props.onChange(changes, null);
    }

    changeEndDate(value) {
        const startDate = get(this.props, 'diff.dates.start');
        const changes = {'dates.end': value};

        if (!startDate) {
            // If we have a new end date with no start date set
            // then set the start date as well
            changes['dates.start'] = value.clone().startOf('day');
        }
        this.props.onChange(changes, null);
    }

    changeEndTime(value) {
        if (!value) {
            this.props.onChange('_endTime', null);
            return;
        }

        const endDate = get(this.props, 'diff.dates.end');
        const _endTime = get(this.props, 'diff._endTime');
        const defaultDurationOnChange = get(this.props.formProfile, 'editor.dates.default_duration_on_change', 1);
        const newEndDate = endDate ? endDate.hour(value.hour()).minute(value.minute()) : value;
        const changes = {'dates.end': newEndDate};

        if (((_endTime && this.state.isAllDay) || !_endTime)
            && defaultDurationOnChange > 0 &&
            !this.state.isMultiDay
        ) {
            changes['dates.start'] = newEndDate.clone().subtract(defaultDurationOnChange, 'h');
            changes['_startTime'] = changes['dates.start'].clone();
        }
        changes['_endTime'] = newEndDate;
        this.props.onChange(changes, null);
    }

    componentWillReceiveProps(nextProps) {
        const nextDates = get(nextProps, 'diff.dates') || {};
        const isAllDay = eventUtils.isEventAllDay(nextDates.start, nextDates.end, true);
        const isMultiDay = !eventUtils.isEventSameDay(nextDates.start, nextDates.end);

        const newState = {};

        if (isAllDay !== this.state.isAllDay) {
            newState.isAllDay = isAllDay;
        }

        if (isMultiDay !== this.state.isMultiDay) {
            newState.isMultiDay = isMultiDay;
        }

        this.setState(newState);
    }

    handleAllDayChange(field, value) {
        const dates = get(this.props, 'diff.dates', get(this.props, 'item.dates', {}));
        let newStart, newEnd, startTime = null, endTime = null;

        newStart = (dates.start || (dates.tz ? moment.tz(dates.tz) : moment()))
            .clone()
            .startOf('day');

        if (value) {
            // If allDay is enabled, then set the event to all day
            newEnd = (dates.end || (dates.tz ? moment.tz(dates.tz) : moment()))
                .clone()
                .endOf('day');
            startTime = newStart.clone();
            endTime = newEnd.clone();
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save and time to empty
            newEnd = (get(dates, 'end') || newStart.clone()).hour(0).minute(1);
        }

        this.props.onChange({
            'dates.start': newStart,
            'dates.end': newEnd,
            _startTime: startTime,
            _endTime: endTime,
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
                    endRepeatMode: 'until',
                    until: null,
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
            showFirstEventLabel,
            onPopupOpen,
            onPopupClose,
            showTimeZone,
            refNode,
            formProfile,
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
                    'dates.tz': {required: true},
                },
            },
            errors: errors,
            showErrors: showErrors,
        };

        const toggleProps = {
            row: false,
            component: ToggleInput,
            readOnly: readOnly,
            className: 'sd-line-input__input',
            labelLeftAuto: true,
            defaultValue: false,
        };
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(diff);

        return (
            <div>
                <Row flex={true}>
                    <Field
                        enabled={showRepeat && showRepeatToggle}
                        onChange={this.handleDoesRepeatChange}
                        field="dates.recurring"
                        label={gettext('Repeats')}
                        value={doesRepeat}
                        {...toggleProps}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                    />
                </Row>

                {showRepeat && doesRepeat && (
                    <RecurringRulesInput
                        onChange={this.onChange}
                        schedule={diff.dates || {}}
                        dateFormat={dateFormat}
                        readOnly={readOnly}
                        errors={get(errors, 'dates.recurring_rule')}
                        popupContainer={popupContainer}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                    />
                )}

                <Field
                    component={DateTimeInput}
                    field="dates.start"
                    label={ doesRepeat && showFirstEventLabel ? gettext('First Event Starts') : gettext('Event Starts')}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    hideTime={isAllDay}
                    halfWidth={isAllDay}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField="_startTime"
                    remoteTimeZone={get(diff, 'dates.tz')}
                    allowInvalidTime
                    isLocalTimeZoneDifferent={isRemoteTimeZone}
                    refNode={refNode}
                />

                <Field
                    component={DateTimeInput}
                    field="dates.end"
                    label={ doesRepeat && showFirstEventLabel ? gettext('First Event Ends') : gettext('Event Ends')}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    hideTime={isAllDay}
                    halfWidth={isAllDay}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField="_endTime"
                    remoteTimeZone={get(diff, 'dates.tz')}
                    allowInvalidTime
                    isLocalTimeZoneDifferent={isRemoteTimeZone}
                />

                <Row flex={true} noPadding>
                    {get(formProfile, 'editor.dates.all_day.enabled') && <Field
                        onChange={this.handleAllDayChange}
                        field="dates.all_day"
                        label={gettext('All Day')}
                        value={isAllDay}

                        {...toggleProps}
                    />}
                    {showTimeZone && <Field
                        field="dates.tz"
                        label={gettext('Timezone')}
                        component={TimeZoneInput}
                        onChange={this.onChange}
                        row={false}
                        {...fieldProps}
                        halfWidth={get(formProfile, 'editor.dates.all_day.enabled')} />}
                </Row>

                <Row
                    enabled={!!get(errors, 'dates.range')}
                    noPadding={true}
                >
                    <LineInput invalid={true}
                        message={get(errors, 'dates.range')}
                        readOnly={true} />
                </Row>
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
    showFirstEventLabel: PropTypes.bool,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    showTimeZone: PropTypes.bool,
    refNode: PropTypes.func,
};

EventScheduleInput.defaultProps = {
    readOnly: false,
    showRepeat: true,
    showRepeatSummary: true,
    showRepeatToggle: true,
    showFirstEventLabel: true,
    showTimeZone: false,
};
