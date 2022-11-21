import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils, timeUtils} from '../../../utils';
import './style.scss';
import moment from 'moment';

export const EventScheduleSummary = ({
    schedule,
    noPadding,
    forUpdating,
    useEventTimezone,
}) => {
    if (!schedule) return null;

    const eventSchedule = get(schedule, 'dates', {});
    const doesRepeat = get(eventSchedule, 'recurring_rule', null) !== null;
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(eventSchedule);
    const eventDateText = eventUtils.getDateStringForEvent(
        schedule,
        false,
        true,
        isRemoteTimeZone
    );
    let newDateString, currentDateText, remoteDateText, currentDateLabel;

    if (isRemoteTimeZone) {
        const remoteSchedule = {
            ...schedule,
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
            remoteSchedule,
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
    const end = allDay || noEndTime ? moment.utc(eventSchedule.end) :  moment(eventSchedule.end);

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
                        asInputField
                        noMargin={noPadding}
                        forUpdating={forUpdating}
                    />
                </Row>
            )}
        </React.Fragment>
    );
};

EventScheduleSummary.propTypes = {
    schedule: PropTypes.object,
    noPadding: PropTypes.bool,
    forUpdating: PropTypes.bool,
    useEventTimezone: PropTypes.bool,
};

EventScheduleSummary.defaultProps = {
    noPadding: false,
    useEventTimezone: false,
};
