import React, { PropTypes } from 'react'
import { get, capitalize, some } from 'lodash'
import { ListItem, TimePlanning, DueDate, tooltips } from '../index'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import classNames from 'classnames'
import { getCoverageIcon, isItemPublic, planningUtils, isItemSpiked } from '../../utils/index'
import './style.scss'

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
    const coverages = get(item, 'coverages', [])
    const dueDates = get(item, '_coverages', []).map((c) => (get(c, 'scheduled'))).filter(d => (d))
    const coveragesTypes = planningUtils.mapCoverageByDate(coverages)
    const isScheduled = some(coverages, (c) => (get(c, 'planning.scheduled')))
    const itemSpiked = isItemSpiked(item)
    const eventSpiked = isItemSpiked(event)
    const notForPublication = item ? get(item, 'flags.marked_for_not_publication', false) : false

    const showSpikeButton = (!itemLocked || itemLockedInThisSession) &&
        privileges.planning_planning_spike === 1 && !itemSpiked && !eventSpiked

    const showUnspikeButton = (!itemLocked || itemLockedInThisSession) &&
        privileges.planning_planning_unspike === 1 && itemSpiked && !eventSpiked

    const isPublic = isItemPublic(get(item, 'pubstatus'))
    const isKilled = get(item, 'state') === 'killed'

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
                    {notForPublication &&
                        <span className="state-label not-for-publication">Not for Publication</span>
                    }
                    {isPublic &&
                        <span className="state-label state-published">Public</span>
                    }
                    {isKilled &&
                        <span className="state-label state-killed">Killed</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                            <span className="ListItem__slugline">{item.slugline}</span>
                        }
                        <span className="ListItem__headline">{item.headline}</span>
                    </span>
                    {event &&
                        <span className="PlanningItem__event sd-no-wrap">
                            <TimePlanning event={event}/>
                            <i className="icon-calendar-list"/>
                        </span>
                    }
                </div>
                <div className="sd-list-item__row">
                    {coveragesTypes.map((c, i) => (
                        <span key={i} style={{ display:'inherit' }}>
                            <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip id={`${i}${c.g2_content_type}`}>
                                        {capitalize(c.g2_content_type).replace(/_/g, ' ')}
                                    </Tooltip>
                                }>
                                <i className={getCoverageIcon(c.g2_content_type) + ` ${c.iconColor}`}/>
                            </OverlayTrigger>
                            &nbsp;
                        </span>
                    ))}
                    <span className="sd-overflow-ellipsis">
                        {location}
                    </span>&nbsp;
                    {item.agendas &&
                        <span className="sd-list-item--element-grow">
                            {item.agendas.map((agendaId) => {
                                const agenda = agendas.find((agenda) => agenda._id === agendaId)

                                if (!agenda) {
                                    return null
                                }

                                let style = agenda.is_enabled ? 'label--primary label--hollow' : 'label--hollow'

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
                        <span className="PlanningItem__dueDate sd-no-wrap">
                            <DueDate dates={dueDates}/>
                            {isScheduled && <i className="icon-bell"/>}
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
    itemLocked: PropTypes.bool,
    itemLockedInThisSession: PropTypes.bool,
    onAgendaClick: PropTypes.func,
}

export default PlanningItem
