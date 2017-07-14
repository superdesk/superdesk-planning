import React, { PropTypes } from 'react'
import moment from 'moment'
import { tooltips } from '../index'
import { OverlayTrigger } from 'react-bootstrap'

export const AgendaItem = ({ agenda, onClick, editEvent, privileges }) => {
    return (
        <div className="sd-list-item sd-list-item--width50 sd-shadow--z1">
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border"
                 onClick={privileges.planning_agenda_management === 1 && onClick.bind(this, agenda)}>
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis">{agenda.name}</span>
                    <time>updated {moment(agenda._updated).fromNow()}</time>
                </div>
            </div>
            {
                <div className="sd-list-item__action-menu sd-list-item__action-menu--direction-row">
                    {privileges.planning_agenda_management === 1 &&
                        <OverlayTrigger placement="bottom" overlay={tooltips.editAgendaTooltip}>
                            <button onClick={editEvent.bind(this, agenda)} className="dropdown__toggle">
                                <i className="icon-pencil"/>
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
    privileges: PropTypes.object.isRequired,
}
