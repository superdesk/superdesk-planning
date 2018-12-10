import React from 'react';
import PropTypes from 'prop-types';
import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils, timeUtils} from '../../../utils';
import {get} from 'lodash';
import './style.scss';


export const EventScheduleSummary = ({schedule, dateFormat, timeFormat, noPadding, forUpdating}) => {
    if (!schedule)
        return null;

    const doesRepeat = get(schedule, 'recurring_rule', null) !== null;
    const event = {dates: schedule};
    const eventDateText = eventUtils.getDateStringForEvent(event, dateFormat, timeFormat);
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(event);
    let newDateString;

    if (isRemoteTimeZone) {
        const remoteSchedule = {
            dates: {
                ...schedule,
                start: timeUtils.getDateInRemoteTimeZone(schedule.start, schedule.tz),
                end: timeUtils.getDateInRemoteTimeZone(schedule.end, schedule.tz),
            },
        };

        newDateString = eventUtils.getDateStringForEvent(remoteSchedule, dateFormat, timeFormat, false, false);
    }

    return (
        <div>
            <Row
                label={forUpdating ? gettext('Current Date') : gettext('Date')}
                value={eventDateText || ''}
                noPadding={noPadding || isRemoteTimeZone}
            />
            {isRemoteTimeZone && <Row
                value={newDateString || ''}
                noPadding={noPadding}
            />}

            {doesRepeat && (
                <Row noPadding={noPadding}>
                    <RepeatEventSummary
                        schedule={schedule}
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
};

EventScheduleSummary.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    noPadding: false,
};
