import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils, timeUtils} from '../../../utils';
import './style.scss';
import moment from 'moment';
import {IEventItem} from 'interfaces';
interface IProps {
    event: Partial<IEventItem>,
    noPadding?: boolean,
    forUpdating?: boolean,
    useEventTimezone?: boolean
}

export const EventScheduleSummary = ({
    event,
    noPadding = false,
    forUpdating = false,
    useEventTimezone = false
}: IProps) => {
    // if (!event)
    //     return null;

    const eventSchedule: IEventItem['dates'] = get(event, 'dates', {});
    const doesRepeat = get(eventSchedule, 'recurring_rule', null) !== null;
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(event);
    const eventDateText = eventUtils.getDateStringForEvent(
        event,
        false,
        true,
        isRemoteTimeZone
    );
    let newDateString, currentDateText, remoteDateText, currentDateLabel;

    if (isRemoteTimeZone) {
        const remoteEvent = {
            ...event,
            dates: {
                ...eventSchedule,
                start: timeUtils.getDateInRemoteTimeZone(
                    eventSchedule.start,
                    eventSchedule.tz
                ),
                end: timeUtils.getDateInRemoteTimeZone(
                    eventSchedule.end,
                    eventSchedule.tz
                ),
            },
        };


        newDateString = eventUtils.getDateStringForEvent(
            remoteEvent,
            false,
            false
        );
    }

    currentDateText = eventDateText;
    remoteDateText = newDateString;
    currentDateLabel = gettext('Current Date');
    if (useEventTimezone && isRemoteTimeZone) {
        currentDateText = newDateString.replace(/[\(\)]/g, '');
        remoteDateText = `(${eventDateText})`;
        currentDateLabel = gettext('Current Date (Based on Event timezone)');
    }

    const allDay = eventSchedule?.all_day;
    const noEndTime = eventSchedule?.no_end_time;

    const start = allDay ? moment.utc(eventSchedule.start) : moment(eventSchedule.start);
    const end = allDay || noEndTime ? moment.utc(eventSchedule.end) : moment(eventSchedule.end);

    const multiDay = !eventUtils.isEventSameDay(start, end);

    const splittedDate = currentDateText?.split('-');

    let datesToShow;

    if (allDay && !multiDay) {
        datesToShow = splittedDate[0].slice(0, 10);
    } else if (noEndTime && !multiDay) {
        datesToShow = splittedDate[0];
    } else if (allDay && multiDay) {
        datesToShow = splittedDate[0].slice(0, 10) + '-' + splittedDate[1].slice(0, 11);
    } else if (noEndTime && multiDay) {
        datesToShow = currentDateText.slice(0, 31);
    } else {
        datesToShow = currentDateText;
    }


    return (
        <React.Fragment>
            <Row
                label={forUpdating ? currentDateLabel : gettext('Date:')}
                value={datesToShow || ''}
                noPadding={noPadding || isRemoteTimeZone}
                dataTestId="field-dates"
            />
            {isRemoteTimeZone && (
                <Row
                    value={remoteDateText || ''}
                    noPadding={noPadding}
                    dataTestId="field-dates_timezone"
                />
            )}

            {doesRepeat && (
                <Row noPadding={noPadding} dataTestId="field-dates_repeat">
                    <RepeatEventSummary
                        schedule={eventSchedule}
                        noMargin={noPadding}
                        forUpdating={forUpdating}
                    />
                </Row>
            )}
        </React.Fragment>
    );
};
