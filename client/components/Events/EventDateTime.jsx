import React from 'react';
import PropTypes from 'prop-types';
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
    const withYear = withDate && start.year() !== end.year();
    const localStart = timeUtils.getLocalDate(start, item.dates.tz);
    let remoteStart, remoteEnd, remoteStartWithDate, remoteEndWithDate, remoteStartWithYear, remoteEndWithYear;

    if (isRemoteTimeZone) {
        remoteStart = timeUtils.getDateInRemoteTimeZone(start, item.dates.tz);
        remoteEnd = timeUtils.getDateInRemoteTimeZone(end, item.dates.tz);
        remoteStartWithDate = remoteStart.date() !== start.date();
        remoteEndWithDate = (remoteEnd.date() !== end.date() || remoteStart.date() !== remoteEnd.date());
        remoteStartWithYear = remoteStartWithDate && remoteStart.year() !== remoteEnd.year();
        remoteEndWithYear = remoteEndWithDate && remoteStart.year() !== remoteEnd.year();
    }

    return isAllDay && !ignoreAllDay ? (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            {gettext('All day')}
        </span>
    ) : (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            <span className="EventDateTime__timezone">{localStart.format('z')}</span>
            <DateTime
                withDate={withDate}
                withYear={withYear}
                padLeft={false}
                date={start}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
            />
            <span className="EventDateTime__divider">-</span>
            <DateTime
                withDate={withDate}
                padLeft={false}
                withYear={withYear}
                date={end}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
            />
            {isRemoteTimeZone && (<span>&nbsp;(
                <span className="EventDateTime__timezone">{remoteStart.format('z')}</span>
                <DateTime
                    withDate={remoteStartWithDate}
                    padLeft={false}
                    withYear={remoteStartWithYear}
                    date={remoteStart}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                />
                <span className="EventDateTime__divider">-</span>
                <DateTime
                    withDate={remoteEndWithDate}
                    padLeft={false}
                    withYear={remoteEndWithYear}
                    date={remoteEnd}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                />)
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
