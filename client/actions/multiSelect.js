import * as selectors from '../selectors';
import {get} from 'lodash';
import {showModal} from './index';
import {MULTISELECT, ITEM_TYPE, MODALS} from '../constants';
import eventsUi from './events/ui';
import planningUi from './planning/ui';
import {getItemType, gettext, planningUtils, eventUtils, getItemInArrayById} from '../utils';

/**
 * Action Dispatcher to select an/all Event(s)
 */
const selectEvents = (eventId, all = false) => (
    (dispatch, getState) => {
        if (all) {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_ALL_EVENTS,
                payload: selectors.events.eventIdsInList(getState()),
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
                payload: selectors.planning.planIdsInList(getState()),
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
                autoClose: true,
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
                autoClose: true,
            },
        }));
        return Promise.resolve();
    }
);

const exportAsArticle = (items = []) => (
    (dispatch, getState, {api, notify, gettext, superdesk, $location, $interpolate, desks}) => {
        if (get(items, 'length', 0) <= 0) {
            return Promise.resolve;
        }

        const itemType = getItemType(items[0]);
        const isPlanning = itemType === ITEM_TYPE.PLANNING;
        const state = getState();
        const sortableItems = [];
        const label = (item) => item.headline || item.slugline || item.description_text || item.name;
        const locks = selectors.locks.getLockedItems(state);
        const isLockedCheck = isPlanning ? planningUtils.isPlanningLocked :
            eventUtils.isEventLocked;

        items.forEach((item) => {
            const isLocked = isLockedCheck(item, locks);
            const isNotForPublication = get(item, 'flags.marked_for_not_publication');

            if (isLocked || isNotForPublication) {
                return;
            }

            sortableItems.push({
                id: item._id,
                label: label(item),
            });
        });

        if (sortableItems.length < items.length) {
            const count = items.length - sortableItems.length;

            if (count === 1) {
                notify.warning(gettext('1 item was not included in the export.'));
            } else {
                const message = gettext('{{ count }} items were not included in the export.');

                notify.warning($interpolate(message)({count}));
            }
        }

        if (!sortableItems.length) { // nothing to sort, stop
            return;
        }

        const templates = isPlanning ? selectors.general.getPlanningExportTemplates(getState()) :
            selectors.general.getEventExportTemplates(getState());
        const exportArticlesDispatch = (items, desk, template, type) => api.save('planning_article_export', {
            desk: desk || getState().workspace.currentDeskId,
            items: items.map((item) => item.id),
            template: template,
            type: type,
        })
            .then((item) => {
                notify.success(gettext('Article was created.'), 5000, {
                    button: {
                        label: gettext('Open'),
                        onClick: () => {
                            $location.url('/workspace/monitoring');
                            superdesk.intent('edit', 'item', item);
                        },
                    },
                });

                // this must go after notify, otherwise there is no notification displayed
                if (type === ITEM_TYPE.PLANNING) {
                    dispatch(self.deSelectPlannings(null, true));
                } else {
                    dispatch(self.deSelectEvents(null, true));
                }
            }, () => {
                notify.error(gettext('There was an error when exporting.'));
            });

        return dispatch(showModal({
            modalType: MODALS.EXPORT_AS_ARTICLE,
            modalProps: {
                items: sortableItems,
                action: exportArticlesDispatch,
                desks: selectors.general.userDesks(getState()),
                templates: templates,
                defaultTemplate: templates.find((t) =>
                    (isPlanning && t.name === 'default_planning') || (!isPlanning && t.name === 'default_event')),
                defaultDesk: getItemInArrayById(selectors.general.userDesks(getState()), desks.getCurrentDeskId()),
                type: getItemType(items[0]),
            },
        }));
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
    exportAsArticle,
};

export default self;
