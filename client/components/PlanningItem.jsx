import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import * as actions from '../actions'
import { get } from 'lodash'

export const PlanningItemComponent = ({ item, onPlanningClick }) => {
    const location = get(item, 'event_item.location[0].name')
    const eventTime = get(item, 'event_item.dates.start') ?
        moment(get(item, 'event_item.dates.start')).format('LL HH:mm') : null
    return (
        <li className="list-item-view" onClick={onPlanningClick.bind(null, item._id)}>
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

PlanningItemComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onPlanningClick: PropTypes.func.isRequired
}

const mapDispatchToProps = (dispatch) => ({
    onPlanningClick: (planning) => (dispatch(actions.openPlanningEditor(planning)))
})

export const PlanningItem = connect(null, mapDispatchToProps)(PlanningItemComponent)
