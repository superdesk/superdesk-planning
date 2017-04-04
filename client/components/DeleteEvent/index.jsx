import React from 'react'
import { RelatedPlannings } from '../index'

export const DeleteEvent = ({ eventDetail, handlePlanningClick }) => {
    return (
        <div>
            Delete event: &nbsp;<label>{eventDetail.name}</label>
            { eventDetail._plannings && eventDetail._plannings.length > 0 && (
                <div>
                    <br/>Related Plannings for this event&nbsp;<br/>
                    <RelatedPlannings plannings={eventDetail._plannings} onPlanningClick={handlePlanningClick}/>
                </div>
            )}
        </div>
    )
}

DeleteEvent.propTypes = {
    eventDetail: React.PropTypes.object.isRequired,
    handlePlanningClick: React.PropTypes.func.isRequired,
}
