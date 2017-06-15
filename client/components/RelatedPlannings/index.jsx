import React from 'react'
import { connect } from 'react-redux'
import './style.scss'
import { previewPlanningAndOpenAgenda } from '../../actions'
import * as selectors from '../../selectors'

export const RelatedPlanningsComponent = ({ plannings, openPlanningItem, openPlanningClick }) => (
    <ul className="related-plannings">
        {plannings.map(({
            _id,
            slugline,
            anpa_category,
            _agenda,
            original_creator: { display_name },
            state,
        }) => (
            <li key={_id}>
                <i className="icon-list-alt"/>&nbsp;
                {state && state === 'spiked' &&
                    <span className="label label--alert">spiked</span>
                }
                <a onClick={ openPlanningItem ? openPlanningClick.bind(null, _id) : null}>
                    {slugline} created by {display_name} in {_agenda && _agenda.name} agenda
                    {anpa_category && anpa_category.length && (
                        <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                    )}
                </a>
            </li>
        ))}
    </ul>
)

RelatedPlanningsComponent.propTypes = {
    plannings: React.PropTypes.array.isRequired,
    openPlanningItem: React.PropTypes.bool,
    openPlanningClick: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
    plannings: ownProps.plannings.map((planning) => {
        return {
            ...planning,
            _agenda: selectors.getAgendas(state).find((a) => a.planning_items ?
                        a.planning_items.indexOf(planning._id) > -1 : false),
        }}),
})

const mapDispatchToProps = (dispatch) => ({
    openPlanningClick: (planningId) => (
        dispatch(previewPlanningAndOpenAgenda(planningId))
    ),
})

export const RelatedPlannings = connect(mapStateToProps, mapDispatchToProps)(RelatedPlanningsComponent)

