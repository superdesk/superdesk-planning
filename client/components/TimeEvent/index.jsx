import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import {Datetime} from '../index';
import {eventUtils} from '../../utils';
import {TOOLTIPS} from '../../constants';
import {get} from 'lodash';
import './style.scss';

function startAndFinishTheSameDay(event) {
    return event.dates.start.isSame(event.dates.end, 'day');
}

export const TimeEvent = ({event, withDate = false}) => {
    const isRecurringEvent = get(event, 'recurrence_id', null) !== null;

    let label;

    // display "all day" if the event last exactly one day
    if (eventUtils.isEventAllDay(event.dates.start, event.dates.end)) {
        label = (<span className="TimeEvent">All day</span>);
    // display only the time if the event start and finish the same day
    } else if (startAndFinishTheSameDay(event)) {
        label = (
            <span className="TimeEvent">
                <Datetime date={event.dates.start} withDate={withDate}/>&nbsp;-&nbsp;
                <Datetime date={event.dates.end} withDate={withDate}/>
            </span>
        );
    // otherwise display the start and end datetime
    } else {
        label = (
            <span className="TimeEvent">
                <Datetime date={event.dates.start} withTime={false}/>&nbsp;-&nbsp;
                <Datetime date={event.dates.end} withTime={false}/>
            </span>
        );
    }

    // If this is in a series of recurring events, then wrap the date/time component
    // in a Tooltip overlay and display the icon-repeat
    if (isRecurringEvent) {
        return (
            <span className="TimeEvent" data-sd-tooltip={TOOLTIPS.repeatingEvent}
                data-flow="down">
                {label}
                <i className="icon-repeat"/>
            </span>
        );
    // Otherwise simply return the date/time component
    } else {
        return label;
    }
};

TimeEvent.propTypes = {
    withDate: PropTypes.bool,
    event: PropTypes.shape({
        dates: PropTypes.shape({
            end: momentPropTypes.momentObj,
            start: momentPropTypes.momentObj,
        }),
        recurrence_id: PropTypes.string,
    }),
};
