import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {hideModal, deselectAllTheEventList} from '../actions';
import {
    AgendaModal,
    ConfirmationModal,
    NotificationModal,
    ItemActionConfirmationModal,
    AddToPlanningModal,
    FulFilAssignmentModal,
    SelectItemModal,
} from './index';
import {MODALS} from '../constants';

import SortItemsModal from './SortItemsModal';

const modals = {
    [MODALS.CONFIRMATION]: ConfirmationModal,
    [MODALS.CREATE_AGENDA]: AgendaModal,
    [MODALS.EDIT_AGENDA]: AgendaModal,
    [MODALS.NOTIFICATION_MODAL]: NotificationModal,
    [MODALS.ITEM_ACTIONS_MODAL]: ItemActionConfirmationModal,
    [MODALS.SORT_SELECTED]: SortItemsModal,
    [MODALS.ADD_TO_PLANNING]: AddToPlanningModal,
    [MODALS.FULFIL_ASSIGNMENT]: FulFilAssignmentModal,
    [MODALS.SELECT_ITEM_MODAL]: SelectItemModal,
};

export function Modals({modalType, modalProps, handleHide}) {
    if (modalType) {
        return React.createElement(modals[modalType], {
            handleHide,
            modalProps,
        });
    } else {
        return null;
    }
}

Modals.propTypes = {
    modalType: PropTypes.string,
    modalProps: PropTypes.object,
    handleHide: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
    modalType: state.modal.modalType,
    modalProps: state.modal.modalProps,
});
const mapDispatchToProps = (dispatch) => ({
    handleHide: (deselectEvents) => {
        dispatch(hideModal());
        if (deselectEvents) {
            dispatch(deselectAllTheEventList());
        }
    },
});

export const ModalsContainer = connect(mapStateToProps, mapDispatchToProps)(Modals);
