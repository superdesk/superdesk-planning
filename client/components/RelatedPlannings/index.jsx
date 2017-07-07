import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import './style.scss'
import * as selectors from '../../selectors'
import * as actions from '../../actions'

export const RelatedPlanningsComponent = ({ plannings, openPlanningItem, openPlanningClick, short }) => (
    <ul className="related-plannings">
        {plannings.map(({
            _id,
            slugline,
            headline,
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
                { short ? (
                    <a onClick={ openPlanningItem ? openPlanningClick.bind(null, _id) : null}>
                        {slugline || headline} in agenda {_agenda && _agenda.name}
                    </a>
                ) : (
                    <a onClick={ openPlanningItem ? openPlanningClick.bind(null, _id) : null}>
                        {slugline || headline} created by {display_name} in {_agenda && _agenda.name} agenda
                        {anpa_category && anpa_category.length && (
                            <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                        )}
                    </a>
                )}
            </li>
        ))}
    </ul>
)

RelatedPlanningsComponent.propTypes = {
    plannings: PropTypes.array.isRequired,
    openPlanningItem: PropTypes.bool,
    openPlanningClick: PropTypes.func.isRequired,
    short: PropTypes.bool,
}

RelatedPlanningsComponent.defaultProps = { short: false }

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
        dispatch(actions.planning.ui.previewPlanningAndOpenAgenda(planningId))
    ),
})

export const RelatedPlannings = connect(mapStateToProps, mapDispatchToProps)(RelatedPlanningsComponent)

