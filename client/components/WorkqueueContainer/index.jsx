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
    unlockWorkqueueItem,
}) => (
    <div className="opened-articles">
        <div className="quick-actions pull-left">
            <button>
                <Icon icon="icon-th-large" color={ICON_COLORS.WHITE} />
            </button>
        </div>
        <ul className="list full-width">
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
                            item._id === currentEditId ?
                                unlockAndCloseEditor.bind(null, item) : unlockWorkqueueItem.bind(null, item)
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
    unlockWorkqueueItem: PropTypes.func,
};

const mapStateToProps = (state) => ({
    workqueueItems: selectors.locks.workqueueItems(state),
    currentEditId: selectors.forms.currentItemId(state),
});

const mapDispatchToProps = (dispatch) => ({
    unlockWorkqueueItem: (item) => (dispatch(actions.locks.unlock(item))),
    unlockAndCloseEditor: (item) => dispatch(actions.main.unlockAndCancel(item)),
    openEditForm: (item) => dispatch(actions.main.lockAndEdit(item)),
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
