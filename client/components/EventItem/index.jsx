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
    const filesAttachedCount = get(event, 'files', []).length
    const hasBeenCanceled = get(event, 'occur_status.qcode') === 'eocstat:eos6'
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
                <dl className="counts">
                    {filesAttachedCount > 0 && [
                        <dt key="1" className="files-attached-count"><i className={'icon-desk-attach'}/></dt>,
                        <dd key="2" className="files-attached-count">{filesAttachedCount}</dd>,
                    ]}
                </dl>
            </div>
        </ListItem>
    )
}

EventItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired,
}
