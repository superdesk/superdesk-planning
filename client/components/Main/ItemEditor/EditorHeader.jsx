import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {ITEM_TYPE, PRIVILEGES, KEYCODES, ICON_COLORS} from '../../../constants';
import {
    gettext,
    eventUtils,
    planningUtils,
    isItemPublic,
    lockUtils,
    onEventCapture,
    isExistingItem,
} from '../../../utils';

import {Button} from '../../UI';
import {Button as NavButton} from '../../UI/Nav';
import {Header} from '../../UI/SidePanel';
import {StretchBar} from '../../UI/SubNav';

import {LockContainer, ItemIcon} from '../../index';
import {EditorItemActions} from './index';

export class EditorHeader extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    componentWillMount() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        this.unregisterKeyBoardShortcuts();
    }

    unregisterKeyBoardShortcuts() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.ctrlKey && event.shiftKey) {
            if (event.keyCode === KEYCODES.S && this.props.dirty) {
                onEventCapture(event);
                this.props.onSave();
            } else if (event.keyCode === KEYCODES.E) {
                onEventCapture(event);
                this.props.cancel();
            }
        }
    }

    getEventStates(states) {
        const {
            item,
            lockedItems,
            session,
            privileges,
        } = this.props;

        states.showEdit = states.existingItem &&
            !states.isLockedInContext &&
            eventUtils.canEditEvent(item, session, privileges, lockedItems);

        if (states.isLockedInContext && get(states.itemLock, 'action') === 'edit') {
            states.canPost = eventUtils.canPostEvent(item, session, privileges, lockedItems);
            states.canUnpost = eventUtils.canUnpostEvent(item, session, privileges, lockedItems);
            states.canUpdate = eventUtils.canUpdateEvent(item, session, privileges, lockedItems);
            states.canEdit = eventUtils.canEditEvent(item, session, privileges, lockedItems);
        }
    }

    getPlanningStates(states) {
        const {
            item,
            diff,
            lockedItems,
            session,
            privileges,
        } = this.props;

        states.showEdit = states.existingItem &&
            !states.isLockedInContext &&
            planningUtils.canEditPlanning(item, null, session, privileges, lockedItems);

        if (states.isLockedInContext && get(states.itemLock, 'action') === 'edit') {
            states.canPost = planningUtils.canPostPlanning(diff, null, session, privileges, lockedItems);
            states.canUnpost = planningUtils.canUnpostPlanning(item, null, session, privileges, lockedItems);
            states.canUpdate = planningUtils.canUpdatePlanning(item, null, session, privileges, lockedItems);
            states.canEdit = planningUtils.canEditPlanning(item, null, session, privileges, lockedItems);
        }
    }

    getItemStates() {
        const {
            item,
            itemType,
            lockedItems,
            addNewsItemToPlanning,
            createAndPost,
            users,
            session,
        } = this.props;

        // Set the default states
        const states = {
            showCancel: true,
            canPost: false,
            canUnpost: false,
            canUpdate: false,
            canEdit: false,
            showSave: false,
            existingItem: false,
            notExistingItem: false,
            showCreateAndPost: false,
            showEdit: false,
            isLockedInContext: false,
            itemLock: null,
            lockedUser: null,
            isLockRestricted: false,
            isEvent: false,
            isPublic: false,
            showUpdate: false,
            isBeingEdited: false,
        };

        states.itemLock = lockUtils.getLock(item, lockedItems);
        states.isLockedInContext = addNewsItemToPlanning ?
            planningUtils.isLockedForAddToPlanning(item) :
            !!states.itemLock;

        states.lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        states.isLockRestricted = lockUtils.isLockRestricted(item, session, lockedItems) ||
                (!!item && !states.isLockedInContext);

        states.existingItem = isExistingItem(item);
        states.notExistingItem = !isExistingItem(item);
        states.isEvent = itemType === ITEM_TYPE.EVENT;
        states.isPublic = isItemPublic(item);

        states.isEvent ?
            this.getEventStates(states) :
            this.getPlanningStates(states);

        states.showUpdate = states.isPublic && states.canUpdate;
        states.showSave = !states.isPublic && states.canEdit;
        states.isBeingEdited = states.showUpdate || states.showSave;
        states.showCreateAndPost = states.existingItem && createAndPost;

        return states;
    }

    renderIcon(states) {
        const {item, itemType, users, showUnlock, onUnlock, privileges} = this.props;
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        return (
            <StretchBar>
                <ItemIcon
                    item={item || {type: itemType}}
                    doubleSize={true}
                    color={states.isEvent ? ICON_COLORS.WHITE : ICON_COLORS.LIGHT_BLUE}
                />

                {states.itemLock && (states.isLockRestricted || states.itemLock.action !== 'edit') && (
                    <LockContainer
                        lockedUser={states.lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege && showUnlock}
                        withLoggedInfo={true}
                        onUnlock={onUnlock.bind(null, item)}
                        small={false}
                        noMargin={true}
                    />
                )}
            </StretchBar>
        );
    }

    renderButtons(states) {
        const {
            item,
            submitting,
            dirty,
            onSave,
            onSaveAndPost,
            onPost,
            onSaveUnpost,
            onUnpost,
            onLock,
            cancel,
        } = this.props;

        const notDirtyOrSubmitting = !dirty || submitting;
        const buttons = [{
            state: 'showCancel',
            props: {
                color: states.isEvent ? 'ui-dark' : null,
                disabled: submitting,
                onClick: cancel,
                text: dirty ? gettext('Cancel') : gettext('Close'),
                tabIndex: 0,
                enterKeyIsClick: true,
            },
        }, {
            state: 'canPost',
            props: {
                color: 'success',
                disabled: submitting,
                onClick: dirty ? onSaveAndPost : onPost,
                text: dirty ? gettext('Save & Post') : gettext('Post'),
            },
        }, {
            state: 'canUnpost',
            props: {
                color: states.isEvent ? 'warning' : null,
                hollow: !states.isEvent,
                disabled: submitting,
                onClick: dirty ? onSaveUnpost : onUnpost,
                text: dirty ? gettext('Save & Unpost') : gettext('Unpost'),
            },
        }, {
            state: 'showSave',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting,
                onClick: onSave,
                text: gettext('Save'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'showUpdate',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting,
                onClick: onSaveAndPost,
                text: gettext('Update'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'notExistingItem',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting,
                onClick: onSave,
                text: gettext('Create'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'showCreateAndPost',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting,
                onClick: onSaveAndPost,
                text: gettext('Create & Post'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'showEdit',
            props: {
                color: 'primary',
                onClick: onLock.bind(null, item),
                text: gettext('Edit'),
                enterKeyIsClick: true,
            },
        }];

        return (
            <StretchBar right={true}>
                {buttons.map((button) => (
                    states[button.state] &&
                        <Button
                            key={button.state}
                            {...button.props}
                        />
                ))}
            </StretchBar>
        );
    }

    render() {
        const {
            item,
            onAddCoverage,
            minimize,
            session,
            privileges,
            lockedItems,
            itemActions,
            hideItemActions,
            hideMinimize,
            hideExternalEdit,
            closeEditorAndOpenModal,
            flushAutosave,
        } = this.props;

        const states = this.getItemStates();

        return (
            <Header
                className="subnav"
                darkBlue={states.isEvent}
                darker={!states.isEvent}
            >
                {this.renderIcon(states)}
                {this.renderButtons(states)}

                {states.isBeingEdited && !hideMinimize && (
                    <NavButton
                        onClick={minimize}
                        icon="big-icon--minimize"
                        title={gettext('Minimise')}
                    />
                )}

                {states.isBeingEdited && !hideExternalEdit && (
                    <NavButton
                        onClick={closeEditorAndOpenModal.bind(null, item)}
                        icon="icon-external"
                        title={gettext('Edit in popup')}
                    />
                )}

                {!hideItemActions && (
                    <EditorItemActions
                        item={item}
                        onAddCoverage={onAddCoverage}
                        itemActions={itemActions}
                        session={session}
                        privileges={privileges}
                        lockedItems={lockedItems}
                        flushAutosave={flushAutosave}
                    />
                )}
            </Header>
        );
    }
}

EditorHeader.propTypes = {
    item: PropTypes.object,
    diff: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onPost: PropTypes.func.isRequired,
    onSaveAndPost: PropTypes.func.isRequired,
    onUnpost: PropTypes.func.isRequired,
    onSaveUnpost: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
    submitting: PropTypes.bool.isRequired,
    dirty: PropTypes.bool.isRequired,
    errors: PropTypes.object,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
    users: PropTypes.array,
    onUnlock: PropTypes.func,
    onLock: PropTypes.func,
    itemActions: PropTypes.object,
    itemType: PropTypes.string,
    addNewsItemToPlanning: PropTypes.object,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    hideMinimize: PropTypes.bool,
    createAndPost: PropTypes.bool,
    closeEditorAndOpenModal: PropTypes.func,
    hideExternalEdit: PropTypes.bool,
    onAddCoverage: PropTypes.func,
    flushAutosave: PropTypes.func,
};
