import React from 'react';
import PropTypes from 'prop-types';

import {ITEM_TYPE, PRIVILEGES} from '../../../constants';
import {gettext, getItemType, eventUtils, planningUtils, isItemPublic, lockUtils} from '../../../utils';

import {Button} from '../../UI';
import {Button as NavButton} from '../../UI/Nav';
import {Header} from '../../UI/SidePanel';
import {StretchBar} from '../../UI/SubNav';

import {LockContainer} from '../../index';
import {EditorItemActions} from './index';

export const EditorHeader = ({
    item,
    onSave,
    onPublish,
    onSaveAndPublish,
    onUnpublish,
    cancel,
    minimize,
    submitting,
    dirty,
    session,
    privileges,
    lockedItems,
    itemActions,
    openCancelModal,
    users,
    onUnlock,
    onLock,
    currentWorkspace,
}) => {
    // Do not show the tabs if we're creating a new item
    const existingItem = !!item;
    const itemType = getItemType(item);
    const isPublic = isItemPublic(item);
    const isLocked = lockUtils.getLock(item, lockedItems);

    let canPublish = false;
    let canUnpublish = false;
    let canUpdate = false;
    let canEdit = false;

    if (itemType === ITEM_TYPE.EVENT) {
        canPublish = eventUtils.canPublishEvent(item, session, privileges, lockedItems);
        canUnpublish = eventUtils.canUnpublishEvent(item, session, privileges, lockedItems);
        canUpdate = isLocked && eventUtils.canUpdateEvent(item, session, privileges, lockedItems);
        canEdit = isLocked && eventUtils.canEditEvent(item, session, privileges, lockedItems);
    } else if (itemType === ITEM_TYPE.PLANNING) {
        canPublish = planningUtils.canPublishPlanning(item, null, session, privileges, lockedItems);
        canUnpublish = planningUtils.canUnpublishPlanning(item, null, session, privileges, lockedItems);
        canUpdate = isLocked && planningUtils.canUpdatePlanning(item, null, session, privileges, lockedItems);
        canEdit = isLocked && planningUtils.canEditPlanning(item, null, session, privileges, lockedItems);
    }

    const lockedUser = lockUtils.getLockedUser(item, lockedItems, users);
    const isLockRestricted = lockUtils.isLockRestricted(item, session, lockedItems);
    const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

    const onCancel = () => (
        !dirty ? cancel() : openCancelModal({
            title: 'Save changes?',
            body: 'There are some unsaved changes, do you want to save it now?',
            okText: 'Save',
            showIgnore: true,
            action: () => onSave().finally(cancel),
            ignore: cancel,
        })
    );

    return (
        <Header className="subnav">
            {isLockRestricted && (
                <StretchBar>
                    <LockContainer
                        lockedUser={lockedUser}
                        users={users}
                        showUnlock={unlockPrivilege}
                        withLoggedInfo={true}
                        onUnlock={onUnlock.bind(null, item)}
                    />
                </StretchBar>
            )}

            <StretchBar right={true}>
                <Button
                    disabled={submitting}
                    onClick={onCancel}
                    text={gettext('Cancel')}
                />

                {canPublish && (
                    <Button
                        color="success"
                        disabled={submitting}
                        onClick={dirty ? onSaveAndPublish : onPublish}
                        text={dirty ? gettext('Save & Publish') : gettext('Publish')}
                    />
                )}

                {canUnpublish && (
                    <Button
                        hollow={true}
                        disabled={submitting}
                        onClick={onUnpublish}
                        text={dirty ? gettext('Save & Unpublish') : gettext('Unpublish')}
                    />
                )}

                {isPublic && canUpdate && (
                    <Button
                        color="primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                        text={gettext('Update')}
                    />
                )}

                {!isPublic && canEdit && (
                    <Button
                        color="primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                        text={gettext('Save')}
                    />
                )}

                {!existingItem && (
                    <Button
                        color="primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                        text={gettext('Create')}
                    />
                )}

                {existingItem && !isLocked && (
                    <Button
                        color="primary"
                        onClick={onLock.bind(null, item)}
                        text={gettext('Edit')}
                    />
                )}
            </StretchBar>

            {!isLockRestricted && (
                <NavButton onClick={minimize} icon="big-icon--minimize" />
            )}

            {!isLockRestricted && (
                <EditorItemActions item={item}
                    itemActions={itemActions}
                    session={session}
                    privileges={privileges}
                    lockedItems={lockedItems}
                    currentWorkspace={currentWorkspace} />
            )}
        </Header>
    );
};

EditorHeader.propTypes = {
    item: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    onSaveAndPublish: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
    submitting: PropTypes.bool.isRequired,
    dirty: PropTypes.bool.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
    users: PropTypes.array,
    onUnlock: PropTypes.func,
    onLock: PropTypes.func,
    itemActions: PropTypes.object,
    currentWorkspace: PropTypes.string,
};
