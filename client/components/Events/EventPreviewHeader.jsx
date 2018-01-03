import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer} from '../index';
import {eventUtils, getLockedUser} from '../../utils';
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
        } = this.props;

        const itemActionsCallBack = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
        };
        const itemActions = eventUtils.getEventActions(item, session, privileges, lockedItems, itemActionsCallBack);
        const lockedUser = getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        return (
            <Tools useDefaultClassName={false} className="side-panel__top-tools">
                <i className="icon-calendar-list" />
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
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.eventWithRelatedDetails(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: (event) => dispatch(actions.duplicateEvent(event)),
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: (event) => dispatch(actions.events.ui.openCancelModal(event)),
});

export const EventPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(EventPreviewHeaderComponent);
