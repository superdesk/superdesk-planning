import React, { PropTypes } from 'react'
import moment from 'moment'

export const Event = ({ event, onClick }) => {
    let description = event.description && event.description.definition_short
    let date = moment.utc(event.dates.start)
    let time = date.format('HH:mm')
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
