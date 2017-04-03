import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'
import { ListItem } from './index'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const removeTooltip = <Tooltip id="tooltip">Remove the planning</Tooltip>

export const PlanningItem = ({ item, event, onClick, active, onDelete }) => {
    const location = get(event, 'location[0].name')
    const eventTime = get(event, 'dates.start') ?
        moment(get(event, 'dates.start')).format('LL HH:mm') : null
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
                <OverlayTrigger placement="left" overlay={removeTooltip}>
                    <i className="icon-trash" onClick={(e)=>{e.stopPropagation(); onDelete(item)}}/>
                </OverlayTrigger>
            </span>
        </ListItem>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    event: PropTypes.object,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
}
