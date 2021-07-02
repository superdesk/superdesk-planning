import {appConfig} from 'appConfig';

import * as selectors from '../selectors';
import {get} from 'lodash';
import moment from 'moment';
import {showModal} from './index';
import {MULTISELECT, ITEM_TYPE, MODALS} from '../constants';
import eventsUi from './events/ui';
import planningUi from './planning/ui';
import {getItemType, gettext, planningUtils, eventUtils, getItemInArrayById, getErrorMessage} from '../utils';

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
            payload: {eventId: eventId,
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
            payload: {planningId: planningId,
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


const downloadEvents = (url, data) => {
    var req = new XMLHttpRequest();

    req.open('POST', url, true);
    req.responseType = 'blob';
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    req.onload = function(event) {
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


const exportAsArticle = (items = [], download) => (
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
                ...item,
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
        const exportArticlesDispatch = (items, desk, template, type, download, articleTemplate) => {
            const itemIds = items.map((item) => item._id);

            if (download) {
                const timeZoneOffsetSecs = moment().utcOffset() * 60;
                let queryString = `${appConfig.server.url}/planning_download/events?tz=${timeZoneOffsetSecs}`;

                if (template) {
                    queryString = `${queryString}&template=${template}`;
                }

                downloadEvents(queryString, itemIds);

                dispatch(self.deSelectEvents(null, true));
                return Promise.resolve();
            } else {
                return api.save('planning_article_export', {
                    desk: desk === 'personal-workspace' ? null : desk,
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
        const personalWorkspace = {_id: 'personal-workspace', name: 'Personal Workspace'};
        const articleTemplates = getState().templates;
        const defaultDesk = getItemInArrayById(selectors.general.userDesks(getState()), desks.getCurrentDeskId())
            || personalWorkspace;

        return dispatch(showModal({
            modalType: MODALS.EXPORT_AS_ARTICLE,
            modalProps: {
                items: sortableItems,
                action: exportArticlesDispatch,
                desks: [...selectors.general.userDesks(getState()), personalWorkspace],
                templates: templates.filter((t) => download ? t.download : !t.download),
                defaultTemplate: templates.find((t) =>
                    (isPlanning && t.name === 'default_planning') || (!isPlanning && t.name === 'default_event')),
                defaultDesk: defaultDesk,
                type: itemType,
                download: download,
                articleTemplates: articleTemplates,
                defaultArticleTemplate: articleTemplates.find((t) =>
                    t._id === get(defaultDesk, 'default_content_template')) || articleTemplates[0],
                exportListFields: selectors.forms.exportListFields(getState()),
                agendas: selectors.general.agendas(state),
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
