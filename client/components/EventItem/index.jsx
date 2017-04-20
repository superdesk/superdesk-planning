import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../../utils'
import { get } from 'lodash'
import { ListItem, tooltips } from '../index'
import './style.scss'
import { OverlayTrigger } from 'react-bootstrap'

export const EventItem = ({ event, onClick, deleteEvent, selectedEvent }) => {
    // shows the time only if not an "all day long" event
    const time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')
    const location = get(event, 'location[0].name')
    const hasBeenCanceled = get(event, 'occur_status.qcode') === 'eocstat:eos6'
    const counters = [
        {
            icon: 'icon-file',
            count: get(event, 'files.length', 0),
        },
        {
            icon: 'icon-link',
            count: get(event, 'links.length', 0),
        },
    ]
    const classes = [
        'event',
        event._hasPlanning ? 'event--has-planning' : null,
        hasBeenCanceled ? 'event--has-been-canceled' : null,
    ].join(' ')
    return (
        <ListItem item={event} onClick={onClick.bind(this, event)} deleteEvent={deleteEvent.bind(this, event)} draggable={true} className={classes} active={selectedEvent === event._id}>
        <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
            <div className="sd-list-item__row">
                <span className="sd-overflow-ellipsis sd-list-item--element-grow event__title">
                    {event.name}
                    {(event.definition_short && event.name !== event.definition_short) &&
                        <span>&nbsp;|&nbsp;{event.definition_short}</span>
                    }
                </span>
                <time title={time}>{time}</time>
            </div>
            <div className="sd-list-item__row">
                {location &&
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        Location: {location}&nbsp;
                    </span>
                }
                {counters.map(({ icon, count }) => {
                    if (count > 0) {
                        return (
                            <span key={icon}>
                                <i className={icon}/>&nbsp;{count}&nbsp;&nbsp;
                            </span>
                        )
                    }
                })}
            </div>
        </div>
        <div className="sd-list-item__action-menu">
            <OverlayTrigger placement="left" overlay={tooltips.deleteEventTooltip}>
                <button
                    className="dropdown__toggle"
                    onClick={(e)=>{e.stopPropagation(); deleteEvent(event)}}>
                    <i className="icon-trash"/>
                </button>
            </OverlayTrigger>
        </div>
        </ListItem>
    )
}

EventItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired,
    deleteEvent: PropTypes.func.isRequired,
    selectedEvent: PropTypes.string,
}
