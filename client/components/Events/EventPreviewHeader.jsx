import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, AuditInformation} from '../index'
import {eventUtils, getLockedUser, getCreator, getItemInArrayById} from '../../utils'
import {GENERIC_ITEM_ACTIONS, PRIVILEGES} from '../../constants'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import {get} from 'lodash'

export class EventPreviewHeaderComponent extends React.Component {
	getEventActions() {
        const {
        	item,
            session,
            privileges,
            duplicateEvent,
            lockedItems,
        } = this.props;

        if (!get(item, '_id')) {
            return [];
        }

        const actions = [
            {
                ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                callback: () => {},	// Keeping this empty until we do ItemActions
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
		const {users, privileges, item, lockedItems, session, onUnlock} = this.props
		const itemActions = this.getEventActions();
		const lockedUser = getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

		return (
			<Tools useDefaultClassName={false} className='side-panel__top-tools'>
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
					className='side-panel__top-tools-right'
					actions={itemActions} />
			</Tools>
		)
	}
}

EventPreviewHeaderComponent.propTypes = {
    item: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
	item: selectors.events.eventWithRelatedDetails(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
});

export const EventPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(EventPreviewHeaderComponent);
