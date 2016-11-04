import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../utils'

export const Event = ({ event, onClick }) => {
    let description = event.description && event.description.definition_short
    // shows the time only if not an "all day long" event
    let time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')
    return (
        <li
            className="event__list-item"
            onClick={onClick.bind(this, event)}>
            <div className="event__wrapper">
                <div className="event__unique-name">{event.unique_name}</div>
                <div className="event__time">{time}</div>
                <div className="event__description">{description}</div>
            </div>
        </li>
    )
}

Event.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired
}
