import React from 'react';

import {superdeskApi} from '../../superdeskApi';
import {IEventItem} from '../../interfaces';

import {eventUtils, timeUtils} from '../../utils';

import {DateTime} from '../UI';

import './style.scss';
import {Spacer} from 'superdesk-ui-framework/react';
import {isSameDay} from './../../helpers';
import {SpacerBlock} from '@sourcefabric/common';

interface IProps {
    item: IEventItem;

    isEventAndPlanningSameDate?: boolean;
    hideStartDate?: boolean;
}

export class EventDateTime extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {item} = this.props;
        const start = eventUtils.getStartDate(item);
        const end = eventUtils.getEndDate(item);
        const isAllDay = eventUtils.isEventAllDay(start, end);
        const multiDay = !isSameDay(start, end);
        const isEventAndPlanningSameDate = this.props.isEventAndPlanningSameDate ?? false;
        const showEventStartDate = !(this.props.hideStartDate ?? false);
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(item);
        const withYear = multiDay && start.year() !== end.year();
        let remoteStart,
            remoteEnd,
            remoteStartWithDate,
            remoteEndWithDate,
            remoteStartWithYear,
            remoteEndWithYear;

        if (isRemoteTimeZone) {
            remoteStart = timeUtils.getDateInRemoteTimeZone(start, item.dates.tz);
            remoteEnd = timeUtils.getDateInRemoteTimeZone(end, item.dates.tz);
            remoteStartWithDate =
                remoteStart.date() !== start.date() ||
                remoteStart.date() !== remoteEnd.date();
            remoteEndWithDate = remoteStart.date() !== remoteEnd.date();
            remoteStartWithYear =
                remoteStartWithDate && remoteStart.year() !== remoteEnd.year();
            remoteEndWithYear =
                remoteEndWithDate && remoteStart.year() !== remoteEnd.year();
        }

        if (item._time_to_be_confirmed && !multiDay) {
            return (
                <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                    {gettext('Time TBC')}
                </span>
            );
        }

        const noEndTime = item.dates?.no_end_time;
        const isFullDay = item.dates?.all_day;

        const commonProps = {
            padLeft: false,
            toBeConfirmed: item._time_to_be_confirmed,
            noEndTime: noEndTime,
            isFullDay: isFullDay,
            multiDay: multiDay,
        };

        const showDash = !((noEndTime || isFullDay) && !multiDay);

        return isAllDay ? (
            <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                <Spacer h gap={'4'}>
                    {(!isEventAndPlanningSameDate || multiDay) && (
                        <DateTime
                            withDate={showEventStartDate}
                            withYear={false}
                            date={start}
                            {...commonProps}
                            withTime={false}
                            testId="event-start-date"
                        />
                    )}
                    {gettext('All day')}
                </Spacer>
            </span>
        ) : (
            <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                <DateTime
                    withTime={!isFullDay}
                    withDate={showEventStartDate}
                    withYear={withYear}
                    date={start}
                    testId="event-start-date"
                    {...commonProps}
                />
                {showDash && <>&ndash;</>}
                <DateTime
                    withDate={multiDay}
                    withYear={withYear}
                    isEndEventDateTime={true}
                    date={end}
                    testId="event-end-date"
                    {...commonProps}
                />
                {isRemoteTimeZone && (
                    <span>
                        <SpacerBlock h gap="4" />

                        <span className="EventDateTime__timezone sd-margin-r--0-5">
                            {timeUtils.getTimeZoneAbbreviation(remoteStart.format('z'))}
                        </span>

                        <DateTime
                            withDate={remoteStartWithDate}
                            withYear={remoteStartWithYear}
                            date={remoteStart}
                            {...commonProps}
                        />

                        {showDash && <>&ndash;</>}

                        <DateTime
                            withDate={remoteEndWithDate}
                            withYear={remoteEndWithYear}
                            date={remoteEnd}
                            isEndEventDateTime={true}
                            {...commonProps}
                        />
                    </span>
                )}
            </span>
        );
    }
}
