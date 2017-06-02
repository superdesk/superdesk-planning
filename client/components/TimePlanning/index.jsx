import React from 'react'
import momentPropTypes from 'react-moment-proptypes'
import { Datetime } from '../index'
import { isAllDay } from '../../utils'

function startAndFinishTheSameDay(event) {
    return event.dates.start.isSame(event.dates.end, 'day')
}

export const TimePlanning = ({ event }) => {
    if (event) {
        if (isAllDay(event)) {
            return <Datetime date={event.dates.start} withTime={false} />
        } else if (startAndFinishTheSameDay(event)) {
            return <Datetime date={event.dates.start} />
        } else {
            return (
                <span>
                    <Datetime date={event.dates.start} withTime={false} withYear={false}/>&nbsp;-&nbsp;
                    <Datetime date={event.dates.end} withTime={false}/>
                </span>
            )
        }
    } else {
        return null
    }
}

TimePlanning.propTypes = {
    event: React.PropTypes.shape({
        dates: React.PropTypes.shape({
            end: momentPropTypes.momentObj,
            start: momentPropTypes.momentObj,
        }),
    }),
}
