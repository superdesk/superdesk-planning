import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import {Datetime} from '../index';
import {eventUtils} from '../../utils';

function startAndFinishTheSameDay(event) {
    return event.dates.start.isSame(event.dates.end, 'day');
}

export const TimePlanning = ({event}) => {
    if (event) {
        if (eventUtils.isEventAllDay(event.dates.start, event.dates.end)) {
            return <Datetime date={event.dates.start} withTime={false} />;
        } else if (startAndFinishTheSameDay(event)) {
            return <Datetime date={event.dates.start} />;
        } else {
            return (
                <span>
                    <Datetime date={event.dates.start} withTime={false} withYear={false}/>&nbsp;-&nbsp;
                    <Datetime date={event.dates.end} withTime={false}/>
                </span>
            );
        }
    } else {
        return null;
    }
};

TimePlanning.propTypes = {
    event: PropTypes.shape({
        dates: PropTypes.shape({
            end: momentPropTypes.momentObj,
            start: momentPropTypes.momentObj,
        }),
    }),
};
