import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils, timeUtils} from '../../../utils';
import './style.scss';


export const EventScheduleSummary = ({schedule, noPadding, forUpdating, useEventTimezone}) => {
    if (!schedule)
        return null;

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
                start: timeUtils.getDateInRemoteTimeZone(eventSchedule.start, eventSchedule.tz),
                end: timeUtils.getDateInRemoteTimeZone(eventSchedule.end, eventSchedule.tz),
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

    return (
        <React.Fragment>
            <Row
                label={forUpdating ? currentDateLabel : gettext('Date:')}
                value={currentDateText || ''}
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
                <Row
                    noPadding={noPadding}
                    dataTestId="field-dates_repeat"
                >
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
