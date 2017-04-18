import React from 'react'
import { connect } from 'react-redux'
import { RelatedPlannings } from '../containers'
import * as selectors from '../selectors'
import { get } from 'lodash'

export function RemoveAgendaConfirmationComponent({ agenda, plannings }) {
    return (
        <div>
            <p>Are you sure you want to delete {agenda.name} ?</p>
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

RemoveAgendaConfirmationComponent.propTypes = {
    agenda: React.PropTypes.object,
    plannings: React.PropTypes.array,
}

const mapStateToProps = (state, ownProps) => ({
    plannings: Object.keys(selectors.getStoredPlannings(state))
        .filter((pKey) => (get(ownProps.agenda, 'planning_items', []).indexOf(pKey) > -1))
        .map((pKey) => (selectors.getStoredPlannings(state)[pKey])),
})

export const RemoveAgendaConfirmationContainer = connect(
    mapStateToProps
)(RemoveAgendaConfirmationComponent)
