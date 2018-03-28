import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, ItemIcon} from '../index';
import {planningUtils, lockUtils, actionUtils} from '../../utils';
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
            agendas,
            itemActionDispatches
        } = this.props;
        const inPlanning = currentWorkspace === WORKSPACE.PLANNING;
        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        const itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: itemActionDispatches[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: itemActionDispatches[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName],
            [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                    itemActionDispatches[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
        };

        const itemActions = inPlanning ? planningUtils.getPlanningActions({
            item: item,
            event: event,
            session: session,
            privileges: privileges,
            lockedItems: lockedItems,
            agendas: agendas,
            callBacks: itemActionsCallBack}) : null;

        return (
            <Tools topTools={true}>
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
    agendas: PropTypes.array,
    lockedItems: PropTypes.object,
    duplicateEvent: PropTypes.func,
    onUnlock: PropTypes.func,
    lockedInThisSession: PropTypes.bool,
    currentWorkspace: PropTypes.string,
    event: PropTypes.object,
    itemActionDispatches: PropTypes.object,
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
    agendas: selectors.getAgendas(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (planning) => (dispatch(actions.planning.ui.unlockAndOpenEditor(planning))),
    itemActionDispatches: actionUtils.getActionDispatches({dispatch: dispatch}),
});

export const PlanningPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewHeaderComponent);
