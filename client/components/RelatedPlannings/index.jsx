import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import './style.scss'
import * as actions from '../../actions'
import { WORKFLOW_STATE } from '../../constants/index'

export const RelatedPlanningsComponent = ({ plannings, openPlanningItem, openPlanningClick, short }) => (
    <ul className="related-plannings">
        {plannings.map(({
            _id,
            slugline,
            headline,
            anpa_category,
            _agendas,
            original_creator: { display_name },
            state,
        }) => {
            const agendaElements = _agendas.map((_agenda) => (
                _agenda && <span key={_agenda._id}>
                    <a onClick={ openPlanningItem ? openPlanningClick.bind(null, _id, _agenda) : null}>
                        {
                            _agenda.is_enabled ? _agenda.name : `${_agenda.name} - [Disabled]`
                        }
                    </a>
                    </span>
                    )).reduce((accu, elem) => {
                        return accu === null ? [elem] : [accu, ', ', elem]
                    }, null)

            return (
                <li key={_id}>
                    <i className="icon-list-alt"/>&nbsp;
                        {state && state === WORKFLOW_STATE.SPIKED &&
                            <span className="label label--alert">spiked</span>
                        }
                    { short ? (
                        <span>{slugline || headline} in agenda { agendaElements }</span>
                        )
                        :
                        (
                           <span>{slugline || headline} created by { display_name } in agenda { agendaElements }
                           {anpa_category && anpa_category.length && (
                               <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                                )
                           }</span>
                        )
                        }
                </li>
            )
        })}
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
        return { ...planning }}),
})

const mapDispatchToProps = (dispatch) => ({
    openPlanningClick: (planningId, agenda) => (
        dispatch(actions.planning.ui.previewPlanningAndOpenAgenda(planningId, agenda))
    ),
})

export const RelatedPlannings = connect(mapStateToProps, mapDispatchToProps)(RelatedPlanningsComponent)

