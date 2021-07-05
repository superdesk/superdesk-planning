import * as React from 'react';
import moment from 'moment-timezone';

import {IEditorFieldProps, IEventFormProfile, IEventItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Switch} from 'superdesk-ui-framework/react';

import {EditorFieldEndDateTime} from './EndDateTime';
import {EditorFieldStartDateTime} from './StartDateTime';
import {Row, TimeZoneInput} from '../../UI/Form';
import {eventUtils} from '../../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    canClear?: boolean;
    showAllDay?: boolean;
    showTimeZone?: boolean;
    profile: IEventFormProfile;
}

export class EditorFieldEventSchedule extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.changeSchedule = this.changeSchedule.bind(this);
        this.onAllDayChange = this.onAllDayChange.bind(this);
        this.changeTimezone = this.changeTimezone.bind(this);
    }

    changeSchedule(field: string, value: moment.Moment) {
        if (field === 'dates.start.date') {
            this.changeStartDate(value);
        } else if (field === '_startTime') {
            this.changeStartTime(value);
        } else if (field === 'dates.end.date') {
            this.changeEndDate(value);
        } else if (field === '_endTime') {
            this.changeEndTime(value);
        }
    }

    changeStartDate(value: moment.Moment) {
        const startDate = this.props.item?.dates?.start != null ?
            moment(this.props.item.dates.start) :
            null;
        const endDate = this.props.item?.dates?.end != null ?
            moment(this.props.item.dates.end) :
            null;
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

        if (endDate == null || endDate.isBefore(value)) {
            // If we have an end date set, and the end date is before the new start date
            // then set the end date to be the same as this new start date
            changes['dates.end'] = (endDate || value).clone().add(value.diff(startDate));
        }

        this.props.onChange(changes, null);
    }

    changeStartTime(value?: moment.Moment) {
        if (!value) {
            this.props.onChange('_startTime', null);
            return;
        }

        const startDate = this.props.item?.dates?.start;
        const endDate = this.props.item?.dates?.end;
        const _startTime = this.props.item?._startTime;
        const defaultDurationOnChange = this.props.profile?.editor?.dates?.default_duration_on_change ?? 1;
        const isAllDay = eventUtils.isEventAllDay(startDate, endDate, true);
        const isMultiDay = !eventUtils.isEventSameDay(startDate, endDate);
        const newStartDate = !startDate ?
            value :
            moment(startDate)
                .hour(value.hour())
                .minute(value.minute())
                .second(value.second());

        const changes = {'dates.start': newStartDate};

        if (((_startTime && isAllDay) || !_startTime) &&
            defaultDurationOnChange > 0 &&
            !isMultiDay
        ) {
            changes['dates.end'] = newStartDate.clone().add(defaultDurationOnChange, 'h');
            changes['_endTime'] = changes['dates.end'].clone();
        }
        changes['_startTime'] = newStartDate;
        this.setToBeConfirmed(changes);
        this.props.onChange(changes, null);
    }

    changeEndDate(value: moment.Moment) {
        const startDate = this.props.item?.dates?.start;
        const changes = {'dates.end': value};

        if (!startDate) {
            // If we have a new end date with no start date set
            // then set the start date as well
            changes['dates.start'] = value.clone().startOf('day');
        }
        this.props.onChange(changes, null);
    }

    changeEndTime(value?: moment.Moment) {
        if (!value) {
            this.props.onChange('_endTime', null);
            return;
        }

        const startDate = this.props.item?.dates?.start;
        const endDate = this.props.item?.dates?.end != null ?
            moment(this.props.item.dates.end) :
            null;
        const _endTime = this.props.item?._endTime;
        const defaultDurationOnChange = this.props.profile?.editor?.dates?.default_duration_on_change ?? 1;
        const newEndDate = endDate ?
            endDate.hour(value.hour()).minute(value.minute()) :
            value;
        const isAllDay = eventUtils.isEventAllDay(startDate, endDate, true);
        const isMultiDay = !eventUtils.isEventSameDay(startDate, endDate);
        const changes = {'dates.end': newEndDate};

        if (((_endTime && isAllDay) || !_endTime) &&
            defaultDurationOnChange > 0 &&
            !isMultiDay
        ) {
            changes['dates.start'] = newEndDate.clone().subtract(defaultDurationOnChange, 'h');
            changes['_startTime'] = changes['dates.start'].clone();
        }
        changes['_endTime'] = newEndDate;
        this.setToBeConfirmed(changes);
        this.props.onChange(changes, null);
    }

    setToBeConfirmed(changes) {
        if ((changes['_startTime'] || this.props.item._startTime) &&
            (changes['_endTime'] || this.props.item._endTime)) {
            changes[TO_BE_CONFIRMED_FIELD] = false;
        }
    }

    onAllDayChange(isAllDay: boolean) {
        const dates = this.props.item?.dates ?? this.props.defaultValue ?? {};
        const nowTz = dates.tz ?
            moment.tz(dates.tz) :
            moment();
        const newStart = moment(dates.start || nowTz)
            .startOf('day');
        let newEnd: moment.Moment;
        let startTime: moment.Moment;
        let endTime: moment.Moment;

        if (isAllDay) {
            // If allDay is enabled, then set the event to all day
            newEnd = moment(dates.end || nowTz).endOf('day');
            startTime = newStart.clone();
            endTime = newEnd.clone();
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save and time to empty
            newEnd = moment(dates.end || newStart)
                .hour(0)
                .minute(1);
        }

        this.props.onChange({
            'dates.start': newStart,
            'dates.end': newEnd,
            _startTime: startTime,
            _endTime: endTime,
            _time_to_be_confirmed: false,
        }, null);
    }

    changeTimezone(_: string, timezone?: string) {
        const dtFormat = 'DD/MM/YYYY HH:mm';
        const dates = this.props.item?.dates ?? {};
        const _startTime = this.props.item?._startTime;
        const _endTime = this.props.item?._endTime;
        const changes = {'dates.tz': timezone};

        const addChange = (field: string, fieldValue) => {
            if (!fieldValue) {
                return;
            }

            changes[field] = timezone ?
                moment.tz(fieldValue.format(dtFormat), dtFormat, timezone) :
                moment(fieldValue);
        };

        addChange('dates.start', dates.start);
        addChange('_startTime', _startTime);
        addChange('dates.end', dates.end);
        addChange('_endTime', _endTime);

        this.props.onChange(changes, null);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'dates';
        const value = this.props.item?.dates ?? this.props.defaultValue ?? {};
        const eventRepeats = value?.recurring_rule != null;
        const isAllDay = eventUtils.isEventAllDay(
            this.props.item.dates?.start,
            this.props.item.dates?.end,
            true
        );
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <React.Fragment>
                <EditorFieldStartDateTime
                    refNode={refNode}
                    {...props}
                    testId={`${this.props.testId}_start`}
                    field={field + '.start'}
                    label={eventRepeats ?
                        gettext('First Event Starts') :
                        gettext('Event Starts')
                    }
                    timeField="_startTime"
                    onChange={this.changeSchedule}
                    showToBeConfirmed
                    onToBeConfirmed={() => {
                        this.props.onChange({[TO_BE_CONFIRMED_FIELD]: true}, null);
                    }}
                    toBeConfirmed={this.props.item[TO_BE_CONFIRMED_FIELD] === true}
                />
                <EditorFieldEndDateTime
                    {...props}
                    field={field + '.end'}
                    testId={`${this.props.testId}_end`}
                    label={eventRepeats ?
                        gettext('First Event Ends') :
                        gettext('Event Ends')
                    }
                    timeField="_endTime"
                    onChange={this.changeSchedule}
                    showToBeConfirmed
                    onToBeConfirmed={() => {
                        this.props.onChange({[TO_BE_CONFIRMED_FIELD]: true}, null);
                    }}
                    toBeConfirmed={this.props.item[TO_BE_CONFIRMED_FIELD] === true}
                />
                <Row
                    flex={true}
                    noPadding={true}
                >
                    {!this.props.showAllDay ? null : (
                        <div data-test-id={`${this.props.testId}_all_day`}>
                            <Switch
                                value={isAllDay}
                                onChange={this.onAllDayChange}
                            />
                            <label>{gettext('All Day')}</label>
                        </div>
                    )}

                    {!this.props.showTimeZone ? null : (
                        <TimeZoneInput
                            testId={`${this.props.testId}_timezone`}
                            field="dates.tz"
                            label={gettext('Timezone')}
                            onChange={this.changeTimezone}
                            halfWidth={this.props.showAllDay}
                            value={this.props.item.dates?.tz}
                            marginLeftAuto={this.props.showAllDay}
                            noPadding={true}
                        />
                    )}
                </Row>
            </React.Fragment>
        );
    }
}
