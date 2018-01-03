import React from 'react';
import PropTypes from 'prop-types';

import {ITEM_TYPE} from '../../constants';
import {gettext, getItemType, eventUtils, isItemPublic} from '../../utils';

import {Button as NavButton} from '../UI/Nav';
import {Header} from '../UI/SidePanel';
import {StretchBar} from '../UI/SubNav';

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
    openCancelModal,
}) => {
    // Do not show the tabs if we're creating a new item
    const existingItem = !!item;
    const itemType = getItemType(item);
    const isPublic = isItemPublic(item);

    let canPublish = false;
    let canUnpublish = false;
    let canUpdate = false;
    let canEdit = false;

    if (itemType === ITEM_TYPE.EVENT) {
        canPublish = eventUtils.canPublishEvent(item, session, privileges, lockedItems);
        canUnpublish = eventUtils.canUnpublishEvent(item, session, privileges, lockedItems);
        canUpdate = eventUtils.canUpdateEvent(item, session, privileges, lockedItems);
        canEdit = eventUtils.canEditEvent(item, session, privileges, lockedItems);
    }

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
            <StretchBar>
                <figure className="avatar" style={{marginRight: 10}}>{'sd'}</figure>
            </StretchBar>

            <StretchBar right={true}>
                <button
                    className="btn"
                    disabled={submitting}
                    onClick={onCancel}
                >
                    {gettext('Cancel')}
                </button>

                {canPublish && (
                    <button
                        className="btn btn--success"
                        disabled={submitting}
                        onClick={dirty ? onSaveAndPublish : onPublish}
                    >
                        {dirty ? gettext('Save & Publish') : gettext('Publish')}
                    </button>
                )}

                {canUnpublish && (
                    <button
                        className="btn btn--hollow"
                        disabled={submitting}
                        onClick={onUnpublish}
                    >
                        {dirty ? gettext('Save & Unpublish') : gettext('Unpublish')}
                    </button>
                )}

                {isPublic && canUpdate && (
                    <button
                        className="btn btn--primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                    >
                        {gettext('Update')}
                    </button>
                )}

                {!isPublic && canEdit && (
                    <button
                        className="btn btn--primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                    >
                        {gettext('Save')}
                    </button>
                )}

                {!existingItem && (
                    <button
                        className="btn btn--primary"
                        disabled={!dirty || submitting}
                        onClick={onSave}
                    >
                        {gettext('Create')}
                    </button>
                )}
            </StretchBar>

            <NavButton onClick={minimize} icon="big-icon--minimize" />
            <NavButton icon="icon-dots-vertical" />
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
};
