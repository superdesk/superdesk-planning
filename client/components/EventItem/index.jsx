import React, { PropTypes } from 'react'
import { get } from 'lodash'
import { ListItem, tooltips, TimeEvent } from '../index'
import './style.scss'
import { OverlayTrigger } from 'react-bootstrap'
import { ITEM_STATE } from '../../constants'

export const EventItem = ({ event, onClick, onDoubleClick, onSpikeEvent, onUnspikeEvent, selectedEvent, privileges }) => {
    const location = get(event, 'location[0].name')
    const hasBeenCanceled = get(event, 'occur_status.qcode') === 'eocstat:eos6'
    const hasBeenSpiked = get(event, 'state', 'active') === ITEM_STATE.SPIKED
    const hasSpikePrivileges = get(privileges, 'planning_event_spike', 0) === 1
    const hasUnspikePrivileges = get(privileges, 'planning_event_unspike', 0) === 1
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
        <ListItem
            item={event}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            draggable={true}
            className={classes}
            active={selectedEvent === event._id}
        >
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    {hasBeenSpiked &&
                        <span className="label label--alert">spiked</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow event__title">
                        {event.name}
                        {(event.definition_short && event.name !== event.definition_short) &&
                            <span>&nbsp;|&nbsp;{event.definition_short}</span>
                        }
                    </span>
                    <TimeEvent event={event}/>
                </div>
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {location &&
                            <span>Location: {location}&nbsp;</span>
                        }
                    </span>
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
                {!hasBeenSpiked && hasSpikePrivileges &&
                    <OverlayTrigger placement="left" overlay={tooltips.spikeEventTooltip}>
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
                    <OverlayTrigger placement="left" overlay={tooltips.unspikeEventTooltip}>
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
    onDoubleClick: React.PropTypes.func,
    event: PropTypes.object.isRequired,
    onSpikeEvent: PropTypes.func.isRequired,
    onUnspikeEvent: PropTypes.func.isRequired,
    selectedEvent: PropTypes.string,
    privileges: PropTypes.object,
}
