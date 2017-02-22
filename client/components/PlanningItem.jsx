import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'
import { ListItem } from './index'

export const PlanningItem = ({ item, onClick, active, onDelete }) => {
    const location = get(item, 'event_item.location[0].name')
    const eventTime = get(item, 'event_item.dates.start') ?
        moment(get(item, 'event_item.dates.start')).format('LL HH:mm') : null
    const actions = [
        {
            action: onDelete.bind(null, item),
            label: 'Delete',
        }
    ]
    return (
        <ListItem item={item} onClick={onClick.bind(this, item)} actions={actions} active={active} draggable={true}>
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
        </ListItem>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
}
