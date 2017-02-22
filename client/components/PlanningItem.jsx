import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'
import { ListItem } from './index'

export const PlanningItem = ({ item, onClick, active, onDelete }) => {
    const location = get(item, 'event_item.location[0].name')
    const eventTime = get(item, 'event_item.dates.start') ?
        moment(get(item, 'event_item.dates.start')).format('LL HH:mm') : null
    return (
        <ListItem item={item} onClick={onClick.bind(null, item)} active={active}>
            <div className="line">
                <span className="keyword">{item.slugline}</span>
                <span className="item-heading">{item.headline}</span>
                <time title={eventTime}>{eventTime}</time>
            </div>
            <div className="line">
                {location &&
                    <span className="container">
                        <span className="location">location: {location}</span>
                    </span>
                }
            </div>
            <span className="ListItem__actions">
                <i className="icon-trash" onClick={(e)=>{e.stopPropagation(); onDelete(item)}}/>
            </span>
        </ListItem>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
}
