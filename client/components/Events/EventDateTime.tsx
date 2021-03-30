import React from 'react';
import moment from 'moment';

import {superdeskApi} from '../../superdeskApi';
import {IEventItem} from '../../interfaces';

import {eventUtils, timeUtils} from '../../utils';

import {DateTime} from '../UI';

import './style.scss';

interface IProps {
    item: IEventItem;
    ignoreAllDay?: boolean;
    displayLocalTimezone?: boolean;
}

export class EventDateTime extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            ignoreAllDay,
            displayLocalTimezone,
        } = this.props;
        const start = moment(item.dates.start);
        const end = moment(item.dates.end);
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

        if (item._time_to_be_confirmed && !multiDay) {
            return (
                <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                    {gettext('Time TBC')}
                </span>
            );
        }

        const commonProps = {
            padLeft: false,
            toBeConfirmed: item._time_to_be_confirmed,
        };

        return isAllDay && !ignoreAllDay ? (
            <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                {gettext('All day')}
            </span>
        ) : (
            <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                {displayLocalTimezone && (
                    <span className="EventDateTime__timezone sd-margin-r--0-5">
                        {timeUtils.getTimeZoneAbbreviation(localStart.format('z'))}
                    </span>
                )}
                <DateTime
                    withDate={multiDay}
                    withYear={withYear}
                    date={start}
                    {...commonProps}
                />
                &ndash;
                <DateTime
                    withDate={multiDay}
                    withYear={withYear}
                    date={end}
                    {...commonProps}
                />
                {isRemoteTimeZone && (
                    <span>&nbsp;(
                        <span className="EventDateTime__timezone sd-margin-r--0-5">
                            {timeUtils.getTimeZoneAbbreviation(remoteStart.format('z'))}
                        </span>
                        <DateTime
                            withDate={remoteStartWithDate}
                            withYear={remoteStartWithYear}
                            date={remoteStart}
                            {...commonProps}
                        />
                        &ndash;
                        <DateTime
                            withDate={remoteEndWithDate}
                            withYear={remoteEndWithYear}
                            date={remoteEnd}
                            {...commonProps}
                        />)
                    </span>
                )}
            </span>
        );
    }
}
