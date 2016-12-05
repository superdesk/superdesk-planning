import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import * as actions from '../actions'

export const PlanningItemComponent = ({ item, onPlanningClick }) => {
    const time = moment(item._updated).format('LL HH:mm')
    return (
        <li className="list-item-view" onClick={onPlanningClick.bind(null, item._id)}>
            <div className="media-box media-text">
                <div className="list-field type-icon">
                    <i className="filetype-icon-text"></i>
                </div>
                <div className="item-info">
                    <div className="line">
                        <div className="highlights-box"></div>
                        <span className="keyword">{item.slugline}</span>
                        <span className="item-heading">{item.headline}</span>
                        <time title={time}>
                            {time}
                        </time>
                    </div>
                    <div className="line">
                        <span className="container" title="location: workspace">
                            <span className="location-desk-label">location:</span>
                        </span>
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
