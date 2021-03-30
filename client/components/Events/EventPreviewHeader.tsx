import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Tools} from '../UI/SidePanel';
import {ItemActionsMenu, LockContainer, ItemIcon} from '../index';
import {eventUtils, lockUtils, actionUtils} from '../../utils';
import {PRIVILEGES, EVENTS, ICON_COLORS} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {get} from 'lodash';

export class EventPreviewHeaderComponent extends React.PureComponent {
    render() {
        const {
            users,
            privileges,
            calendars,
            item,
            lockedItems,
            session,
            onUnlock,
            itemActionDispatches,
            hideItemActions,
        } = this.props;

        const withMultiPlanningDate = true;
        const callBacks = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.SPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName],
            [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]:
                itemActionDispatches[EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName].bind(null, item),
        };
        const itemActions = !hideItemActions ?
            eventUtils.getEventActions({
                item,
                session,
                privileges,
                lockedItems,
                callBacks,
                withMultiPlanningDate,
                calendars,
            }) : null;
        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);
        const unlockPrivilege = !!privileges[PRIVILEGES.EVENT_MANAGEMENT];

        return (
            <Tools topTools={true}>
                <ItemIcon
                    item={item}
                    color={ICON_COLORS.DARK_BLUE_GREY}
                    doubleSize={true}
                />

                {lockRestricted && (
                    <div className="side-panel__top-tools-left">
                        <LockContainer
                            lockedUser={lockedUser}
                            users={users}
                            showUnlock={unlockPrivilege}
                            withLoggedInfo={true}
                            onUnlock={onUnlock.bind(null, item)}
                            small={false}
                            noMargin={true}
                        />
                    </div>
                )}

                {get(itemActions, 'length', 0) > 0 && (
                    <div className="side-panel__top-tools-right">
                        <ItemActionsMenu actions={itemActions} wide={true} />
                    </div>
                )}
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
    itemActionDispatches: PropTypes.object,
    hideItemActions: PropTypes.bool,
    duplicateEvent: PropTypes.func,
    onUnlock: PropTypes.func,
    calendars: PropTypes.array,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.getEventPreviewRelatedDetails(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    lockedItems: selectors.locks.getLockedItems(state),
    calendars: selectors.events.enabledCalendars(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (event) => dispatch(actions.locks.unlock(event)),
    itemActionDispatches: actionUtils.getActionDispatches({dispatch: dispatch, eventOnly: true}),
});

export const EventPreviewHeader = connect(mapStateToProps, mapDispatchToProps)(EventPreviewHeaderComponent);
