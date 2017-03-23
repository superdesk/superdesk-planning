import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../../utils'
import { get } from 'lodash'
import { ListItem } from '../index'
import './style.scss'

export const EventItem = ({ event, onClick }) => {
    // shows the time only if not an "all day long" event
    const time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')
    const location = get(event, 'location[0].name')
    const hasBeenCanceled = get(event, 'occur_status.qcode') === 'eocstat:eos6'
    const counters = [
        {
            icon: 'icon-file',
            count: get(event, 'files.length', 0),
            className: 'files-attached-count',
        },
        {
            icon: 'icon-link',
            count: get(event, 'links.length', 0),
            className: 'links-count',
        }
    ]
    const classes = [
        'event',
        event._hasPlanning ? 'event--has-planning' : null,
        hasBeenCanceled ? 'event--has-been-canceled' : null,
    ].join(' ')
    return (
        <ListItem item={event} onClick={onClick.bind(this, event)} draggable={true} className={classes}>
            <div className="line">
                <span className="event__title keyword">{event.name}</span>
                <span className="item-heading">{event.definition_short}</span>
                <time className="time--short" title={time}>{time}</time>

            </div>
            <div className="line">
                <span className="container">
                    {location &&
                        <span className="location">location: {location}</span>
                    }
                </span>
                <dl className="event__counts">
                    {counters.map(({ icon, count, className }) => {
                        if (count > 0) {
                            return [
                                <dt className={className}><i className={icon}/></dt>,
                                <dd className={className}>{count}</dd>,
                            ]
                        }
                    })}
                </dl>
            </div>
        </ListItem>
    )
}

EventItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired,
}
