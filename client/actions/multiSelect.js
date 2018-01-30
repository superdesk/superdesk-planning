import * as selectors from '../selectors';
import {showModal} from './index';
import {MULTISELECT, ITEM_TYPE, MODALS} from '../constants';
import eventsUi from './events/ui';
import planningUi from './planning/ui';
import {getItemType, gettext} from '../utils';

/**
 * Action Dispatcher to select an/all Event(s)
 */
const selectEvents = (eventId, all = false) => (
    (dispatch, getState) => {
        if (all) {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_ALL_EVENTS,
                payload: selectors.events.eventIdsInList(getState())
            });
        } else {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_EVENT,
                payload: eventId,
            });
        }
    }
);

const deSelectEvents = (eventId, all = false) => (
    (dispatch) => {
        if (all) {
            return dispatch({type: MULTISELECT.ACTIONS.DESELECT_ALL_EVENTS});
        } else {
            return dispatch({
                type: MULTISELECT.ACTIONS.DESELECT_EVENT,
                payload: eventId,
            });
        }
    }
);

const selectPlannings = (planningId, all = false) => (
    (dispatch, getState) => {
        if (all) {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_ALL_PLANNINGS,
                payload: selectors.planning.planIdsInList(getState())
            });
        } else {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_PLANNING,
                payload: planningId,
            });
        }
    }
);

const deSelectPlannings = (planningId, all = false) => (
    (dispatch) => {
        if (all) {
            return dispatch({type: MULTISELECT.ACTIONS.DESELECT_ALL_PLANNINGS});
        } else {
            return dispatch({
                type: MULTISELECT.ACTIONS.DESELECT_PLANNING,
                payload: planningId,
            });
        }
    }
);

// Bulk actions on items
const itemBulkSpikeModal = (items) => (
    (dispatch) => {
        const itemType = getItemType(items[0]);
        const itemSpikeDispatch = itemType === ITEM_TYPE.EVENT ?
            eventsUi.spike : planningUi.spike;

        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext(`Do you want to spike ${items.length} item(s) ?`),
                action: () => dispatch(itemSpikeDispatch(items)),
                itemType: itemType,
            },
        }));
        return Promise.resolve();
    }
);

const itemBulkUnSpikeModal = (items) => (
    (dispatch) => {
        const itemType = getItemType(items[0]);
        const itemUnSpikeDispatch = itemType === ITEM_TYPE.EVENT ?
            eventsUi.unspike : planningUi.unspike;

        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext(`Do you want to unspike ${items.length} item(s) ?`),
                action: () => dispatch(itemUnSpikeDispatch(items)),
                itemType: itemType,
            },
        }));
        return Promise.resolve();
    }
);

// eslint-disable-next-line consistent-this
const self = {
    selectEvents,
    deSelectEvents,
    selectPlannings,
    deSelectPlannings,
    itemBulkSpikeModal,
    itemBulkUnSpikeModal,
};

export default self;
