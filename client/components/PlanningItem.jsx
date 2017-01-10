import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'
import { Dropdown } from 'react-bootstrap'

export const PlanningItem = ({ item, onClick, active, onDelete }) => {
    const location = get(item, 'event_item.location[0].name')
    const eventTime = get(item, 'event_item.dates.start') ?
        moment(get(item, 'event_item.dates.start')).format('LL HH:mm') : null
    const classes = ['ListItem__list-item', 'list-item-view', (active ? 'active' : null)].join(' ')
    return (
        <li className={classes}>
            <div className="media-box media-text">
                <div className="list-field type-icon">
                    <i className="filetype-icon-text" />
                </div>
                <div className="item-info" onClick={onClick.bind(null, item)}>
                    <div className="line">
                        <span className="keyword">{item.slugline}</span>
                        <span className="item-heading">{item.headline}</span>
                        <time title={eventTime}>{eventTime}</time>
                    </div>
                    <div className="line">
                        {location &&
                            <span className="container">
                                <span className="location">location: {location}</span>
                            </span>
                        }
                    </div>
                </div>
                <Dropdown className="ListItem__more-actions" id={`dropdownMenuFor${item._id}`}>
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
                        {onDelete &&
                            <li onClick={onDelete.bind(null, item)}>
                                <a><i className="big-icon-spike" /> Delete</a>
                            </li>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </li>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
}
