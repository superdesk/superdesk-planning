import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, ItemIcon} from '../index';
import {planningUtils, lockUtils} from '../../utils';
import {PLANNING, PRIVILEGES, WORKSPACE, EVENTS} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {get} from 'lodash';

export class PlanningPreviewHeaderComponent extends React.Component {
    render() {
        const {
            users,
            privileges,
            item,
            lockedItems,
            session,
            onUnlock,
            lockedInThisSession,
            currentWorkspace,
            event,
        } = this.props;
        const inPlanning = currentWorkspace === WORKSPACE.PLANNING;
        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        const itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
        };
        const itemActions = planningUtils.getPlanningActions(item, event, session, privileges,
            lockedItems, itemActionsCallBack);

        return (
            <Tools useDefaultClassName={false} className="side-panel__top-tools">
                <ItemIcon item={item} />
                {(!lockedInThisSession || !inPlanning) && lockedUser &&
                    <LockContainer
                        lockedUser={lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege && inPlanning}
                        withLoggedInfo={true}
                        onUnlock={onUnlock.bind(null, item)}
                    />
                }
                {get(itemActions, 'length', 0) > 0 && <ItemActionsMenu
                    className="side-panel__top-tools-right"
                    actions={itemActions} />}
            </Tools>
        );
    }
}

PlanningPreviewHeaderComponent.propTypes = {
    item: PropTypes.object,
    session: PropTypes.object,
    privileges: PropTypes.object,
    users: PropTypes.array,
    lockedItems: PropTypes.object,
    duplicateEvent: PropTypes.func,
    onUnlock: PropTypes.func,
    lockedInThisSession: PropTypes.bool,
    currentWorkspace: PropTypes.string,
    event: PropTypes.object,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.planning.currentPlanning(state),
    event: selectors.events.planningWithEventDetails(state),
    lockedInThisSession: selectors.planning.isCurrentPlanningLockedInThisSession(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.locks.getLockedItems(state),
    currentWorkspace: selectors.general.currentWorkspace(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (planning) => (dispatch(actions.planning.ui.unlockAndOpenEditor(planning))),
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
        (planning) => (dispatch(actions.planning.ui.duplicate(planning))),
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.spike(planning))),
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.unspike(planning))),
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelPlanningModal(planning)),
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelAllCoverageModal(planning)),
    [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
        (planning) => dispatch(actions.events.ui.createEventFromPlanning(planning)),
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
        (event) => dispatch(actions.events.ui.openCancelModal(event)),
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
        (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
        (event) => dispatch(actions.events.ui.updateTime(event)),
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
        (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
        (event) => dispatch(actions.events.ui.convertToRecurringEvent(event)),
});

export const PlanningPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewHeaderComponent);
