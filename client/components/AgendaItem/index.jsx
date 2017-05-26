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
        <li className="AgendaItem">
            <h6 onClick={onClick.bind(this, agenda)}>{agenda.name}</h6>
            <div className="last-updated">
                ({get(agenda, 'planning_items.length', '0')})
                &nbsp;created {moment(agenda._created).fromNow()}
            </div>
            {!isSpiked &&
                <div className="actions">
                    {privileges.planning_agenda_management === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.editAgendaTooltip}>
                            <button onClick={editEvent.bind(this, agenda)}>
                                <i className="icon-pencil"/>
                            </button>
                        </OverlayTrigger>
                    }
                    {privileges.planning_agenda_spike === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.spikeAgendaTooltip}>
                            <button onClick={spikeEvent.bind(this, agenda)}>
                                <i className="icon-trash"/>
                            </button>
                        </OverlayTrigger>
                    }
                </div>
            ||
                <div className="actions">
                    {privileges.planning_agenda_unspike === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.unspikeAgendaTooltip}>
                            <button onClick={spikeEvent.bind(this, agenda)}>
                                <i className="icon-unspike"/>
                            </button>
                        </OverlayTrigger>
                    }
                </div>
            }
        </li>
    )
}

AgendaItem.propTypes = {
    agenda: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    editEvent: PropTypes.func,
    spikeEvent: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
}
