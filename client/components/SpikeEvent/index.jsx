import React from 'react'
import { RelatedPlannings } from '../index'
import { ITEM_STATE } from '../../constants'
import { get } from 'lodash'

export const SpikeEvent = ({ eventDetail }) => {
    const eventSpiked = get(eventDetail, 'state', ITEM_STATE.ACTIVE) === ITEM_STATE.SPIKED
    const actionName = eventSpiked ? 'Unspike' : 'Spike'

    eventDetail._plannings = eventDetail._plannings || []
    const activePlannings = eventDetail._plannings.filter(
        (item) => (get(item, 'state', ITEM_STATE.ACTIVE) !== ITEM_STATE.SPIKED)
    )

    return (
        <div>
            {actionName} event: &nbsp;<label>{eventDetail.name}</label><br/>

            {eventSpiked && eventDetail._plannings.length > 0 && (
                <div>
                    <br/>Related Plannings for this event&nbsp;<br/>
                    <RelatedPlannings plannings={eventDetail._plannings} openPlanningItem={true}/>
                </div>
            )
            || !eventSpiked && activePlannings.length > 0 && (
                <div className="sd-alert sd-alert--hollow sd-alert--alert">
                     <strong>This will also spike the following planning items</strong>
                    <RelatedPlannings plannings={activePlannings} openPlanningItem={true}/>
                </div>
            )}
        </div>
    )
}

SpikeEvent.propTypes = { eventDetail: React.PropTypes.object.isRequired }
