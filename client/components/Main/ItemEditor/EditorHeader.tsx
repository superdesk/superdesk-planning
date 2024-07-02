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
    isItemExpired,
} from '../../../utils';

import {Button} from '../../UI';
import {Button as NavButton} from '../../UI/Nav';
import {Header} from '../../UI/SidePanel';
import {StretchBar} from '../../UI/SubNav';

import {LockContainer, ItemIcon} from '../../index';
import {EditorItemActions} from './index';
import {ButtonGroup} from 'superdesk-ui-framework';
import {IEditorProps, IEditorState, ILockedItems, IPrivileges, ISession} from 'interfaces';
import {IUser} from 'superdesk-api';
import {ItemManager} from './ItemManager';
import {AutoSave} from './AutoSave';

interface IProps {
    diff: IEditorState['diff'];
    initialValues: IEditorState['initialValues'];
    cancel(): void;
    minimize(): void;
    submitting: boolean;
    dirty: boolean;
    errors: IEditorState['errors'];
    session: ISession;
    privileges: IPrivileges;
    contentTypes: IEditorProps['contentTypes'];
    lockedItems: ILockedItems;
    openCancelModal: IEditorProps['openCancelModal'];
    closeEditorAndOpenModal(): Promise<any>;
    users: Array<IUser>;
    itemActions: IEditorProps['itemActions'];
    itemType: IEditorProps['itemType'];
    addNewsItemToPlanning: IEditorProps['addNewsItemToPlanning'];
    showUnlock: IEditorProps['showUnlock'];
    createAndPost: IEditorProps['createAndPost'];
    hideItemActions: IEditorProps['hideItemActions'];
    hideMinimize: IEditorProps['hideMinimize'];
    hideExternalEdit: IEditorProps['hideExternalEdit'];

    /**
     * @deprecated
     */
    associatedEvent: IEditorProps['associatedEvent'];

    associatedEvents: IEditorProps['associatedEvents'];
    associatedPlannings: IEditorProps['associatedPlannings'];

    loading: boolean;
    itemManager: ItemManager;
    autoSave: AutoSave;
    itemAction: IEditorProps['itemAction'];
}

export class EditorHeader extends React.Component<IProps> {
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
            const {
                dirty,
                submitting,
                itemManager,
                cancel,
            } = this.props;

            if (event.keyCode === KEYCODES.S) {
                const enableAction = dirty && !submitting;
                const states = this.getItemStates();

                if (states.notExistingItem && enableAction) {
                    onEventCapture(event);
                    itemManager.save();
                } else if (states.showSave && enableAction) {
                    onEventCapture(event);
                    itemManager.save();
                } else if (states.showUpdate && enableAction) {
                    onEventCapture(event);
                    itemManager.saveAndPost();
                }
            } else if (event.keyCode === KEYCODES.E) {
                if (!submitting) {
                    onEventCapture(event);
                    cancel();
                }
            }
        }
    }

    getEventStates(states) {
        const {
            initialValues,
            lockedItems,
            session,
            privileges,
        } = this.props;

        if (states.isExpired && !states.canEditExpired) {
            return;
        }

        states.showEdit = states.existingItem &&
            !states.isLockedInContext &&
            eventUtils.canEditEvent(initialValues, session, privileges, lockedItems);

        if (states.readOnly) {
            return;
        }

        if (states.isLockedInContext && get(states.itemLock, 'action') === 'edit') {
            states.canPost = eventUtils.canPostEvent(initialValues, session, privileges, lockedItems);
            states.canUnpost = eventUtils.canUnpostEvent(initialValues, session, privileges, lockedItems);
            states.canUpdate = eventUtils.canUpdateEvent(initialValues, session, privileges, lockedItems);
            states.canEdit = eventUtils.canEditEvent(initialValues, session, privileges, lockedItems);
        }
    }

    getPlanningStates(states) {
        const {
            initialValues,
            lockedItems,
            session,
            privileges,
            associatedEvent, // PR-TODO: remove
            associatedEvents,
            addNewsItemToPlanning,
            diff,
        } = this.props;

        if (states.isExpired && !states.canEditExpired) {
            return;
        }

        states.showEdit = states.existingItem &&
            !states.isLockedInContext &&
            planningUtils.canEditPlanning(initialValues, null, session, privileges, lockedItems) &&
            !addNewsItemToPlanning;

        if (states.readOnly) {
            return;
        }

        if (states.isLockedInContext) {
            switch (get(states, 'itemLock.action')) {
            case 'edit':
                states.canPost = planningUtils.canPostPlanning(diff,
                    associatedEvent, session, privileges, lockedItems);
                states.canUnpost = planningUtils.canUnpostPlanning(initialValues,
                    associatedEvent, session, privileges, lockedItems);
                states.canUpdate = planningUtils.canUpdatePlanning(initialValues,
                    associatedEvents, session, privileges, lockedItems);
                states.canEdit = planningUtils.canEditPlanning(initialValues,
                    associatedEvents, session, privileges, lockedItems);
                break;
            case 'add_to_planning':
                states.canPost = planningUtils.canPostPlanning(
                    diff,
                    associatedEvent,
                    session,
                    privileges,
                    lockedItems
                );
                states.canUpdate = planningUtils.canUpdatePlanning(initialValues,
                    associatedEvents, session, privileges, lockedItems);
                states.canEdit = planningUtils.canEditPlanning(
                    initialValues,
                    associatedEvents,
                    session,
                    privileges,
                    lockedItems
                );
                break;
            }
        }
    }

    getItemStates() {
        const {
            initialValues,
            itemType,
            lockedItems,
            addNewsItemToPlanning,
            createAndPost,
            users,
            session,
            privileges,
            itemAction,
        } = this.props;

        // Set the default states
        const states = {
            readOnly: itemAction === 'read',
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
            isExpired: false,
            canEditExpired: false,
        };

        states.isExpired = isItemExpired(initialValues);
        states.canEditExpired = privileges[PRIVILEGES.EDIT_EXPIRED];
        states.itemLock = lockUtils.getLock(initialValues, lockedItems);
        states.isLockedInContext = addNewsItemToPlanning ?
            lockUtils.isLockedForAddToPlanning(initialValues, lockedItems) :
            !!states.itemLock;

        states.lockedUser = lockUtils.getLockedUser(initialValues, lockedItems, users);
        states.isLockRestricted = lockUtils.isLockRestricted(initialValues, session, lockedItems) ||
                (!!initialValues && !states.isLockedInContext);

        states.existingItem = isExistingItem(initialValues);
        states.notExistingItem = !isExistingItem(initialValues);
        states.isEvent = itemType === ITEM_TYPE.EVENT;
        states.isPublic = isItemPublic(initialValues);

        states.isEvent ?
            this.getEventStates(states) :
            this.getPlanningStates(states);

        states.showUpdate = states.isPublic && states.canUpdate;
        states.showSave = !states.isPublic && states.canEdit;
        states.isBeingEdited = states.showUpdate || states.showSave || states.canPost || states.notExistingItem;
        states.showCreateAndPost = !states.existingItem && createAndPost;

        return states;
    }

    renderIcon(states) {
        const {initialValues, itemType, users, showUnlock, itemManager, privileges} = this.props;
        const unlockPrivilege = states.isEvent ? !!privileges[PRIVILEGES.EVENT_MANAGEMENT] :
            !!privileges[PRIVILEGES.PLANNING_MANAGEMENT];
        const lockAction = get(states, 'itemLock.action');
        const showLockContainer = lockAction && (
            states.isLockRestricted || !(lockAction === 'edit' || lockAction === 'add_to_planning')
        );

        return (
            <StretchBar>
                <ItemIcon
                    item={initialValues || {type: itemType}}
                    doubleSize={true}
                    color={states.isEvent ? ICON_COLORS.WHITE : ICON_COLORS.LIGHT_BLUE}
                />

                {!showLockContainer ? null : (
                    <LockContainer
                        lockedUser={states.lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege && showUnlock}
                        withLoggedInfo={true}
                        onUnlock={itemManager.unlockThenLock.bind(null, initialValues)}
                        small={false}
                        noMargin={true}
                    />
                )}
            </StretchBar>
        );
    }

    renderButtons(states) {
        const {
            submitting,
            dirty,
            cancel,
            loading,
            itemManager,
        } = this.props;

        if (loading) {
            return (
                <StretchBar right={true}>
                    <Button
                        color={states.isEvent ? 'ui-dark' : null}
                        disabled={submitting}
                        onClick={cancel}
                        text={gettext('Close')}
                        tabIndex={0}
                        enterKeyIsClick={true}
                        id="close"
                    />
                </StretchBar>
            );
        }

        const notDirtyOrSubmitting = !dirty || submitting;
        const buttons = [{
            state: 'showCancel',
            props: {
                color: states.isEvent ? 'ui-dark' : null,
                disabled: (!states.readOnly && submitting) || loading,
                onClick: cancel,
                text: dirty ? gettext('Cancel') : gettext('Close'),
                tabIndex: 0,
                enterKeyIsClick: true,
                id: 'close',
            },
        }, {
            state: 'canPost',
            props: {
                color: 'success',
                disabled: submitting || loading,
                onClick: dirty ? itemManager.saveAndPost : itemManager.post,
                text: dirty ? gettext('Save & Post') : gettext('Post'),
                id: 'post',
            },
        }, {
            state: 'canUnpost',
            props: {
                color: states.isEvent ? 'warning' : null,
                hollow: !states.isEvent,
                disabled: submitting || loading,
                onClick: dirty ? itemManager.saveAndUnpost : itemManager.unpost,
                text: dirty ? gettext('Save & Unpost') : gettext('Unpost'),
                id: 'unpost',
            },
        }, {
            state: 'showSave',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting || loading,
                onClick: itemManager.save,
                text: gettext('Save'),
                enterKeyIsClick: true,
                id: 'save',
            },
        }, {
            state: 'showUpdate',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting || loading,
                onClick: itemManager.saveAndPost,
                text: gettext('Update'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'notExistingItem',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting || loading,
                onClick: itemManager.save,
                text: gettext('Create'),
                enterKeyIsClick: true,
                id: 'create',
            },
        }, {
            state: 'showCreateAndPost',
            props: {
                color: 'primary',
                disabled: notDirtyOrSubmitting || loading,
                onClick: itemManager.saveAndPost,
                text: gettext('Create & Post'),
                enterKeyIsClick: true,
            },
        }, {
            state: 'showEdit',
            props: {
                color: 'primary',
                onClick: itemManager.changeAction.bind(null, 'edit', null),
                text: gettext('Edit'),
                enterKeyIsClick: true,
                disabled: loading,
            },
        }];

        return (
            <StretchBar right={true}>
                <ButtonGroup align="end">
                    {buttons.map((button) => (
                        states[button.state] && (
                            <Button
                                key={button.state}
                                {...button.props}
                            />
                        )
                    ))}
                </ButtonGroup>
            </StretchBar>
        );
    }

    render() {
        const {
            initialValues,
            minimize,
            session,
            privileges,
            lockedItems,
            itemActions,
            hideItemActions,
            hideMinimize,
            hideExternalEdit,
            closeEditorAndOpenModal,
            contentTypes,
            associatedEvents,
            loading,
            itemManager,
            autoSave,
            diff,
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

                {!loading && states.isBeingEdited && !hideMinimize && (
                    <NavButton
                        onClick={minimize}
                        icon="big-icon--minimize"
                        title={gettext('Minimise')}
                        aria-label={gettext('Minimise')}
                    />
                )}

                {!loading && states.isBeingEdited && !hideExternalEdit && (
                    <NavButton
                        onClick={closeEditorAndOpenModal}
                        aria-label={gettext('Edit in popup')}
                        icon="icon-external"
                        title={gettext('Edit in popup')}
                    />
                )}

                {!loading && !hideItemActions && (
                    <EditorItemActions
                        item={diff}
                        onAddCoverage={itemManager.addCoverage}
                        itemActions={itemActions}
                        session={session}
                        privileges={privileges}
                        lockedItems={lockedItems}
                        contentTypes={contentTypes}
                        events={associatedEvents}
                        itemManager={itemManager}
                        autoSave={autoSave}
                    />
                )}
            </Header>
        );
    }
}
