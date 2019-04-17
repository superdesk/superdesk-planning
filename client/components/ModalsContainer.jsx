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
} from './index';
import {FeaturedPlanningModal} from './Planning/FeaturedPlanning/FeaturedPlanningModal';
import {UnlockFeaturedPlanning} from './Planning/FeaturedPlanning/UnlockFeaturedPlanning';
import {EditorModalPanel} from './Main';
import {MODALS, ITEM_TYPE} from '../constants';

import {ManageAgendasModal} from './Agendas/ManageAgendasModal';
import {SelectDeskTemplate} from './Assignments';
import {ManageFiltersModal} from './EventsPlanningFilters';
import {ExportAsArticleModal} from './ExportAsArticleModal';

const modals = {
    [MODALS.CONFIRMATION]: ConfirmationModal,
    [MODALS.NOTIFICATION_MODAL]: NotificationModal,
    [MODALS.ITEM_ACTIONS_MODAL]: ItemActionConfirmationModal,
    [MODALS.ADD_TO_PLANNING]: AddToPlanningModal,
    [MODALS.FULFIL_ASSIGNMENT]: FulFilAssignmentModal,
    [MODALS.SELECT_ITEM_MODAL]: SelectItemModal,
    [MODALS.MANAGE_AGENDAS]: ManageAgendasModal,
    [MODALS.EDIT_ITEM]: EditorModalPanel,
    [MODALS.IGNORE_CANCEL_SAVE]: IgnoreCancelSaveModal,
    [MODALS.FEATURED_STORIES]: FeaturedPlanningModal,
    [MODALS.UNLOCK_FEATURED_STORIES]: UnlockFeaturedPlanning,
    [MODALS.SELECT_DESK_TEMPLATE]: SelectDeskTemplate,
    [MODALS.MANAGE_EVENTS_PLANNING_FILTERS]: ManageFiltersModal,
    [MODALS.EXPORT_AS_ARTICLE]: ExportAsArticleModal,
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
    handleHide: (itemType) => {
        dispatch(modalActions.hideModal());
        if (itemType === ITEM_TYPE.EVENT) {
            dispatch(multiSelect.deSelectEvents(null, true));
        } else {
            dispatch(multiSelect.deSelectPlannings(null, true));
        }
    },
});

export const ModalsContainer = connect(mapStateToProps, mapDispatchToProps)(Modals);
