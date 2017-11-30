import React from 'react';
import PropTypes from 'prop-types';
import {WorkqueueList} from '../../components';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';

/* eslint-disable react/no-unused-prop-types*/
class WorkqueueComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const props = this.props;

        return (
            <div>
                <WorkqueueList {...props} />
            </div>
        );
    }
}

WorkqueueComponent.propTypes = {
    workqueueItems: PropTypes.object,
    currentPlanningId: PropTypes.string,
    currentEvent: PropTypes.string,
    isEventListShown: PropTypes.bool,
    closePlanningItem: PropTypes.func,
    openPlanningClick: PropTypes.func,
    openEventDetails: PropTypes.func,
    closeEventDetails: PropTypes.func,
    toggleEventsList: PropTypes.func,
};

const mapStateToProps = (state) => ({
    workqueueItems:
    {
        Plannings: selectors.getLockedPlannings(state),
        Events: selectors.getLockedEvents(state),
    },
    currentPlanningId: selectors.getCurrentPlanningId(state),
    currentEvent: selectors.getHighlightedEvent(state),
    isEventListShown: selectors.isEventListShown(state),
});

const mapDispatchToProps = (dispatch) => ({
    closePlanningItem: (planning) => (dispatch(actions.planning.ui.unlockAndCloseEditor(planning))),
    openPlanningClick: (planning, agendaId) => (
        dispatch(actions.planning.ui.openPlanningWithAgenda(planning, agendaId))
    ),
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    closeEventDetails: (event) => (dispatch(actions.events.ui.unlockAndCloseEditor(event))),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
});

export const WorkqueueContainer = connect(
    mapStateToProps, mapDispatchToProps
)(WorkqueueComponent);
/* eslint-enable*/
