import React from 'react';
import PropTypes from 'prop-types';
import {WorkqueueList} from '../../components';
import {connect} from 'react-redux';
import {MODALS} from '../../constants';
import * as actions from '../../actions';
import * as selectors from '../../selectors';

/* eslint-disable react/no-unused-prop-types*/
class WorkqueueComponent extends React.Component {
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
    openConfirmationModal: PropTypes.func,
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
    autosavedPlanningItems: selectors.getAutosavePlanningItems(state),
    autosavedEventItems: selectors.getAutosaveEventItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    unlockAndClosePlanningItem: (planning) => (dispatch(actions.planning.ui.unlockAndCloseEditor(planning))),
    openPlanningClick: (planning, agendaId) => (
        dispatch(actions.planning.ui.openPlanningWithAgenda(planning, agendaId))
    ),
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    unlockAndCloseEventItem: (event) => (dispatch(actions.events.ui.unlockAndCloseEditor(event))),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    openConfirmationModal: (actionCallBack, ignoreCallBack) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            title: 'Save changes?',
            body: 'There are some unsaved changes, do you want to save it now?',
            okText: 'GO-TO',
            showIgnore: true,
            action: actionCallBack,
            ignore: ignoreCallBack,
        },
    })),
});

export const WorkqueueContainer = connect(
    mapStateToProps, mapDispatchToProps
)(WorkqueueComponent);
/* eslint-enable*/
