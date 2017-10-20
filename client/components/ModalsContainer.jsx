import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { hideModal, deselectAllTheEventList } from '../actions'
import {
    AgendaModal,
    ConfirmationModal,
    NotificationModal,
    ItemActionConfirmationModal,
    AddToPlanningModal,
    FulFillAssignmentModal,
 } from './index'

import SortItemsModal from './SortItemsModal'

const modals = {
    CONFIRMATION: ConfirmationModal,
    CREATE_AGENDA: AgendaModal,
    EDIT_AGENDA: AgendaModal,
    NOTIFICATION_MODAL: NotificationModal,
    ITEM_ACTIONS_MODAL: ItemActionConfirmationModal,
    SORT_SELECTED: SortItemsModal,
    ADD_TO_PLANNING: AddToPlanningModal,
    FULFILL_ASSIGNMENT: FulFillAssignmentModal,
}

export function Modals({ modalType, modalProps, handleHide }) {
    if (modalType) {
        return React.createElement(modals[modalType], {
            handleHide,
            modalProps,
        })
    } else {
        return null
    }
}


Modals.propTypes = {
    modalType: PropTypes.string,
    modalProps: PropTypes.object,
    handleHide: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
    modalType: state.modal.modalType,
    modalProps: state.modal.modalProps,
})
const mapDispatchToProps = (dispatch) => ({
    handleHide: (deselectEvents) => {
        dispatch(hideModal())
        if (deselectEvents) {
            dispatch(deselectAllTheEventList())
        }
    },
})
export const ModalsContainer = connect(mapStateToProps, mapDispatchToProps)(Modals)
