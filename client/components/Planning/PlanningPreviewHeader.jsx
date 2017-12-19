import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer} from '../index';
import {eventUtils, getLockedUser} from '../../utils';
import {GENERIC_ITEM_ACTIONS, PRIVILEGES} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {get} from 'lodash';

export class PlanningPreviewHeaderComponent extends React.Component {
    getEventActions() {
        const {
            item,
            session,
            privileges,
            lockedItems,
        } = this.props;

        if (!get(item, '_id')) {
            return [];
        }

        const actions = [
            {
                ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                callback: () => (true), // Keeping this empty until we do ItemActions
            },
        ];

        return eventUtils.getEventItemActions(
            item,
            session,
            privileges,
            actions,
            lockedItems
        );
    }

    render() {
        const {users, privileges, item, lockedItems, session, onUnlock} = this.props;
        const itemActions = this.getEventActions();
        const lockedUser = getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        return (
            <Tools useDefaultClassName={false} className="side-panel__top-tools">
                <i className="icon-calendar" />
                {lockRestricted &&
                    <LockContainer
                        lockedUser={lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege}
                        withLoggedInfo={true}
                        onUnlock={onUnlock.bind(null, item)}
                    />
                }
                <ItemActionsMenu
                    className="side-panel__top-tools-right"
                    actions={itemActions} />
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
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.planningWithEventDetails(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
});

export const PlanningPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewHeaderComponent);
