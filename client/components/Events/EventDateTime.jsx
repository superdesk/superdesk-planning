import React from 'react';
import PropTypes from 'prop-types';

import {DateTime} from '../UI';
import {eventUtils} from '../../utils';

import './style.scss';

export const EventDateTime = ({item, timeFormat, dateFormat}) => {
    const start = item.dates.start;
    const end = item.dates.end;
    const isAllDay = eventUtils.isEventAllDay(start, end);
    const withDate = !eventUtils.isEventSameDay(start, end);

    return isAllDay ? (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
            All day
        </span>
    ) : (
        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
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
        </span>
    );
};

EventDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};
