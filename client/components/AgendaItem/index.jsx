import React, { PropTypes } from 'react'
import { get } from 'lodash'
import moment from 'moment'
import { tooltips } from '../index'
import { OverlayTrigger } from 'react-bootstrap'
import { ITEM_STATE } from '../../constants'
import './style.scss'

export const AgendaItem = ({ agenda, onClick, editEvent, spikeEvent, privileges }) => {
    const isSpiked = 'state' in agenda && agenda.state === ITEM_STATE.SPIKED
    return (
        <div className="sd-list-item sd-shadow--z1">
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border" onClick={onClick.bind(this, agenda)}>
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis">{agenda.name}</span>
                    <time title="blabla">({get(agenda, 'planning_items.length', '0')})&nbsp;created {moment(agenda._created).fromNow()}</time>
                </div>
            </div>
            {!isSpiked &&
                <div className="sd-list-item__action-menu sd-list-item__action-menu--direction-row">
                    {privileges.planning_agenda_management === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.editAgendaTooltip}>
                            <button onClick={editEvent.bind(this, agenda)} className="dropdown__toggle">
                                <i className="icon-pencil"/>
                            </button>
                        </OverlayTrigger>
                    }
                    {privileges.planning_agenda_spike === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.spikeAgendaTooltip}>
                            <button onClick={spikeEvent.bind(this, agenda)} className="dropdown__toggle">
                                <i className="icon-trash"/>
                            </button>
                        </OverlayTrigger>
                    }
                </div>
            ||
                <div className="sd-list-item__action-menu sd-list-item__action-menu--direction-row">
                    {privileges.planning_agenda_unspike === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.unspikeAgendaTooltip}>
                            <button onClick={spikeEvent.bind(this, agenda)} className="dropdown__toggle">
                                <i className="icon-unspike"/>
                            </button>
                        </OverlayTrigger>
                    }
                </div>
            }
        </div>
    )
}

AgendaItem.propTypes = {
    agenda: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    editEvent: PropTypes.func,
    spikeEvent: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
}
