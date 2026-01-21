import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {modalType, modalProps} from '../selectors/general';
import {modalActions} from '../actions';
import multiSelect from '../actions/multiSelect';
import {
    ConfirmationModal,
    NotificationModal,
    ItemActionConfirmationModal,
    AddToPlanningModal,
    FulFilAssignmentModal,
    SelectItemModal,
    IgnoreCancelSaveModal,
    EditCoverageAssignmentModal,
} from './index';
import {FeaturedPlanningModal} from './Planning/FeaturedPlanning/FeaturedPlanningModal';
import {UnlockFeaturedPlanning} from './Planning/FeaturedPlanning/UnlockFeaturedPlanning';
import {MODALS, ITEM_TYPE} from '../constants';

import {ManageAgendasModal} from './Agendas/ManageAgendasModal';
import {SelectDeskTemplate} from './Assignments';
import {ManageFiltersModal} from './EventsPlanningFilters';
import {ManageEventTemplatesModal} from './Events/ManageEventTemplatesModal';
import {ExportAsArticleModal} from './ExportAsArticleModal';

const modals = {
    [MODALS.CONFIRMATION]: ConfirmationModal,
    [MODALS.NOTIFICATION_MODAL]: NotificationModal,
    [MODALS.ITEM_ACTIONS_MODAL]: ItemActionConfirmationModal,
    [MODALS.ADD_TO_PLANNING]: AddToPlanningModal,
    [MODALS.FULFIL_ASSIGNMENT]: FulFilAssignmentModal,
    [MODALS.SELECT_ITEM_MODAL]: SelectItemModal,
    [MODALS.MANAGE_AGENDAS]: ManageAgendasModal,
    [MODALS.IGNORE_CANCEL_SAVE]: IgnoreCancelSaveModal,
    [MODALS.FEATURED_STORIES]: FeaturedPlanningModal,
    [MODALS.UNLOCK_FEATURED_STORIES]: UnlockFeaturedPlanning,
    [MODALS.SELECT_DESK_TEMPLATE]: SelectDeskTemplate,
    [MODALS.MANAGE_EVENTS_PLANNING_FILTERS]: ManageFiltersModal,
    [MODALS.MANAGE_EVENT_TEMPLATES]: ManageEventTemplatesModal,
    [MODALS.EXPORT_AS_ARTICLE]: ExportAsArticleModal,
    [MODALS.EDIT_COVERAGE_ASSIGNMENT]: EditCoverageAssignmentModal,
};

interface IModalProps {
    modalType: string;
    modalProps: any;
    handleHide: (itemType?: string) => void;
}

export function Modals({modalType, modalProps, handleHide}: IModalProps) {
    if (modalType != null && modals[modalType] != null) {
        const ModalElement = modals[modalType];

        return (
            <ModalElement
                handleHide={handleHide}
                modalProps={modalProps}
            />
        );
    } else {
        return null;
    }
}

const mapStateToProps = (state) => ({
    modalType: modalType(state),
    modalProps: modalProps(state),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    handleHide: (itemType) => {
        dispatch(modalActions.hideModal());

        const action = itemType === ITEM_TYPE.EVENT
            ? multiSelect.deSelectEvents
            : multiSelect.deSelectPlannings;

        dispatch(action(null, true));

        ownProps?.onModalHide?.();
    },
});

export const ModalsContainer = connect(mapStateToProps, mapDispatchToProps)(Modals);
