import React from 'react'
import momentPropTypes from 'react-moment-proptypes'
import { Datetime } from '../index'
import { isAllDay } from '../../utils'

function startAndFinishTheSameDay(event) {
    return event.dates.start.isSame(event.dates.end, 'day')
}

export const TimeEvent = ({ event, withDate=false }) => {
    // display "all day" if the event last exactly one day
    if (isAllDay(event)) {
        return (<div>All day</div>)
    // display only the time if the event start and finish the same day
    } else if (startAndFinishTheSameDay(event)) {
        return (
            <span>
                <Datetime date={event.dates.start} withDate={withDate}/>&nbsp;-&nbsp;
                <Datetime date={event.dates.end} withDate={withDate}/>
            </span>
        )
    // otherwise display the start and end datetime
    } else {
        return (
            <span>
                <Datetime date={event.dates.start} withTime={false}/>&nbsp;-&nbsp;
                <Datetime date={event.dates.end} withTime={false}/>
            </span>
        )
    }
}

TimeEvent.propTypes = {
    withDate: React.PropTypes.bool,
    event: React.PropTypes.shape({
        dates: React.PropTypes.shape({
            end: momentPropTypes.momentObj,
            start: momentPropTypes.momentObj,
        }),
    }),
}
