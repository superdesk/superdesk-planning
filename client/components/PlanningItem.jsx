import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'
import { ListItem } from './index'
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from './index'

const coverageIcons = {
    text: 'icon-text',
    video: 'icon-video',
    audio: 'icon-audio',
    photo: 'icon-photo',
}
export const PlanningItem = ({ item, event, onClick, active, onDelete }) => {
    const location = get(event, 'location[0].name')
    const hasDueDate = get(item, 'coverages', []).some((c) => (get(c, 'planning.scheduled')))
    const coveragesTypes = get(item, 'coverages', []).map((c) => get(c, 'planning.g2_content_type'))
    const eventTime = get(event, 'dates.start') ?
        moment(get(event, 'dates.start')).format('LL HH:mm') : null
    return (
        <ListItem
            item={item}
            onClick={onClick.bind(null, item)}
            active={active}>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline}
                        {(item.headline && item.slugline !== item.headline) &&
                            <span>&nbsp;|&nbsp;{item.headline}</span>
                        }
                    </span>
                    <time title={eventTime}>{eventTime}</time>
                </div>
                <div className="sd-list-item__row">
                    {coveragesTypes.map((c) => (
                        <span><i className={coverageIcons[c]}/>&nbsp;</span>
                    ))}
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {location}
                    </span>&nbsp;
                    {hasDueDate &&
                        <span>
                            <i className="icon-time"/>
                        </span>
                    }
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                <OverlayTrigger placement="left" overlay={tooltips.deletePlanningTooltip}>
                    <button
                        className="dropdown__toggle"
                        onClick={(e)=>{e.stopPropagation(); onDelete(item)}}>
                        <i className="icon-trash"/>
                    </button>
                </OverlayTrigger>
            </div>
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
