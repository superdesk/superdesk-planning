import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../utils'
import { Dropdown, MenuItem } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../actions'

export const EventComponent = ({ event, onClick, actions }) => {
    // shows the time only if not an "all day long" event
    let time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')

    return (
        <li className="event__list-item">
            <div className="event__wrapper" onClick={onClick.bind(this, event)}>
                <div className="event__unique-name">{event.name}</div>
                <div className="event__time">{time}</div>
                <div className="event__description">{event.definition_short}</div>
            </div>
            <Dropdown className="event__more-actions" id={`dropdownMenuFor${event._id}`}>
                <Dropdown.Toggle noCaret className="dropdown__toggle">
                    <i className="icon-dots-vertical"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown dropdown__menu more-activity-menu">
                    {actions.onDelete &&
                        <li onClick={actions.onDelete.bind(null, event)}><a>Delete</a></li>
                    }
                    <MenuItem divider />
                    {actions.onAddToAgendaClick &&
                        <li onClick={actions.onAddToAgendaClick.bind(null, event)}>
                            <a>Add to the calendar</a>
                        </li>
                    }
                </Dropdown.Menu>
            </Dropdown>
        </li>
    )
}

EventComponent.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired,
    actions: PropTypes.object,
}

const mapDispatchToProps = (dispatch) => ({
    actions: {
        onAddToAgendaClick: (event) => dispatch(actions.addEventToCurrentAgenda(event))
    }
})

export const Event = connect(null, mapDispatchToProps)(EventComponent)
