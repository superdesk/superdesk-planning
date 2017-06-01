import React from 'react'
import { connect } from 'react-redux'
import { RelatedPlannings } from './index'
import { ITEM_STATE } from '../constants'
import * as selectors from '../selectors'
import { get } from 'lodash'

export function SpikeAgendaConfirmationComponent({ agenda, plannings }) {
    return (
        <div>
            <p>Are you sure you want to {agenda.state === ITEM_STATE.SPIKED && 'unspike' || 'spike'} {agenda.name} ?</p>
            {plannings.length &&
                <div>
                    This agenda contains:
                    <ul>
                        <RelatedPlannings plannings={plannings} openPlanningItem={true}/>
                    </ul>
                </div>
            || <div>This agenda is empty</div>
            }
        </div>
    )
}

SpikeAgendaConfirmationComponent.propTypes = {
    agenda: React.PropTypes.object,
    plannings: React.PropTypes.array,
}

const mapStateToProps = (state, ownProps) => ({
    plannings: Object.keys(selectors.getStoredPlannings(state))
        .filter((pKey) => (get(ownProps.agenda, 'planning_items', []).indexOf(pKey) > -1))
        .map((pKey) => (selectors.getStoredPlannings(state)[pKey])),
})

export const SpikeAgendaConfirmationContainer = connect(
    mapStateToProps
)(SpikeAgendaConfirmationComponent)
