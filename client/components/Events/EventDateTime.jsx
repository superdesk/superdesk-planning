import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';

import {DateTime} from '../UI';
import {eventUtils, timeUtils} from '../../utils';
import {gettext} from '../../utils/gettext';

import './style.scss';

export const EventDateTime = ({item, timeFormat, dateFormat, ignoreAllDay}) => {
    const start = item.dates.start;
    const end = item.dates.end;
    const isAllDay = eventUtils.isEventAllDay(start, end);
    const withDate = !eventUtils.isEventSameDay(start, end);
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(item);
    let newStart, newEnd, newStartWithDate, newEndWithDate;

    if (isRemoteTimeZone) {
        newStart = timeUtils.getDateInRemoteTimeZone(start, item.dates.tz);
        newEnd = timeUtils.getDateInRemoteTimeZone(end, item.dates.tz);
        newStartWithDate = newStart.date() !== start.date();
        newEndWithDate = (newEnd.date() !== end.date() || newStart.date() !== newEnd.date());
    }

    return isAllDay && !ignoreAllDay ? (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            {gettext('All day')}
        </span>
    ) : (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            <span className="EventDateTime__timezone">{moment.tz(timeUtils.localTimeZone()).format('z')}</span>
            <DateTime
                withDate={withDate}
                padLeft={false}
                date={start}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
            />
            <span className="EventDateTime__divider">-</span>
            <DateTime
                withDate={withDate}
                padLeft={false}
                date={end}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
            />
            {isRemoteTimeZone && (<span>&nbsp;(
                <span className="EventDateTime__timezone">&nbsp;{moment.tz(item.dates.tz).format('z')}</span>
                <DateTime
                    withDate={newStartWithDate}
                    padLeft={false}
                    date={newStart}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                />
                <span className="EventDateTime__divider">-</span>
                <DateTime
                    withDate={newEndWithDate}
                    padLeft={false}
                    date={newEnd}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                />
                <span className="EventDateTime__divider">)</span>
            </span>)}
        </span>
    );
};

EventDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    ignoreAllDay: PropTypes.bool,
};
