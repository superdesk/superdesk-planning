import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {MODALS} from '../../constants';
import {WorkqueueItem} from './WorkqueueItem';

import * as actions from '../../actions';
import * as selectors from '../../selectors';

export const WorkqueueComponent = ({
    workqueueItems,
    currentEditId,
    unlockAndCloseEditor,
    openEditForm,
    openConfirmationModal,
    autosaves,
}) => {
    const handleClose = (item) => {
        if (get(autosaves, `${item.type}["${item._id}"]`)) {
            openConfirmationModal(
                openEditForm.bind(null, item),
                unlockAndCloseEditor.bind(null, item)
            );
        } else {
            unlockAndCloseEditor(item);
        }
    };

    return (
        <div className="opened-articles">
            <div className="quick-actions pull-left">
                <button>
                    <i className="icon-th-large icon--white" />
                </button>
            </div>
            <ul className="list full-width">
                {workqueueItems.map((openedItem, index) => (
                    <WorkqueueItem
                        key={index}
                        item={openedItem}
                        currentEditId={currentEditId}
                        onOpen={openEditForm}
                        onClose={handleClose}
                    />
                ))}
            </ul>
        </div>
    );
};

WorkqueueComponent.propTypes = {
    workqueueItems: PropTypes.array,
    currentEditId: PropTypes.string,
    unlockAndCloseEditor: PropTypes.func,
    openEditForm: PropTypes.func,
    openConfirmationModal: PropTypes.func,
    autosaves: PropTypes.object,
};

const mapStateToProps = (state) => ({
    workqueueItems: selectors.locks.workqueueItems(state),
    currentEditId: selectors.forms.currentItemId(state),
    autosaves: selectors.forms.autosaves(state),
});

const mapDispatchToProps = (dispatch) => ({
    unlockAndCloseEditor: (item) => dispatch(actions.main.unlockAndCloseEditor(item)),
    openEditForm: (item) => dispatch(actions.main.openEditor(item)),
    openConfirmationModal: (actionCallBack, ignoreCallBack) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            title: 'Save changes?',
            body: 'There are some unsaved changes, do you want to save it now?',
            okText: 'GO-TO',
            showIgnore: true,
            action: actionCallBack,
            ignore: ignoreCallBack,
        },
    })),
});

export const WorkqueueContainer = connect(
    mapStateToProps, mapDispatchToProps
)(WorkqueueComponent);
