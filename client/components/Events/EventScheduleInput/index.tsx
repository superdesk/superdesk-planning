import React from 'react';
import moment from 'moment';

import {IEventItem, IEventFormProfile} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {eventUtils, timeUtils} from '../../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

import {Row, DateTimeInput, LineInput, ToggleInput, Field, TimeZoneInput} from '../../UI/Form';
import {RecurringRulesInput} from '../RecurringRulesInput';

interface IProps {
    item: IEventItem;
    diff: Partial<IEventItem>;
    readOnly: boolean;
    errors?: {[key: string]: any};
    showErrors?: boolean;
    formProfile: IEventFormProfile;
    showRepeat?: boolean; // defaults to true
    showRepeatToggle?: boolean; // defaults to true
    showFirstEventLabel?: boolean; // defaults to true
    showTimeZone?: boolean;

    onChange(field: string | {[key: string]: any}, value: any): void;
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    refNode?(node: HTMLElement): void;
}

interface IState {
    isAllDay: boolean;
    isMultiDay: boolean;
}

export class EventScheduleInput extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        const dates = this.props.item?.dates ?? {};

        this.state = {
            isAllDay: eventUtils.isEventAllDay(dates.start, dates.end, true),
            isMultiDay: !eventUtils.isEventSameDay(dates.start, dates.end),
        };

        this.onChange = this.onChange.bind(this);
        this.handleAllDayChange = this.handleAllDayChange.bind(this);
        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this);
        this.handleToBeConfirmed = this.handleToBeConfirmed.bind(this);
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
        const dates = this.props.diff?.dates ?? {};
        const _startTime = this.props.diff?._startTime;
        const _endTime = this.props.diff?._endTime;
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
        const startDate = this.props.diff?.dates?.start != null ? moment(this.props.diff.dates.start) : null;
        const endDate = this.props.diff?.dates?.end != null ? moment(this.props.diff.dates.end) : null;
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

        const startDate = this.props.diff?.dates?.start;
        const _startTime = this.props.diff?._startTime;
        const defaultDurationOnChange = this.props.formProfile?.editor?.dates?.default_duration_on_change ?? 1;
        const newStartDate = !startDate ?
            value :
            moment(startDate)
                .hour(value.hour())
                .minute(value.minute())
                .second(value.second());

        const changes = {'dates.start': newStartDate};

        if (((_startTime && this.state.isAllDay) || !_startTime) &&
            defaultDurationOnChange > 0 &&
            !this.state.isMultiDay
        ) {
            changes['dates.end'] = newStartDate.clone().add(defaultDurationOnChange, 'h');
            changes['_endTime'] = changes['dates.end'].clone();
        }
        changes['_startTime'] = newStartDate;
        this.setToBeConfirmed(changes);
        this.props.onChange(changes, null);
    }

    changeEndDate(value) {
        const startDate = this.props.diff?.dates?.start;
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

        const endDate = this.props.diff?.dates?.end != null ? moment(this.props.diff.dates.end) : null;
        const _endTime = this.props.diff?._endTime;
        const defaultDurationOnChange = this.props.formProfile?.editor?.dates?.default_duration_on_change ?? 1;
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
        this.setToBeConfirmed(changes);
        this.props.onChange(changes, null);
    }

    setToBeConfirmed(changes) {
        if ((changes['_startTime'] || this.props.diff._startTime) &&
            (changes['_endTime'] || this.props.diff._endTime)) {
            changes[TO_BE_CONFIRMED_FIELD] = false;
        }
    }

    componentWillReceiveProps(nextProps: Readonly<IProps>) {
        const nextDates = nextProps.diff?.dates ?? {};
        const isAllDay = eventUtils.isEventAllDay(nextDates.start, nextDates.end, true);
        const isMultiDay = !eventUtils.isEventSameDay(nextDates.start, nextDates.end);

        const newState: Partial<IState> = {};

        if (isAllDay !== this.state.isAllDay) {
            newState.isAllDay = isAllDay;
        }

        if (isMultiDay !== this.state.isMultiDay) {
            newState.isMultiDay = isMultiDay;
        }

        if (Object.keys(newState).length) {
            this.setState({
                ...this.state,
                ...newState,
            });
        }
    }

    handleAllDayChange(field, value) {
        const dates = this.props.diff?.dates ?? this.props.item?.dates ?? {};
        let newStart, newEnd, startTime = null, endTime = null;

        newStart = moment((dates.start || (dates.tz ? moment.tz(dates.tz) : moment())))
            .startOf('day');

        if (value) {
            // If allDay is enabled, then set the event to all day
            newEnd = moment(dates.end || (dates.tz ? moment.tz(dates.tz) : moment()))
                .endOf('day');
            startTime = newStart.clone();
            endTime = newEnd.clone();
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save and time to empty
            newEnd = moment(dates?.end || newStart)
                .hour(0)
                .minute(1);
        }

        this.props.onChange({
            'dates.start': newStart,
            'dates.end': newEnd,
            _startTime: startTime,
            _endTime: endTime,
            [TO_BE_CONFIRMED_FIELD]: false,
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

    handleToBeConfirmed(field) {
        this.props.onChange({
            [TO_BE_CONFIRMED_FIELD]: true,
            _startTime: this.props.diff?._startTime,
            _endTime: this.props.diff?._endTime,
        }, null);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            diff,
            showRepeat = true,
            showRepeatToggle = true,
            readOnly,
            errors,
            showErrors,
            popupContainer,
            showFirstEventLabel = true,
            onPopupOpen,
            onPopupClose,
            showTimeZone,
            refNode,
            formProfile,
        } = this.props;
        const {isAllDay} = this.state;

        const doesRepeat = diff?.dates?.recurring_rule != null;

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
                        readOnly={readOnly}
                        errors={errors?.dates?.recurring_rule}
                        popupContainer={popupContainer}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                    />
                )}

                <Field
                    component={DateTimeInput}
                    field="dates.start"
                    label={doesRepeat && showFirstEventLabel ? gettext('First Event Starts') : gettext('Event Starts')}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    hideTime={isAllDay}
                    halfWidth={isAllDay}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField="_startTime"
                    remoteTimeZone={diff?.dates?.tz}
                    allowInvalidTime
                    isLocalTimeZoneDifferent={isRemoteTimeZone}
                    refNode={refNode}
                    showToBeConfirmed
                    onToBeConfirmed={this.handleToBeConfirmed}
                    toBeConfirmed={diff?._time_to_be_confirmed}
                />

                <Field
                    component={DateTimeInput}
                    field="dates.end"
                    label={doesRepeat && showFirstEventLabel ? gettext('First Event Ends') : gettext('Event Ends')}
                    row={false}
                    defaultValue={null}
                    popupContainer={popupContainer}
                    hideTime={isAllDay}
                    halfWidth={isAllDay}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField="_endTime"
                    remoteTimeZone={diff?.dates?.tz}
                    allowInvalidTime
                    isLocalTimeZoneDifferent={isRemoteTimeZone}
                    showToBeConfirmed
                    onToBeConfirmed={this.handleToBeConfirmed}
                    toBeConfirmed={diff?._time_to_be_confirmed}
                />

                <Row flex={true} noPadding>
                    {!(formProfile?.editor?.dates?.all_day?.enabled ?? true) ? null : (
                        <Field
                            onChange={this.handleAllDayChange}
                            field="dates.all_day"
                            label={gettext('All Day')}
                            value={isAllDay}

                            {...toggleProps}
                        />
                    )}
                    {!showTimeZone ? null : (
                        <Field
                            field="dates.tz"
                            label={gettext('Timezone')}
                            component={TimeZoneInput}
                            onChange={this.onChange}
                            row={false}
                            {...fieldProps}
                            halfWidth={formProfile?.editor?.dates?.all_day?.enabled}
                        />
                    )}
                </Row>

                <Row
                    enabled={errors?.dates?.range != null}
                    noPadding={true}
                >
                    <LineInput
                        invalid={true}
                        message={errors?.dates?.range}
                        readOnly={true}
                    />
                </Row>
            </div>
        );
    }
}
