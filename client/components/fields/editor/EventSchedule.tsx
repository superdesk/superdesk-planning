import * as React from 'react';
import moment from 'moment-timezone';
import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldEndDateTime} from './EndDateTime';
import {EditorFieldStartDateTime} from './StartDateTime';
import {Row, TimeZoneInput} from '../../UI/Form';
import {timeUtils} from '../../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';
import {IEventScheduleFieldProps} from './EventSchedule.interface';

export class EditorFieldEventSchedule extends React.PureComponent<IEventScheduleFieldProps> {
    constructor(props) {
        super(props);

        this.changeSchedule = this.changeSchedule.bind(this);
        this.changeTimezone = this.changeTimezone.bind(this);
    }

    changeSchedule(field: string | {[key: string]: any}, value?: moment.Moment) {
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

    changeStartDate(newValue: moment.Moment) {
        let value = newValue.clone();

        const startDate = this.props.item?.dates?.start != null ?
            moment(this.props.item.dates.start) :
            null;
        const endDate = this.props.item?.dates?.end != null ?
            moment(this.props.item.dates.end) :
            null;
        const changes = {'dates.start': value};

        if (this.props.item.dates?.all_day == null && this.props.item.dates?.no_end_time == null) {
            changes['dates.all_day'] = true;
        }

        if (startDate != null) {
            value
                .hour(startDate.hour())
                .minute(startDate.minute())
                .second(startDate.second());
        } else {
            value.hour(0)
                .minute(0)
                .second(0);
        }

        if (this.props.item.dates?.all_day === true || changes['dates.all_day'] === true) {
            value = localDateToUtc(value, this.props.item.dates?.tz);
            changes['dates.start'] = value;
        }

        if (endDate == null) {
            changes['dates.end'] = value.clone();
        }

        this.props.onChange(changes);
    }

    changeStartTime(value?: moment.Moment) {
        const startDate = this.props.item?.dates?.start;

        if (!value) {
            const changes = {
                _startTime: null,
                _endTime: null,
                'dates.start': startDate ? localDateToUtc(startDate, this.props.item?.dates?.tz) : null,
                'dates.all_day': true,
                'dates.no_end_time': true,
                [TO_BE_CONFIRMED_FIELD]: false,
            };

            this.props.onChange(changes);
            return;
        }
        const newStartDate = !startDate ? value : combineDateTime(startDate, value, this.props.item.dates?.tz);
        const changes = {
            'dates.start': newStartDate,
            'dates.all_day': false,
            [TO_BE_CONFIRMED_FIELD]: false,
        };

        if (this.props.item.dates?.no_end_time == null) {
            changes['dates.no_end_time'] = true;
        }

        changes['_startTime'] = newStartDate;
        this.props.onChange(changes);
    }

    changeEndDate(value: moment.Moment) {
        const startDate = this.props.item?.dates?.start;
        const changes = {'dates.end': value};

        if (this.props.item.dates?.all_day == null && this.props.item.dates?.no_end_time == null) {
            changes['dates.all_day'] = true;
        }

        if (this.props.item.dates?.all_day === true || changes['dates.all_day'] === true ||
            this.props.item.dates?.no_end_time === true || changes['dates.no_end_time'] === true) {
            changes['dates.end'] = localDateToUtc(value, this.props.item.dates?.tz);
        }

        if (!startDate) {
            // If we have a new end date with no start date set
            // then set the start date as well
            changes['dates.start'] = value.clone();
        }

        if (this.props.item.dates?.all_day === true || changes['dates.all_day'] === true ||
            this.props.item.dates?.no_end_time === true || changes['dates.no_end_time'] === true) {
            changes['dates.end'] = localDateToUtc(value, this.props.item.dates?.tz);
        }

        this.props.onChange(changes);
    }

    changeEndTime(value?: moment.Moment) {
        const endDate = this.props.item?.dates?.end;

        if (!value) {
            const changes = {
                _endTime: null,
                'dates.end': this.props.item.dates?.end ?
                    localDateToUtc(this.props.item.dates.end, this.props.item.dates.tz)
                    : null,
                'dates.no_end_time': true,
                [TO_BE_CONFIRMED_FIELD]: false,
            };

            this.props.onChange(changes);
            return;
        }

        const newEndDate = !endDate ? value : combineDateTime(endDate, value, this.props.item.dates?.tz);

        const changes = {
            _endTime: newEndDate,
            'dates.end': newEndDate,
            'dates.no_end_time': false,
            [TO_BE_CONFIRMED_FIELD]: false,
        };

        this.props.onChange(changes);
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

        if (dates.start != null && dates.all_day !== true) {
            addChange('dates.start', dates.start);
            addChange('_startTime', _startTime);
        }

        if (dates.end != null && dates.no_end_time !== true && dates.all_day !== true) {
            addChange('dates.end', dates.end);
            addChange('_endTime', _endTime);
        }

        this.props.onChange(changes);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'dates';
        const value = this.props.item?.dates ?? this.props.defaultValue ?? {};
        const eventRepeats = value?.recurring_rule != null;
        const isLocalTimeZoneDifferent = timeUtils.isEventInDifferentTimeZone(this.props.item);
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
                        this.props.onChange({[TO_BE_CONFIRMED_FIELD]: true});
                    }}
                    toBeConfirmed={this.props.item[TO_BE_CONFIRMED_FIELD] === true}
                    isLocalTimeZoneDifferent={isLocalTimeZoneDifferent}
                    remoteTimeZone={this.props.item.dates?.tz}
                    allDay={this.props.item.dates?.all_day}
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
                        this.props.onChange({[TO_BE_CONFIRMED_FIELD]: true});
                    }}
                    toBeConfirmed={this.props.item[TO_BE_CONFIRMED_FIELD] === true}
                    isLocalTimeZoneDifferent={isLocalTimeZoneDifferent}
                    remoteTimeZone={this.props.item.dates?.tz}
                    allDay={this.props.item.dates?.all_day === true ||
                        this.props.item.dates?.no_end_time === true}
                />
                <Row
                    flex={true}
                    noPadding={true}
                >
                    {
                        this.props.showTimeZone &&
                        this.props.item._startTime &&
                        this.props.item.dates?.all_day !== true && (
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
                        )
                    }
                </Row>
            </React.Fragment>
        );
    }
}

/**
 * Combines date from the first argument with time from the second argument
 */
function combineDateTime(date: moment.MomentInput, time: moment.Moment, tz?: string): moment.Moment {
    return moment.tz(moment(date).format('YYYY-MM-DD'), tz) // we only want the date part
        .hour(time.hour())
        .minute(time.minute())
        .second(time.second());
}

/**
 * Converts datetime in given timezone to date only in utc
 * eg. 2024-12-10T23:00:00-05:00 -> 2024-12-11T00:00:00Z
 */
function localDateToUtc(date: moment.MomentInput, tz?: string): moment.Moment {
    return moment.utc(tz ?
        moment.tz(date, tz).format('YYYY-MM-DD') :
        moment(date).format('YYYY-MM-DD')
    );
}
