import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, ItemIcon} from '../index';
import {eventUtils, lockUtils, actionUtils} from '../../utils';
import {PRIVILEGES, EVENTS} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {get} from 'lodash';

export class EventPreviewHeaderComponent extends React.PureComponent {
    render() {
        const {
            users,
            privileges,
            item,
            lockedItems,
            session,
            onUnlock,
            itemActionDispatches,
        } = this.props;

        const itemActionsCallBack = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: itemActionDispatches[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: itemActionDispatches[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: itemActionDispatches[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
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
        const itemActions = eventUtils.getEventActions(item, session, privileges, lockedItems, itemActionsCallBack,
            true);
        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        return (
            <Tools topTools={true}>
                <ItemIcon item={item} />
                {lockRestricted &&
                    <LockContainer
                        lockedUser={lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege}
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

EventPreviewHeaderComponent.propTypes = {
    item: PropTypes.object,
    session: PropTypes.object,
    privileges: PropTypes.object,
    users: PropTypes.array,
    lockedItems: PropTypes.object,
    duplicateEvent: PropTypes.func,
    onUnlock: PropTypes.func,
    itemActionDispatches: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.getEventPreviewRelatedDetails(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.locks.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
    itemActionDispatches: actionUtils.getActionDispatches({dispatch: dispatch, eventOnly: true}),
});

export const EventPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(EventPreviewHeaderComponent);
