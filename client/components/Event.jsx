import React, { PropTypes } from 'react'
import moment from 'moment'
import { eventIsAllDayLong } from '../utils'
import { Dropdown, MenuItem } from 'react-bootstrap'
import { get } from 'lodash'

export const Event = ({ event, onClick, actions }) => {
    // shows the time only if not an "all day long" event
    const time = eventIsAllDayLong(event.dates) ? '' : moment(event.dates.start).format('HH:mm')
    const location = get(event, 'location[0].name')
    const filesAttachedCount = get(event, 'files', []).length
    return (
        <li className="ListItem__list-item list-item-view">
            <div className="media-box media-text">
                <div className="item-info" onClick={onClick.bind(this, event)}>
                    <div className="line">
                        <div className="highlights-box" />
                        <span className="keyword">{event.name}</span>
                        <span className="item-heading">{event.definition_short}</span>
                        <time title={time}>{time}</time>
                    </div>
                    <div className="line">
                        <span className="container">
                            {location &&
                                <span className="location">location: {location}</span>
                            }
                        </span>
                        <dl className="counts">
                            {filesAttachedCount > 0 && [
                                <dt key="1" className="files-attached-count"><i className={'icon-desk-attach'}/></dt>,
                                <dd key="2" className="files-attached-count">{filesAttachedCount}</dd>,
                            ]}
                        </dl>
                    </div>
                </div>
                <Dropdown className="ListItem__more-actions" id={`dropdownMenuFor${event._id}`}>
                    <Dropdown.Toggle noCaret className="dropdown__toggle">
                        <i className="icon-dots-vertical" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown dropdown__menu more-activity-menu">
                        <li>
                            <div className="dropdown__menu-label">
                                Actions
                                <button className="dropdown__menu-close">
                                    <i className="icon-close-small" />
                                </button>
                            </div>
                        </li>
                        {actions.onDelete &&
                            <li onClick={actions.onDelete.bind(null, event)}><a>Delete</a></li>
                        }
                        <MenuItem divider />
                        {actions.onAddToAgendaClick &&
                            <li onClick={actions.onAddToAgendaClick.bind(null, event)}>
                                <a>Add to the current agenda</a>
                            </li>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </li>
    )
}

Event.propTypes = {
    onClick: PropTypes.func.isRequired,
    event: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
}
