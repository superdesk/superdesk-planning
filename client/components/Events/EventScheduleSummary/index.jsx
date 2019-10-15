import React from 'react';
import PropTypes from 'prop-types';
import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils, timeUtils} from '../../../utils';
import {DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT} from '../../../constants';
import {get} from 'lodash';
import './style.scss';


export const EventScheduleSummary = ({schedule, dateFormat, timeFormat, noPadding, forUpdating, useEventTimezone}) => {
    if (!schedule)
        return null;

    const eventSchedule = get(schedule, 'dates', {});
    const doesRepeat = get(eventSchedule, 'recurring_rule', null) !== null;
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(eventSchedule);
    const eventDateText = eventUtils.getDateStringForEvent(schedule, dateFormat, timeFormat,
        false, true, isRemoteTimeZone);
    let newDateString, currentDateText, remoteDateText, currentDateLabel;

    if (isRemoteTimeZone) {
        const remoteSchedule = {
            ...schedule,
            dates: {
                ...eventSchedule,
                start: timeUtils.getDateInRemoteTimeZone(eventSchedule.start, eventSchedule.tz),
                end: timeUtils.getDateInRemoteTimeZone(eventSchedule.end, eventSchedule.tz),
            },
        };

        newDateString = eventUtils.getDateStringForEvent(remoteSchedule, dateFormat, timeFormat, false, false);
    }

    currentDateText = eventDateText;
    remoteDateText = newDateString;
    currentDateLabel = gettext('Current Date');
    if (useEventTimezone && isRemoteTimeZone) {
        currentDateText = newDateString.replace(/[\(\)]/g, '');
        remoteDateText = `(${eventDateText})`;
        currentDateLabel = gettext('Current Date (Based on Event timezone)');
    }

    return (
        <div>
            <Row
                label={forUpdating ? currentDateLabel : gettext('Date')}
                value={currentDateText || ''}
                noPadding={noPadding || isRemoteTimeZone}
            />
            {isRemoteTimeZone && <Row
                value={remoteDateText || ''}
                noPadding={noPadding}
            />}

            {doesRepeat && (
                <Row noPadding={noPadding}>
                    <RepeatEventSummary
                        schedule={eventSchedule}
                        asInputField
                        noMargin={noPadding}
                        forUpdating={forUpdating}
                    />
                </Row>
            )}
        </div>
    );
};

EventScheduleSummary.propTypes = {
    schedule: PropTypes.object,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    noPadding: PropTypes.bool,
    forUpdating: PropTypes.bool,
    useEventTimezone: PropTypes.bool,
};

EventScheduleSummary.defaultProps = {
    dateFormat: DEFAULT_DATE_FORMAT,
    timeFormat: DEFAULT_TIME_FORMAT,
    noPadding: false,
    useEventTimezone: false,
};
