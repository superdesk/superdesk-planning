import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {DateTime} from '../UI';
import {eventUtils, timeUtils} from '../../utils';
import {gettext} from '../../utils/gettext';
import {TO_BE_CONFIRMED_FIELD, TO_BE_CONFIRMED_SHORT_TEXT} from '../../constants';

import './style.scss';

export const EventDateTime = ({item, timeFormat, dateFormat, ignoreAllDay, displayLocalTimezone}) => {
    const start = item.dates.start;
    const end = item.dates.end;
    const isAllDay = eventUtils.isEventAllDay(start, end);
    const multiDay = !eventUtils.isEventSameDay(start, end);
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(item);
    const withYear = multiDay && start.year() !== end.year();
    const localStart = timeUtils.getLocalDate(start, item.dates.tz);
    let remoteStart, remoteEnd, remoteStartWithDate, remoteEndWithDate, remoteStartWithYear, remoteEndWithYear;

    if (isRemoteTimeZone) {
        remoteStart = timeUtils.getDateInRemoteTimeZone(start, item.dates.tz);
        remoteEnd = timeUtils.getDateInRemoteTimeZone(end, item.dates.tz);
        remoteStartWithDate = remoteStart.date() !== start.date() || remoteStart.date() !== remoteEnd.date();
        remoteEndWithDate = remoteStart.date() !== remoteEnd.date();
        remoteStartWithYear = remoteStartWithDate && remoteStart.year() !== remoteEnd.year();
        remoteEndWithYear = remoteEndWithDate && remoteStart.year() !== remoteEnd.year();
    }

    if (get(item, TO_BE_CONFIRMED_FIELD) && !multiDay) {
        return (<span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            {`${gettext('Time')} ${TO_BE_CONFIRMED_SHORT_TEXT}`}
        </span>);
    }

    const commonProps = {
        padLeft: false,
        dateFormat: dateFormat,
        timeFormat: timeFormat,
        toBeConfirmed: get(item, TO_BE_CONFIRMED_FIELD),
    };

    return isAllDay && !ignoreAllDay ? (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            {gettext('All day')}
        </span>
    ) : (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            {displayLocalTimezone &&
            <span className="EventDateTime__timezone">
                {timeUtils.getTimeZoneAbbreviation(localStart.format('z'))}
            </span>}
            <DateTime
                withDate={multiDay}
                withYear={withYear}
                date={start}
                {...commonProps}
            />
            <span className="EventDateTime__divider">-</span>
            <DateTime
                withDate={multiDay}
                withYear={withYear}
                date={end}
                {...commonProps}
            />
            {isRemoteTimeZone && (<span>&nbsp;(
                <span className="EventDateTime__timezone">
                    {timeUtils.getTimeZoneAbbreviation(remoteStart.format('z'))}
                </span>
                <DateTime
                    withDate={remoteStartWithDate}
                    withYear={remoteStartWithYear}
                    date={remoteStart}
                    {...commonProps}
                />
                <span className="EventDateTime__divider">-</span>
                <DateTime
                    withDate={remoteEndWithDate}
                    withYear={remoteEndWithYear}
                    date={remoteEnd}
                    {...commonProps}
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
    displayLocalTimezone: PropTypes.bool,
};

EventDateTime.defaultProps = {
    displayLocalTimezone: false,
};