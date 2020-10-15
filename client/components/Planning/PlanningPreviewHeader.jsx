import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, ItemIcon} from '../index';
import {planningUtils, lockUtils, actionUtils} from '../../utils';
import {PLANNING, PRIVILEGES, EVENTS, ICON_COLORS} from '../../constants';
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
            showUnlock,
            hideItemActions,
            event,
            agendas,
            itemActionDispatches,
            contentTypes,
        } = this.props;
        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_MANAGEMENT];
        const lockRestricted = planningUtils.isPlanningLockRestricted(item, session, lockedItems);

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
            [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName],
            [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]:
                itemActionDispatches[PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName],
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
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName],
        };

        const itemActions = !hideItemActions ? planningUtils.getPlanningActions({
            item: item,
            event: event,
            session: session,
            privileges: privileges,
            lockedItems: lockedItems,
            agendas: agendas,
            contentTypes: contentTypes,
            callBacks: itemActionsCallBack}) : null;

        return (
            <Tools topTools={true}>
                <ItemIcon
                    item={item}
                    color={ICON_COLORS.LIGHT_BLUE}
                    doubleSize={true}
                />

                {!lockRestricted ? null : (
                    <div className="side-panel__top-tools-left">
                        <LockContainer
                            lockedUser={lockedUser}
                            users={users}
                            showUnlock={unlockPrivilege && showUnlock}
                            withLoggedInfo={true}
                            onUnlock={onUnlock.bind(null, item)}
                            small={false}
                            noMargin={true}
                        />
                    </div>
                )}

                <div className="side-panel__top-tools-right">
                    {get(itemActions, 'length', 0) > 0 &&
                        <ItemActionsMenu actions={itemActions} />
                    }
                </div>
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
    event: PropTypes.object,
    itemActionDispatches: PropTypes.object,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    contentTypes: PropTypes.array,
};

const mapStateToProps = (state) => ({
    item: selectors.planning.currentPlanning(state),
    event: selectors.events.planningWithEventDetails(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    lockedItems: selectors.locks.getLockedItems(state),
    agendas: selectors.general.agendas(state),
    contentTypes: selectors.general.contentTypes(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (planning) => (dispatch(actions.locks.unlock(planning))),
    itemActionDispatches: actionUtils.getActionDispatches({dispatch: dispatch}),
});

export const PlanningPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewHeaderComponent);
