import React, { PropTypes } from 'react'
import { get, capitalize } from 'lodash'
import { ListItem, TimePlanning, DueDate, tooltips } from '../index'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ITEM_STATE } from '../../constants'
import classNames from 'classnames'
import './style.scss'

const getCoverageIcon = (type) => {
    const coverageIcons = {
        text: 'icon-text',
        video: 'icon-video',
        live_video: 'icon-video',
        audio: 'icon-audio',
        photo: 'icon-photo',
    }
    return get(coverageIcons, type, 'icon-file')
}

const PlanningItem = ({
        item,
        agendas,
        event,
        onClick,
        active,
        onSpike,
        onUnspike,
        privileges,
        onDoubleClick,
        itemLocked,
        itemLockedInThisSession,
        onAgendaClick,
    }) => {
    const location = get(event, 'location[0].name')
    const dueDates = get(item, 'coverages', []).map((c) => (get(c, 'planning.scheduled'))).filter(d => (d))
    const coveragesTypes = get(item, 'coverages', []).map((c) => get(c, 'planning.g2_content_type'))

    const itemSpiked = item && get(item, 'state', 'active') === ITEM_STATE.SPIKED
    const eventSpiked = event ? get(event, 'state', 'active') === ITEM_STATE.SPIKED : false

    const showSpikeButton = (!itemLocked || itemLockedInThisSession) &&
        privileges.planning_planning_spike === 1 && !itemSpiked && !eventSpiked

    const showUnspikeButton = (!itemLocked || itemLockedInThisSession) &&
        privileges.planning_planning_unspike === 1 && itemSpiked && !eventSpiked

    return (
        <ListItem
            item={item}
            className={classNames('PlanningItem',
            { 'PlanningItem--locked': itemLocked })}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            active={active}>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    {itemSpiked &&
                        <span className="label label--alert">spiked</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                            <span className="ListItem__slugline">{item.slugline}</span>
                        }
                        <span className="ListItem__headline">{item.headline}</span>
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
                        <span key={i}>
                            <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip id={`${i}${c}`}>
                                        {capitalize(c).replace(/_/g, ' ')}
                                    </Tooltip>
                                }>
                                <i className={getCoverageIcon(c)}/>
                            </OverlayTrigger>
                            &nbsp;
                        </span>
                    ))}
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {location}
                    </span>&nbsp;
                    {item.agendas &&
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {item.agendas.map((agendaId) => {
                                const agenda = agendas.find((agenda) => agenda._id === agendaId)

                                if (!agenda) {
                                    return null
                                }

                                let style = agenda.is_enabled ? 'label--primary' : 'label--light'

                                return ( <span key={'agenda-label-'+ agenda._id}
                                    className={`label ${style}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAgendaClick(agenda._id)
                                    }}>
                                    {agenda.name}
                                </span>)
                            })}
                        </span>
                    }
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
    agendas: PropTypes.array.isRequired,
    event: PropTypes.object,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSpike: PropTypes.func,
    onUnspike: PropTypes.func,
    privileges: PropTypes.object,
    itemLocked: React.PropTypes.bool,
    itemLockedInThisSession: React.PropTypes.bool,
    onAgendaClick: React.PropTypes.func,
}

export default PlanningItem
