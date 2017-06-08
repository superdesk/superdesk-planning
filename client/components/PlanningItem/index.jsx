import React, { PropTypes } from 'react'
import { get } from 'lodash'
import { ListItem, TimePlanning, DueDate, tooltips } from '../index'
import { OverlayTrigger } from 'react-bootstrap'
import { ITEM_STATE } from '../../constants'
import './style.scss'

const coverageIcons = {
    text: 'icon-text',
    video: 'icon-video',
    audio: 'icon-audio',
    photo: 'icon-photo',
}

const PlanningItem = ({ item, event, agenda, onClick, active, onSpike, onUnspike, privileges, onDoubleClick }) => {
    const location = get(event, 'location[0].name')
    const dueDates = get(item, 'coverages', []).map((c) => (get(c, 'planning.scheduled'))).filter(d => (d))
    const coveragesTypes = get(item, 'coverages', []).map((c) => get(c, 'planning.g2_content_type'))

    const itemSpiked = item && get(item, 'state', 'active') === ITEM_STATE.SPIKED
    const agendaSpiked = agenda && get(agenda, 'state', 'active') === ITEM_STATE.SPIKED
    const eventSpiked = event ? get(event, 'state', 'active') === ITEM_STATE.SPIKED : false

    const showSpikeButton = privileges.planning_planning_spike === 1 &&
            !itemSpiked && !agendaSpiked && !eventSpiked

    const showUnspikeButton = privileges.planning_planning_unspike === 1 &&
            itemSpiked && !agendaSpiked && !eventSpiked

    return (
        <ListItem
            item={item}
            className="PlanningItem"
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            active={active}>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    {itemSpiked &&
                        <span className="label label--alert">spiked</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline}
                        {(item.headline && item.slugline !== item.headline) &&
                            <span>&nbsp;|&nbsp;{item.headline}</span>
                        }
                    </span>
                    {event &&
                        <span className="PlanningItem__event">
                            <TimePlanning event={event}/>
                            <i className="icon-calendar-list"/>
                        </span>
                    }
                </div>
                <div className="sd-list-item__row">
                    {coveragesTypes.map((c, i) => (
                        <span key={i}><i className={coverageIcons[c]}/>&nbsp;</span>
                    ))}
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {location}
                    </span>&nbsp;
                    {dueDates.length > 0 &&
                        <span className="PlanningItem__dueDate">
                            <DueDate dates={dueDates}/>
                            <i className="icon-bell"/>
                        </span>
                    }
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                {showSpikeButton &&
                    <OverlayTrigger placement="left" overlay={tooltips.spikePlanningTooltip}>
                        <button
                            className="dropdown__toggle"
                            onClick={(e) => {
                                e.stopPropagation()
                                onSpike(item)
                            }}>
                            <i className="icon-trash"/>
                        </button>
                    </OverlayTrigger>
                }
                {showUnspikeButton &&
                    <OverlayTrigger placement="left" overlay={tooltips.unspikePlanningTooltip}>
                        <button
                            className="dropdown__toggle"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUnspike(item)
                            }}>
                            <i className="icon-unspike" />
                        </button>
                    </OverlayTrigger>
                }
            </div>
        </ListItem>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    event: PropTypes.object,
    agenda: PropTypes.object,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSpike: PropTypes.func,
    onUnspike: PropTypes.func,
    privileges: PropTypes.object,
}

export default PlanningItem
