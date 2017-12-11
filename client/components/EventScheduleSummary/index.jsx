import React from 'react';
import PropTypes from 'prop-types';
import {RepeatEventSummary} from '../index';
import {Row} from '../UI/Preview';
import {InputField} from '../fields';
import {gettext} from '../../utils'
import {get} from 'lodash';
import moment from 'moment';
import './style.scss';

export const EventScheduleSummary = ({schedule}) => {

    if (!schedule)
        return null

    const doesRepeat = get(schedule, 'recurring_rule', null) !== null;
    const frequency = get(schedule, 'recurring_rule.frequency');
    const endRepeatMode = get(schedule, 'recurring_rule.endRepeatMode');
    const until = get(schedule, 'recurring_rule.until');
    const count = get(schedule, 'recurring_rule.count');
    const byDay = get(schedule, 'recurring_rule.byday');
    const start = get(schedule, 'start');
    const end = get(schedule, 'end');
    const interval = get(schedule, 'recurring_rule.interval');

    let eventDateText
    if (schedule.start.isSame(schedule.end, 'day')) {
        eventDateText = schedule.start.format('DD/MM/YYYY @ HH:mma') + ' - ' +
            schedule.end.format('HH:mm a')
    } else {
        eventDateText = schedule.start.format('DD/MM/YYYY @ HH:mma') + ' - ' +
            schedule.end.format('DD/MM/YYYY @ HH:mm a')
    }

    return (
        <div>
            <Row
                label={gettext('Date')}
                value={eventDateText || ''}
            >
                {doesRepeat &&
                    <RepeatEventSummary
                        byDay={byDay}
                        interval={interval}
                        frequency={frequency}
                        endRepeatMode={endRepeatMode}
                        until={until}
                        count={count}
                        startDate={start}
                        asInputField={true}
                    />
                }
            </Row>
        </div>
    );
};

EventScheduleSummary.propTypes = {schedule: PropTypes.object};
