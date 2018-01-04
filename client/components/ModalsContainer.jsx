import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {modalType, modalProps} from '../selectors/general';
import {hideModal, deselectAllTheEventList} from '../actions';
import {
    ConfirmationModal,
    NotificationModal,
    ItemActionConfirmationModal,
    AddToPlanningModal,
    FulFilAssignmentModal,
    SelectItemModal,
} from './index';
import {MODALS} from '../constants';

import SortItemsModal from './SortItemsModal';
import {ManageAgendasModal} from './Agendas/ManageAgendasModal';

const modals = {
    [MODALS.CONFIRMATION]: ConfirmationModal,
    [MODALS.NOTIFICATION_MODAL]: NotificationModal,
    [MODALS.ITEM_ACTIONS_MODAL]: ItemActionConfirmationModal,
    [MODALS.SORT_SELECTED]: SortItemsModal,
    [MODALS.ADD_TO_PLANNING]: AddToPlanningModal,
    [MODALS.FULFIL_ASSIGNMENT]: FulFilAssignmentModal,
    [MODALS.SELECT_ITEM_MODAL]: SelectItemModal,
    [MODALS.MANAGE_AGENDAS]: ManageAgendasModal,
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
    modalType: modalType(state),
    modalProps: modalProps(state),
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
