import React from 'react';
import PropTypes from 'prop-types';
import {isEqual} from 'lodash';
import {ITEM_TYPE, PRIVILEGES, KEYCODES, WORKSPACE} from '../../../constants';
import {gettext, eventUtils, planningUtils, isItemPublic, lockUtils, onEventCapture} from '../../../utils';

import {Button} from '../../UI';
import {Button as NavButton} from '../../UI/Nav';
import {Header} from '../../UI/SidePanel';
import {StretchBar} from '../../UI/SubNav';

import {LockContainer} from '../../index';
import {EditorItemActions} from './index';
import {Label} from '../../';

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
                title: 'Save changes?',
                body: 'There are some unsaved changes, do you want to save it now?',
                okText: 'Save',
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
            onSave,
            onPublish,
            onSaveAndPublish,
            onUnpublish,
            onSaveUnpublish,
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
            currentWorkspace,
            itemType,
        } = this.props;

        // Do not show the tabs if we're creating a new item
        const existingItem = !!item;
        const isPublic = isItemPublic(item);
        const itemLock = lockUtils.getLock(item, lockedItems);
        const inPlanning = currentWorkspace === WORKSPACE.PLANNING;

        const isLockedInContext = !inPlanning ? planningUtils.isLockedForAddToPlanning(item) : !!itemLock;

        let canPublish = false;
        let canUnpublish = false;
        let canUpdate = false;
        let canEdit = false;

        if (isLockedInContext) {
            if (itemType === ITEM_TYPE.EVENT) {
                canPublish = eventUtils.canPublishEvent(item, session, privileges, lockedItems);
                canUnpublish = eventUtils.canUnpublishEvent(item, session, privileges, lockedItems);
                canUpdate = eventUtils.canUpdateEvent(item, session, privileges, lockedItems);
                canEdit = eventUtils.canEditEvent(item, session, privileges, lockedItems);
            } else if (itemType === ITEM_TYPE.PLANNING) {
                canPublish = planningUtils.canPublishPlanning(item, null, session, privileges, lockedItems);
                canUnpublish = planningUtils.canUnpublishPlanning(item, null, session, privileges, lockedItems);
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
            <Header className="subnav">
                {isLockRestricted && (
                    <StretchBar>
                        <LockContainer
                            lockedUser={lockedUser}
                            users={users}
                            showUnlock={unlockPrivilege && inPlanning}
                            withLoggedInfo={true}
                            onUnlock={onUnlock.bind(null, item)}
                        />
                    </StretchBar>
                )}
                {itemType === ITEM_TYPE.EVENT && (<StretchBar right={false}>
                    <Label
                        text={gettext('Event')}
                        isHollow={false}
                        iconType={'large'}
                    />
                </StretchBar>
                )}
                {itemType === ITEM_TYPE.PLANNING && (<StretchBar right={false}>
                    <Label
                        text={gettext('Planning')}
                        isHollow={false}
                        iconType={'large'}
                    />
                </StretchBar>
                )}
                <StretchBar right={true}>
                    <Button
                        disabled={submitting}
                        onClick={this.handleCancel}
                        text={dirty ? gettext('Cancel') : gettext('Close')}
                        tabIndex={0}
                        enterKeyIsClick
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
                            onClick={dirty ? onSaveUnpublish : onUnpublish}
                            text={dirty ? gettext('Save & Unpublish') : gettext('Unpublish')}
                        />
                    )}

                    {showUpdate && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSaveAndPublish}
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

                    {!existingItem && !inPlanning &&
                        itemType === ITEM_TYPE.PLANNING && (
                        <Button
                            color="primary"
                            disabled={!dirty || submitting}
                            onClick={onSaveAndPublish}
                            text={gettext('Create and publish')}
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

                {isBeingEdited && inPlanning && (
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
    }
}

EditorHeader.propTypes = {
    item: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    onSaveAndPublish: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
    onSaveUnpublish: PropTypes.func.isRequired,
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
    currentWorkspace: PropTypes.string,
    itemType: PropTypes.string
};
