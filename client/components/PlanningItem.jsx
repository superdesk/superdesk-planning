import React, { PropTypes } from 'react'
import moment from 'moment'
import { get } from 'lodash'

export const PlanningItem = ({ item, onClick }) => {
    const location = get(item, 'event_item.location[0].name')
    const eventTime = get(item, 'event_item.dates.start') ?
        moment(get(item, 'event_item.dates.start')).format('LL HH:mm') : null
    return (
        <li className="list-item-view" onClick={onClick.bind(null, item)}>
            <div className="media-box media-text">
                <div className="list-field type-icon">
                    <i className="filetype-icon-text" />
                </div>
                <div className="item-info">
                    <div className="line">
                        <div className="highlights-box" />
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
            </div>
        </li>
    )
}

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
}
