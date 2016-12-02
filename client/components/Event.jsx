import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../utils'
import { Dropdown, MenuItem } from 'react-bootstrap'
import { get } from 'lodash'
import { connect } from 'react-redux'
import * as actions from '../actions'

export const EventComponent = ({ event, onClick, actions }) => {
    // shows the time only if not an "all day long" event
    const time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')
    const location = get(event, 'location[0].name')
    return (
        <li className="event__list-item list-item-view">
            <div className="media-box media-text">
                <div className="item-info" onClick={onClick.bind(this, event)}>
                    <div className="line">
                        <div className="highlights-box"></div>
                        <span className="keyword">{event.name}</span>
                        <span className="item-heading">{event.definition_short}</span>
                        <time title={time}>{time}</time>
                    </div>
                    {location &&
                        <div className="line">
                            <span className="container">
                                <span className="location">location: {location}</span>
                            </span>
                        </div>
                    }
                </div>
                <Dropdown className="event__more-actions" id={`dropdownMenuFor${event._id}`}>
                    <Dropdown.Toggle noCaret className="dropdown__toggle">
                        <i className="icon-dots-vertical"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown dropdown__menu more-activity-menu">
                        <li>
                            <div className="dropdown__menu-label">
                                Actions
                                <button className="dropdown__menu-close">
                                    <i className="icon-close-small"></i>
                                </button>
                            </div>
                        </li>
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
            </div>
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
