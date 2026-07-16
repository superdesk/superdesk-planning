import React from 'react';

import {superdeskApi} from '../../superdeskApi';
import {IEventItem} from '../../interfaces';

import {eventUtils, timeUtils} from '../../utils';

import {DateTime} from '../UI';

import './style.scss';
import {Icon, Spacer, Tooltip} from 'superdesk-ui-framework/react';
import {isSameDay} from './../../helpers';

interface IProps {
    item: IEventItem;

    /**
     * This prop indicates that this component is rendered in a location that already provides start day information.
     * Its purpose is to render shorter output and omit information that is already clear from the context.
     */
    hasStartDateContext?: boolean;
}

export class EventDateTime extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {hasStartDateContext = false} = this.props;
        const {item} = this.props;
        const noEndTime = item.dates?.no_end_time;
        const isFullDay = item.dates?.all_day;
        const start = eventUtils.getStartDate(item);
        const end = eventUtils.getEndDate(item);
        const isAllDay = eventUtils.isEventAllDay(item);
        const multiDay = noEndTime && end.isBefore(start) ? false : !isSameDay(start, end);
        const showEventStartDate = !hasStartDateContext;
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(item);
        const withYear = !hasStartDateContext || (multiDay && start.year() !== end.year());
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

        const commonProps = {
            padLeft: false,
            toBeConfirmed: item._time_to_be_confirmed,
            noEndTime: noEndTime,
            isFullDay: isFullDay,
            multiDay: multiDay,
        };

        const showDash = !((noEndTime || isFullDay) && !multiDay);

        const remoteTimezoneTooltipContent: React.ComponentType = () => (
            <Spacer h gap="4">
                <span className="EventDateTime__timezone">
                    {timeUtils.getTimeZoneAbbreviation(remoteStart.format('z'))}
                </span>

                <DateTime
                    withDate={remoteStartWithDate}
                    withYear={remoteStartWithYear}
                    date={remoteStart}
                    withTime={!isFullDay}
                    color="inherit"
                    {...commonProps}
                />

                {showDash && <>&ndash;</>}

                <DateTime
                    withDate={remoteEndWithDate}
                    withYear={remoteEndWithYear}
                    date={remoteEnd}
                    withTime={!isFullDay}
                    isEndEventDateTime={true}
                    color="inherit"
                    {...commonProps}
                />
            </Spacer>
        );

        return (
            <span className="EventDateTime sd-list-item__slugline sd-no-wrap" data-test-id="event-datetime">
                <Spacer h gap="4" noWrap>
                    <span>
                        <DateTime
                            withTime={!isFullDay}
                            withDate={showEventStartDate}
                            withYear={withYear}
                            date={start}
                            {...commonProps}
                        />
                        {showDash && <>&ndash;</>}
                        <DateTime
                            withDate={multiDay}
                            withYear={withYear}
                            withTime={!isFullDay}
                            isEndEventDateTime={true}
                            date={end}
                            {...commonProps}
                        />
                    </span>

                    {isRemoteTimeZone && (
                        <Tooltip content={remoteTimezoneTooltipContent}>
                            <Icon name="globe" />
                        </Tooltip>
                    )}

                    {isAllDay && (<span>{gettext('All day')}</span>)}
                </Spacer>
            </span>
        );
    }
}
