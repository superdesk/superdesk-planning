import React from 'react'
import { connect } from 'react-redux'
import { RelatedPlannings } from '../components'
import * as selectors from '../selectors'
import { get } from 'lodash'
import { openPlanningEditorAndAgenda } from '../actions'

export function RemoveAgendaConfirmationComponent({ agenda, plannings, handlePlanningClick }) {
    return (
        <div>
            <p>Are you sure you want to delete {agenda.name} ?</p>
            {plannings.length &&
                <div>
                    This agenda contains:
                    <ul>
                        <RelatedPlannings plannings={plannings} onPlanningClick={handlePlanningClick}/>
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
    handlePlanningClick: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
    plannings: Object.keys(selectors.getStoredPlannings(state))
        .filter((pKey) => (get(ownProps.agenda, 'planning_items', []).indexOf(pKey) > -1))
        .map((pKey) => (selectors.getStoredPlannings(state)[pKey])),
})

const mapDispatchToProps = (dispatch) => ({
    handlePlanningClick: (planningId) => (
        dispatch(openPlanningEditorAndAgenda(planningId))
    ),
})

export const RemoveAgendaConfirmationContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(RemoveAgendaConfirmationComponent)
