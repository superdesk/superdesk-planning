import React, { PropTypes } from 'react'
import { get, some } from 'lodash'
import { ListItem, TimePlanning, DueDate, ItemActionsMenu, StateLabel, Checkbox } from '../index'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import classNames from 'classnames'
import { GENERIC_ITEM_ACTIONS, EVENTS, PLANNING, WORKSPACE } from '../../constants'
import './style.scss'
import { getCoverageIcon, planningUtils, isItemCancelled, isItemRescheduled } from '../../utils/index'
import { getCurrentAgendaId } from '../../selectors'


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
        lockedItems,
        onAgendaClick,
        onDuplicate,
        onRescheduleEvent,
        session,
        users,
        desks,
        onCancelEvent,
        onUpdateEventTime,
        onPostponeEvent,
        onConvertToRecurringEvent,
        onCancelPlanning,
        onCancelAllCoverage,
        onSelectItem,
        isSelected,
        currentAgendaId,
        currentWorkspace,
    }) => {
    const location = get(event, 'location[0].name')
    const coverages = get(item, 'coverages', [])
    const dueDates = get(item, 'coverages', []).map((c) => (get(c, 'planning.scheduled'))).filter(d => (d))
    const coveragesTypes = planningUtils.mapCoverageByDate(coverages)
    const isScheduled = some(coverages, (c) => (get(c, 'planning.scheduled')))
    const notForPublication = item ? get(item, 'flags.marked_for_not_publication', false) : false

    const isCancelled = isItemCancelled(item)
    const isRescheduled = isItemRescheduled(item)

    const onEditOrPreview = planningUtils.canEditPlanning(item, session, privileges) ?
        onDoubleClick : onClick

    const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems)

    const inPlanning = currentWorkspace === WORKSPACE.PLANNING

    let itemActions = []
    if (inPlanning) {
        const actions = [
            {
                ...GENERIC_ITEM_ACTIONS.SPIKE,
                callback: onSpike.bind(null, item),
            },
            {
                ...GENERIC_ITEM_ACTIONS.UNSPIKE,
                callback: onUnspike.bind(null, item),
            },
            {
                ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                callback: onDuplicate.bind(null, item),
            },
            {
                ...PLANNING.ITEM_ACTIONS.CANCEL_PLANNING,
                callback: onCancelPlanning.bind(null, item),
            },
            {
                ...PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE,
                callback: onCancelAllCoverage.bind(null, item),
            },
            GENERIC_ITEM_ACTIONS.DIVIDER,
            {
                ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                callback: onCancelEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                callback: onUpdateEventTime.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                callback: onRescheduleEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                callback: onPostponeEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                callback: onConvertToRecurringEvent.bind(null, event),
            },
        ]

        itemActions = planningUtils.getPlanningItemActions(
            item,
            event,
            session,
            privileges,
            actions,
            lockedItems
        )
    }

    return (
        <ListItem
            item={item}
            className={classNames('PlanningItem',
                { 'PlanningItem--locked': isItemLocked },
                { 'PlanningItem--has-been-cancelled': isCancelled || isRescheduled }
            )}
            onClick={onClick}
            onDoubleClick={inPlanning ? onEditOrPreview : null}
            active={active}>
            {inPlanning &&
                <div className="sd-list-item__action-menu">
                    <Checkbox value={isSelected} onChange={onSelectItem}/>
                </div>
            }
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border"
                style={{ overflow: 'visible' }}>
                <div className="sd-list-item__row">
                    <StateLabel item={item}/>
                    {notForPublication &&
                        <span className="state-label not-for-publication">Not for Publication</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow PlanningItem__title">
                        {item.slugline &&
                            <span className="ListItem__slugline">{item.slugline}</span>
                        }
                        <span className="ListItem__headline">{item.description_text}</span>
                    </span>
                    {event &&
                        <span className="PlanningItem__event sd-no-wrap">
                            <TimePlanning event={event}/>
                            <i className="icon-calendar-list"/>
                        </span>
                    }
                </div>
                <div className="sd-list-item__row" style={{ overflow: 'visible' }}>
                    {coveragesTypes.map((c, i) => {
                        const assignedUserId = get(c, 'assigned_to.user')
                        const assignedDeskId = get(c, 'assigned_to.desk')

                        const user = !assignedUserId ? null :
                            users.find((u) => (u._id === assignedUserId))

                        const desk = !assignedDeskId ? null :
                            desks.find((d) => (d._id === assignedDeskId))

                        return (<span key={i} style={{ display:'inherit' }}>
                                <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip id={`${i}${c.g2_content_type}`}>
                                        {(!user && !desk) && 'Unassigned'}
                                        {desk && ('Desk: ' + desk.name)}
                                        <br />
                                        {user && ('User: ' + user.display_name)}
                                    </Tooltip>
                                    }>
                                    <i className={getCoverageIcon(c.g2_content_type) + ` ${c.iconColor}`}/>
                                </OverlayTrigger>
                            &nbsp;
                        </span>)
                    })}
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

                                if (agenda._id === currentAgendaId) {
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
                {itemActions.length > 0 &&
                    <ItemActionsMenu actions={itemActions}/>
                }
                {!inPlanning && !isItemLocked &&
                    <a data-sd-tooltip="Add as coverage" data-flow="left">
                        <button className="navbtn dropdown sd-create-btn">
                            <i className="icon-plus-large" />
                            <span className="circle" />
                        </button>
                    </a>
                }
            </div>
        </ListItem>
    )
}

const mapStateToProps = (state) => ({ currentAgendaId: getCurrentAgendaId(state) })

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    agendas: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    event: PropTypes.object,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSpike: PropTypes.func,
    onUnspike: PropTypes.func,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    onAgendaClick: PropTypes.func,
    onDuplicate: PropTypes.func,
    session: PropTypes.object,
    onCancelEvent: PropTypes.func,
    onUpdateEventTime: PropTypes.func,
    onRescheduleEvent: PropTypes.func,
    onPostponeEvent: PropTypes.func,
    onConvertToRecurringEvent: PropTypes.func,
    onCancelPlanning: PropTypes.func,
    onCancelAllCoverage: PropTypes.func,
    isSelected: PropTypes.bool,
    onSelectItem: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string,
    currentWorkspace: PropTypes.string,
}

export default connect(mapStateToProps)(PlanningItem)
