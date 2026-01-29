import moment from 'moment';

import {appConfig} from 'appConfig';
import {planningApi, superdeskApi} from '../superdeskApi';
import {IEventOrPlanningItem} from '../interfaces';

import * as selectors from '../selectors';
import {MULTISELECT, ITEM_TYPE, MODALS, PERSONAL_WORKSPACE} from '../constants';

import {getItemType, getItemInArrayById, getErrorMessage} from '../utils';

import {showModal} from './index';
import eventsUi from './events/ui';
import planningUi from './planning/ui';

/**
 * Action Dispatcher to select an/all Event(s)
 */
const selectEvents = (eventId, all = false, multi = false, name = '') => (
    (dispatch, getState) => {
        if (all) {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_ALL_EVENTS,
                payload: selectors.events.eventIdsInList(getState()),
            });
        }
        if (multi) {
            const selectedIds = selectors.multiSelect.selectedEventIds(getState());
            const prevSelectedId = selectedIds[selectedIds.length - 1];
            const prevSelectedDate = selectors.multiSelect.lastSelectedEventDate(getState());
            const displayedIds = selectors.events.flattenedEventsInList(getState());
            const prevIndx = displayedIds.findIndex((l) => (l[0] === prevSelectedDate && l[1] === prevSelectedId));
            const currentIndx = displayedIds.findIndex((c) => (c[0] === name && c[1] == eventId));
            const idList = displayedIds.slice(Math.min(currentIndx, prevIndx),
                Math.max(currentIndx, prevIndx) + 1).map((a) => a[1]);

            // Clear the selection/highlight made on the items in the list on the shift click
            window.getSelection().removeAllRanges();
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_MULTIPLE_EVENTS,
                payload: idList,
            });
        }

        return dispatch({
            type: MULTISELECT.ACTIONS.SELECT_EVENT,
            payload: {
                eventId: eventId,
                name: name,
            },
        });
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

const selectPlannings = (planningId, all = false, multi = false, name = '') => (
    (dispatch, getState) => {
        if (all) {
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_ALL_PLANNINGS,
                payload: selectors.planning.planIdsInList(getState()),
            });
        }
        if (multi) {
            const selectedIds = selectors.multiSelect.selectedPlanningIds(getState());
            const prevSelectedId = selectedIds[selectedIds.length - 1];
            const prevSelectedDate = selectors.multiSelect.lastSelectedPlanningDate(getState());
            const displayedIds = selectors.planning.FlattenedPlanningList(getState());
            const prevIndx = displayedIds.findIndex((l) => (l[0] === prevSelectedDate && l[1] === prevSelectedId));
            const currentIndx = displayedIds.findIndex((c) => (c[0] === name && c[1] == planningId));
            const idList = displayedIds.slice(Math.min(currentIndx, prevIndx),
                Math.max(currentIndx, prevIndx) + 1).map((a) => a[1]);

            // Clear the selection/highlight made on the items in the list on the shift click
            window.getSelection().removeAllRanges();
            return dispatch({
                type: MULTISELECT.ACTIONS.SELECT_MULTIPLE_PLANNINGS,
                payload: idList,
            });
        }

        return dispatch({
            type: MULTISELECT.ACTIONS.SELECT_PLANNING,
            payload: {
                planningId: planningId,
                name: name,
            },
        });
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
        const {gettext} = superdeskApi.localization;
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
        const {gettext} = superdeskApi.localization;
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


const downloadEvents = (url, data) => {
    var req = new XMLHttpRequest();

    req.open('POST', url, true);
    req.responseType = 'blob';
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    req.onload = (event) => {
        var blob = req.response;
        var fileName = '';

        var disposition = req.getResponseHeader('Content-Disposition');

        if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);

            if (matches != null && matches[1]) {
                fileName = matches[1].replace(/['"]/g, '');
            }
        }

        var link = document.createElement('a');

        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    };

    req.send(JSON.stringify(data));
};

const bulkAddPlanningCoveragesToWorkflow = (items) => (
    (dispatch) => planningApi.planning.coverages.bulkAddCoverageToWorkflow(items)
        .then(() => dispatch({
            type: MULTISELECT.ACTIONS.DESELECT_ALL_PLANNINGS,
        }))
);

const exportAsArticle = (items: Array<IEventOrPlanningItem>, download: boolean = false) => (
    (dispatch, getState, {api, desks}) => {
        const {gettext} = superdeskApi.localization;
        const {notify} = superdeskApi.ui;

        const selectedItems = items.filter(
            (item) => item.type === 'event' || item.flags.marked_for_not_publication !== true
        );

        if (selectedItems.length === 0) {
            notify.warning(gettext('No items selected.'));
            return Promise.resolve;
        }

        const exportArticlesDispatch = (items, desk, template, type, download, articleTemplate) => {
            const itemIds = items.map((item) => item._id);

            if (download) {
                const timeZoneOffsetSecs = moment().utcOffset() * 60;
                let queryString = `${appConfig.server.url}/planning_download/events?tz=${timeZoneOffsetSecs}`;

                if (template) {
                    queryString += `&template=${template}`;
                }

                downloadEvents(queryString, itemIds);

                dispatch(self.deSelectEvents(null, true));
                return Promise.resolve();
            } else {
                return api.save('planning_article_export', {
                    desk: desk === PERSONAL_WORKSPACE._id ? null : desk,
                    items: itemIds,
                    template: template,
                    type: type,
                    article_template: articleTemplate,
                })
                    .then((item) => {
                        notify.success(gettext('Article was created.'), 5000, {
                            button: {
                                label: gettext('Open'),
                                onClick: () => {
                                    superdeskApi.ui.article.edit(item._id);
                                },
                            },
                        });

                        // this must go after notify, otherwise there is no notification displayed
                        if (type === ITEM_TYPE.PLANNING) {
                            dispatch(self.deSelectPlannings(null, true));
                        } else {
                            dispatch(self.deSelectEvents(null, true));
                        }
                    }, (error) => {
                        notify.error(
                            getErrorMessage(
                                error,
                                gettext('There was an error when exporting.')
                            )
                        );
                    });
            }
        };
        const defaultDeskId = desks.getCurrentDeskId() ?? PERSONAL_WORKSPACE._id;

        return dispatch(showModal({
            modalType: MODALS.EXPORT_AS_ARTICLE,
            modalProps: {
                items: selectedItems,
                action: exportArticlesDispatch,
                defaultDeskId: defaultDeskId,
                type: selectedItems[0].type,
                download: download,
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
    bulkAddPlanningCoveragesToWorkflow,
};

export default self;
