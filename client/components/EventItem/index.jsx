import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import { ListItem, TimeEvent, PubStatusLabel, Checkbox } from '../index'
import './style.scss'
import { OverlayTrigger } from 'react-bootstrap'
import { ITEM_STATE } from '../../constants'
import {
    spikeEventTooltip,
    unspikeEventTooltip,
} from '../Tooltips'
import classNames from 'classnames'

export const EventItem = ({
        event,
        onClick,
        onDoubleClick,
        onSpikeEvent,
        onUnspikeEvent,
        highlightedEvent,
        privileges,
        isSelected,
        onSelectChange,
        itemLocked,
        itemLockedInThisSession,
        className,
    }) => {
    const hasBeenCanceled = get(event, 'occur_status.qcode') === 'eocstat:eos6'
    const hasBeenSpiked = get(event, 'state', 'active') === ITEM_STATE.SPIKED
    const hasSpikePrivileges = get(privileges, 'planning_event_spike', 0) === 1
    const hasUnspikePrivileges = get(privileges, 'planning_event_unspike', 0) === 1
    return (
        <ListItem
            item={event}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            draggable={true}
            className={classNames('event',
                className,
                { 'event--has-planning': event._hasPlanning },
                { 'event--has-been-canceled': hasBeenCanceled },
                { 'event--locked': itemLocked })}
            active={highlightedEvent === event._id || isSelected}
        >
            <div className="sd-list-item__action-menu">
                <Checkbox value={isSelected} onChange={({ target }) => {onSelectChange(target.value)}}/>
            </div>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    {hasBeenSpiked &&
                        <span className="label label--alert">spiked</span>
                    }
                    <PubStatusLabel status={event.state}/>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow event__title">
                        {event.slugline &&
                            <span className="ListItem__slugline">{event.slugline}</span>
                        }
                        <span className="ListItem__headline">{event.name}</span>
                    </span>
                    <TimeEvent event={event}/>
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                {!hasBeenSpiked && hasSpikePrivileges &&
                    (!itemLocked || itemLockedInThisSession) &&
                    <OverlayTrigger placement="left" overlay={spikeEventTooltip}>
                        <button
                            className="dropdown__toggle"
                            onClick={(e) => {
                                e.stopPropagation()
                                onSpikeEvent(event)
                            }}>
                            <i className="icon-trash"/>
                        </button>
                    </OverlayTrigger>
                }
                {hasBeenSpiked && hasUnspikePrivileges &&
                    (!itemLocked || itemLockedInThisSession) &&
                    <OverlayTrigger placement="left" overlay={unspikeEventTooltip}>
                        <button
                            className="dropdown__toggle"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUnspikeEvent(event)
                            }}>
                            <i className="icon-unspike"/>
                        </button>
                    </OverlayTrigger>
                }
            </div>
        </ListItem>
    )
}

EventItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    event: PropTypes.object.isRequired,
    onSpikeEvent: PropTypes.func.isRequired,
    onUnspikeEvent: PropTypes.func.isRequired,
    highlightedEvent: PropTypes.string,
    className: PropTypes.string,
    privileges: PropTypes.object,
    isSelected: PropTypes.bool,
    onSelectChange: PropTypes.func.isRequired,
    itemLocked: React.PropTypes.bool,
    itemLockedInThisSession: React.PropTypes.bool,
}
