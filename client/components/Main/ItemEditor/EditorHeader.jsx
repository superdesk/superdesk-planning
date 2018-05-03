import React from 'react';
import PropTypes from 'prop-types';
import {isEqual} from 'lodash';
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
        this.handleCancel = this.handleCancel.bind(this);
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
                this.handleCancel();
            }
        }
    }

    handleCancel() {
        const {dirty, openCancelModal, onSave, cancel, errors} = this.props;

        if (dirty) {
            openCancelModal({
                title: gettext('Save changes?'),
                body: gettext('There are some unsaved changes, do you want to save it now?'),
                okText: gettext('Save'),
                showIgnore: true,
                action: !isEqual(errors, {}) ? null : () => onSave().finally(cancel),
                ignore: cancel,
            });
        } else {
            this.props.cancel();
        }
    }

    render() {
        const {
            item,
            diff,
            onAddCoverage,
            onSave,
            onPost,
            onSaveAndPost,
            onUnpost,
            onSaveUnpost,
            minimize,
            submitting,
            dirty,
            session,
            privileges,
            lockedItems,
            itemActions,
            users,
            onUnlock,
            onLock,
            addNewsItemToPlanning,
            itemType,
            showUnlock,
            createAndPost,
            hideItemActions,
            hideMinimize,
            hideExternalEdit,
            closeEditorAndOpenModal,
        } = this.props;

        // Do not show the tabs if we're creating a new item
        const existingItem = isExistingItem(item);
        const isPublic = isItemPublic(item);
        const itemLock = lockUtils.getLock(item, lockedItems);
        const isLockedInContext = addNewsItemToPlanning ? planningUtils.isLockedForAddToPlanning(item) : !!itemLock;
        const isEvent = itemType === ITEM_TYPE.EVENT;

        let canPost = false;
        let canUnpost = false;
        let canUpdate = false;
        let canEdit = false;

        if (isLockedInContext) {
            if (isEvent) {
                canPost = eventUtils.canPostEvent(item, session, privileges, lockedItems);
                canUnpost = eventUtils.canUnpostEvent(item, session, privileges, lockedItems);
                canUpdate = eventUtils.canUpdateEvent(item, session, privileges, lockedItems);
                canEdit = eventUtils.canEditEvent(item, session, privileges, lockedItems);
            } else if (!isEvent) {
                canPost = planningUtils.canPostPlanning(diff, null, session, privileges, lockedItems);
                canUnpost = planningUtils.canUnpostPlanning(item, null, session, privileges, lockedItems);
                canUpdate = planningUtils.canUpdatePlanning(item, null, session, privileges, lockedItems);
                canEdit = planningUtils.canEditPlanning(item, null, session, privileges, lockedItems);
            }
        }

        const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
        const isLockRestricted = lockUtils.isLockRestricted(item, session, lockedItems) ||
                (!!item && !isLockedInContext);
        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        const showUpdate = isPublic && canUpdate;
        const showSave = !isPublic && canEdit;
        const isBeingEdited = showUpdate || showSave;

        return (
            <Header className="subnav" darkBlue={isEvent} darker={!isEvent}>
                <StretchBar>
                    <ItemIcon
                        item={item || {type: itemType}}
                        doubleSize={true}
                        color={isEvent ? ICON_COLORS.WHITE : ICON_COLORS.LIGHT_BLUE}
                    />

                    {isLockRestricted && (
                        <LockContainer
                            lockedUser={lockedUser}
                            users={users}
                            showUnlock={unlockPrivilege && showUnlock}
                            withLoggedInfo={true}
                            onUnlock={onUnlock.bind(null, item)}
                            small={false}
                            noMargin={true}
                        />
                    )}
                </StretchBar>

                <StretchBar right={true}>
                    <Button
                        color={isEvent ? 'ui-dark' : null}
                        disabled={submitting}
                        onClick={this.handleCancel}
                        text={dirty ? gettext('Cancel') : gettext('Close')}
                        tabIndex={0}
                        enterKeyIsClick
                    />

                    {canPost && (
                        <Button
                            color="success"
                            disabled={submitting}
                            onClick={dirty ? onSaveAndPost : onPost}
                            text={dirty ? gettext('Save & Post') : gettext('Post')}
                        />
                    )}

                    {canUnpost && (
                        <Button
                            hollow={true}
                            disabled={submitting}
                            onClick={dirty ? onSaveUnpost : onUnpost}
                            text={dirty ? gettext('Save & Unpost') : gettext('Unpost')}
                        />
                    )}

                    {showUpdate && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSaveAndPost}
                            text={gettext('Update')}
                            enterKeyIsClick
                        />
                    )}

                    {showSave && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSave}
                            text={gettext('Save')}
                            enterKeyIsClick
                        />
                    )}

                    {!existingItem && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSave}
                            text={gettext('Create')}
                            enterKeyIsClick
                        />
                    )}

                    {!existingItem && createAndPost &&
                        itemType === ITEM_TYPE.PLANNING && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSaveAndPost}
                            text={gettext('Create and post')}
                            enterKeyIsClick
                        />
                    )}

                    {existingItem && !isLockedInContext && canEdit && (
                        <Button
                            color="primary"
                            onClick={onLock.bind(null, item)}
                            text={gettext('Edit')}
                        />
                    )}
                </StretchBar>

                {isBeingEdited && !hideMinimize && (
                    <NavButton onClick={minimize} icon="big-icon--minimize" title={gettext('Minimise')}/>
                )}

                {isBeingEdited && !hideExternalEdit && (
                    <NavButton onClick={closeEditorAndOpenModal.bind(null, item)} icon="icon-external"
                        title={gettext('Edit in popup')}/>
                )}

                {!isLockRestricted && !hideItemActions && (
                    <EditorItemActions item={item}
                        onAddCoverage={onAddCoverage}
                        itemActions={itemActions}
                        session={session}
                        privileges={privileges}
                        lockedItems={lockedItems} />
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
};
