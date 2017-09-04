import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getSelectedEventsObjects } from '../../selectors'
import classNames from 'classnames'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { every, some } from 'lodash'
import { eventUtils } from '../../utils'

function MultiEventsSelectionActions({
    selectedEvents,
    className,
    selectAll,
    deselect,
    createPlanning,
    spike,
    unspike,
    privileges,
    session,
}) {
    const count = selectedEvents.length
    const classes = classNames('MultiSelectionActions', className)

    const showSpike = every(selectedEvents, (event) => eventUtils.canSpikeEvent(event, session, privileges))
    const showUnspike = some(selectedEvents, (event) => eventUtils.canUnspikeEvent(event, privileges))
    const showCreatePlan = every(selectedEvents, (event) => eventUtils.canCreatePlanningFromEvent(event,
        session, privileges))

    return (
        <div className={classes}>
            <div className="MultiSelectionActions__info">
                {count} selected event{count > 1 && 's'}&nbsp;
                <a onClick={selectAll}>select&nbsp;all</a>&nbsp;/&nbsp;
                <a onClick={deselect}>deselect</a>
            </div>
            <div className="MultiSelectionActions__actions">
                { showCreatePlan && (
                    <button
                        onClick={createPlanning}
                        className="btn btn--primary MultiEventsSelectionActions__create-plan">
                        Create a planning
                    </button>
                )}
                { showSpike && (
                    <button
                        onClick={spike}
                        className="btn btn--warning MultiEventsSelectionActions__spike">
                        <i className="icon-trash"/> Spike
                    </button>
                )}
                { showUnspike && (
                    <button
                        onClick={unspike}
                        className="btn btn--warning MultiEventsSelectionActions__unspike">
                        <i className="icon-unspike"/> Unspike
                    </button>
                )}
            </div>
        </div>
    )
}

MultiEventsSelectionActions.propTypes = {
    selectedEvents: PropTypes.array.isRequired,
    className: PropTypes.string,
    selectAll: PropTypes.func.isRequired,
    deselect: PropTypes.func.isRequired,
    createPlanning: PropTypes.func.isRequired,
    spike: PropTypes.func.isRequired,
    unspike: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
}

const mapStateToProps = (state) => ({
    selectedEvents: getSelectedEventsObjects(state),
    privileges: selectors.getPrivileges(state),
    session: selectors.getSessionDetails(state),
})

const mapDispatchToProps = (dispatch) => ({
    selectAll: () => dispatch(actions.selectAllTheEventList()),
    deselect: () => dispatch(actions.deselectAllTheEventList()),
    addEventToCurrentAgenda: (events) => dispatch(actions.askForAddEventToCurrentAgenda(events)),
    spikeEvent: (event) => dispatch(actions.events.ui.openBulkSpikeModal(event)),
    unspikeEvent: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
})

const mergeProps = (stateProps, dispatchProps, ownProps) => (
    {
        ...ownProps,
        ...stateProps,
        ...dispatchProps,
        createPlanning: () => dispatchProps.addEventToCurrentAgenda(stateProps.selectedEvents),
        spike: () => dispatchProps.spikeEvent(stateProps.selectedEvents),
        unspike: () => dispatchProps.unspikeEvent(stateProps.selectedEvents),
    }
)

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(MultiEventsSelectionActions)
