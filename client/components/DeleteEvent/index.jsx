import React from 'react'
import { RelatedPlannings } from '../../containers'

export const DeleteEvent = ({ eventDetail }) => {
    return (
        <div>
            Delete event: &nbsp;<label>{eventDetail.name}</label>
            { eventDetail._plannings && eventDetail._plannings.length > 0 && (
                <div>
                    <br/>Related Plannings for this event&nbsp;<br/>
                    <RelatedPlannings plannings={eventDetail._plannings} openPlanningItem={true}/>
                </div>
            )}
        </div>
    )
}

DeleteEvent.propTypes = { eventDetail: React.PropTypes.object.isRequired }
