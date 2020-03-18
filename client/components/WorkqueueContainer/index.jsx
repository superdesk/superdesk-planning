import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {ICON_COLORS} from '../../constants';
import {getItemType, getItemId} from '../../utils';

import {WorkqueueItem} from './WorkqueueItem';
import {Icon} from '../UI';

export const WorkqueueComponent = ({
    workqueueItems,
    currentEditId,
    unlockAndCloseEditor,
    openEditForm,
    openConfirmationModal,
}) => (
    <div className="opened-articles-bar">
        <button className="opened-articles-bar__quick-actions">
            <Icon icon="icon-th-large" color={ICON_COLORS.WHITE} />
        </button>
        <ul className="opened-articles-bar__list">
            {workqueueItems.map((openedItem, index) => (
                <WorkqueueItem
                    key={index}
                    item={openedItem}
                    currentEditId={currentEditId}
                    onOpen={openEditForm}
                    onClose={(item) =>
                        openConfirmationModal(
                            item,
                            openEditForm.bind(null, item),
                            unlockAndCloseEditor.bind(null, item)
                        )
                    }
                />
            ))}
        </ul>
    </div>
);

WorkqueueComponent.propTypes = {
    workqueueItems: PropTypes.array,
    currentEditId: PropTypes.string,
    unlockAndCloseEditor: PropTypes.func,
    openEditForm: PropTypes.func,
    openConfirmationModal: PropTypes.func,
};

const mapStateToProps = (state) => ({
    workqueueItems: selectors.locks.workqueueItems(state),
    currentEditId: selectors.forms.currentItemId(state),
});

const mapDispatchToProps = (dispatch) => ({
    unlockAndCloseEditor: (item) => dispatch(actions.main.unlockAndCancel(item, true)),
    openEditForm: (item) => dispatch(actions.main.openForEdit(item)),
    openConfirmationModal: (item, onGoTo, onIgnore) => dispatch(actions.main.openIgnoreCancelSaveModal({
        itemId: getItemId(item),
        itemType: getItemType(item),
        onGoTo: onGoTo,
        onIgnore: onIgnore,
    })),
});

export const WorkqueueContainer = connect(
    mapStateToProps, mapDispatchToProps
)(WorkqueueComponent);
