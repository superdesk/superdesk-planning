import React from 'react';
import PropTypes from 'prop-types';
import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';
import {gettext, eventUtils} from '../../../utils';
import {get} from 'lodash';
import './style.scss';


export const EventScheduleSummary = ({schedule, dateFormat, timeFormat, noPadding, forUpdating}) => {
    if (!schedule)
        return null;

    const doesRepeat = get(schedule, 'recurring_rule', null) !== null;
    const frequency = get(schedule, 'recurring_rule.frequency');
    const endRepeatMode = get(schedule, 'recurring_rule.endRepeatMode');
    const until = get(schedule, 'recurring_rule.until');
    const count = get(schedule, 'recurring_rule.count');
    const byDay = get(schedule, 'recurring_rule.byday');
    const start = get(schedule, 'start');
    const interval = get(schedule, 'recurring_rule.interval');
    const eventDateText = eventUtils.getDateStringForEvent({dates: schedule}, dateFormat, timeFormat);

    return (
        <div>
            <Row
                label={forUpdating ? gettext('Current Date') : gettext('Date')}
                value={eventDateText || ''}
                noPadding={noPadding}
            />

            {doesRepeat && (
                <Row noPadding={noPadding}>
                    <RepeatEventSummary
                        byDay={byDay}
                        interval={interval}
                        frequency={frequency}
                        endRepeatMode={endRepeatMode}
                        until={until}
                        count={count}
                        startDate={start}
                        asInputField={true}
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
