import {showModal} from '../index';
import planningApi from './api';
import {locks} from '../index';
import main from '../main';

import {
    checkPermission,
    getErrorMessage,
    lockUtils,
    dispatchUtils,
    gettext,
} from '../../utils';

import * as selectors from '../../selectors';
import {PLANNING, PRIVILEGES, SPIKED_STATE, WORKSPACE, MODALS, MAIN} from '../../constants';
import * as actions from '../index';
import {get, orderBy} from 'lodash';

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const spike = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.spike(item))
            .then((items) => {
                notify.success(gettext('The Planning Item(s) has been spiked.'));
                dispatch(main.closePreviewAndEditorForItems(items));
                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('There was a problem, Planning item not spiked!'))
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const unspike = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.unspike(item))
            .then((items) => {
                dispatch(main.closePreviewAndEditorForItems(items));
                notify.success(gettext('The Planning Item(s) has been unspiked.'));
                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('There was a problem, Planning item not unspiked!'))
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Saves the supplied planning item and reload the
 * list of Agendas and their associated planning items.
 * If the planning item does not have an ._id, then add it to the
 * currently selected Agenda
 * If no Agenda is selected, or the currently selected Agenda is spiked,
 * then notify the end user and reject this action
 * @param {object} item - The planning item to save
 * @return Promise
 */
const saveAndReloadCurrentAgenda = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.saveAndReloadCurrentAgenda(item))
            .then(
                (item) => (
                    dispatch(self.scheduleRefetch())
                        .then(() => dispatch(planningApi.fetchById(item._id, {force: true})))
                        .then((item) => (Promise.resolve(item)))
                ),
                (error) => Promise.reject(error)
            )
    )
);

/**
 * Opens the Planning in read-only mode
 * @param {object} item - The planning item to open
 * @return Promise
 */
const preview = (item) => (
    (dispatch) => {
        dispatch({
            type: PLANNING.ACTIONS.PREVIEW_PLANNING,
            payload: item,
        });
        return Promise.resolve(item);
    }
);

/**
 * Unlock a Planning item and open it for editing
 * @param {object} item - The Planning item to unlock and edit
 * @return Promise
 */
const _unlockAndOpenEditor = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(locks.unlock(item))
            .then((unlockedItem) => {
            // Was related event unlocked ?
                if (unlockedItem.type === 'event') {
                    dispatch(self.openEditor(item));
                } else {
                    dispatch(self.openEditor(unlockedItem));
                }

                return Promise.resolve(unlockedItem);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Could not unlock the planning item.')
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Unlock a Planning item and close editor if opened - used when item closed from workqueue
 * @param {object} item - The Planning item to unlock
 * @return Promise
 */
const unlockAndCloseEditor = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.unlock(item))
            .then(() => {
                if (selectors.getCurrentPlanningId(getState()) === item._id) {
                    dispatch({type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR});
                }

                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Could not unlock the planning item.')
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Lock and open a Planning item for editing
 * @param {object} item - The Planning item to lock and edit
 * @return Promise
 */
const _lockAndOpenEditor = (item, checkWorkspace = true) => (
    (dispatch, getState, {notify}) => {
        const currentWorkspace = selectors.getCurrentWorkspace(getState());

        if (checkWorkspace && currentWorkspace !== WORKSPACE.PLANNING) {
            dispatch(self.preview(item));
            return Promise.resolve(item);
        }

        // If the user already has a lock, don't obtain a new lock, open it directly
        if (item && lockUtils.isItemLockedInThisSession(item,
            selectors.getSessionDetails(getState()))) {
            dispatch(self._openEditor(item));
            return Promise.resolve(item);
        }

        return dispatch(planningApi.lock(item))
            .then((lockedItem) => {
                dispatch(self._openEditor(lockedItem));
                return Promise.resolve(lockedItem);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Could not obtain lock on the planning item.')
                );
                dispatch(self._openEditor(item));
                return Promise.reject(error);
            });
    }
);

/**
 * Action for closing the planning editor
 * @return Promise
 */
const closeEditor = (item) => (
    (dispatch, getState, {notify}) => {
        dispatch({type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR});

        if (!item) return Promise.resolve();

        if (lockUtils.isItemLockedInThisSession(item, selectors.getSessionDetails(getState()))) {
            return dispatch(planningApi.unlock(item))
                .then(() => Promise.resolve(item))
                .catch(() => {
                    notify.error('Could not unlock the planning item.');
                    return Promise.resolve(item);
                });
        } else {
            return Promise.resolve(item);
        }
    }
);

/**
 * Action for opening the planning editor
 *
 */
const _openEditor = (item) => ({
    type: PLANNING.ACTIONS.OPEN_PLANNING_EDITOR,
    payload: item,
});

/**
 * Previews the Planning Editor
 * Also selects the associated agenda of this planning item
 * @param {string} pid - The Planning item id to preview
 * @return Promise
 */
const previewPlanningAndOpenAgenda = (pid, agenda) => (
    (dispatch, getState) => {
        if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
            dispatch(actions.selectAgenda(agenda._id));
        }

        // open the planning details
        return dispatch(self.preview(pid));
    }
);

/**
 * Opens the Planning Editor
 * Also selects the associated agenda of this planning item
 * @param {Object} planning - The Planning item to open
 * @param {string} agendaId - The agendaId to set associated agenda as selected
 * @return Promise
 */
const openPlanningWithAgenda = (planning, agendaId) => (
    (dispatch, getState) => {
        if (agendaId && agendaId !== selectors.getCurrentAgendaId(getState())) {
            dispatch(actions.selectAgenda(agendaId));
        }

        // open the planning details
        return dispatch(self._openEditor(planning));
    }
);

/**
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return Promise
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: PLANNING.ACTIONS.SET_ONLY_FUTURE,
        });

        return dispatch(actions.fetchSelectedAgendaPlannings());
    }
);

/**
 * Action dispatcher to set the planning item filter keyword
 * This is used by the PlanningPanelContainer through the selector
 * to filter the list of planning items to display
 * @param {string} value - The filter string used to filter planning items
 */
const filterByKeyword = (value) => (
    (dispatch) => {
        dispatch({
            type: PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD,
            payload: value && value.trim() || null,
        });
        return dispatch(actions.fetchSelectedAgendaPlannings());
    }
);

/**
 * Clears the Planning List
 */
const clearList = () => ({type: PLANNING.ACTIONS.CLEAR_LIST});

/**
 * Action that sets the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const setInList = (ids) => ({
    type: PLANNING.ACTIONS.SET_LIST,
    payload: ids,
});

/**
 * Action that adds Planning items to the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const addToList = (ids) => ({
    type: PLANNING.ACTIONS.ADD_TO_LIST,
    payload: ids,
});

/**
 * Queries the API and sets the Planning List to the items received
 * @param {object} params - Parameters used when querying for planning items
 */
const fetchToList = (params) => (
    (dispatch) => {
        dispatch(self.requestPlannings(params));
        return dispatch(planningApi.fetch(params))
            .then((items) => (dispatch(self.setInList(
                items.map((p) => p._id)
            ))));
    }
);

/**
 * Fetch more planning items and add them to the list
 * Uses planning.lastRequestParams from the redux store for the api query,
 * then adds the received Planning items to the Planning List
 */
const loadMore = () => (
    (dispatch, getState) => {
        const previousParams = selectors.main.lastRequestParams(getState());
        const totalItems = selectors.main.planningTotalItems(getState());
        const planIdsInList = selectors.planning.planIdsInList(getState());

        if (totalItems === get(planIdsInList, 'length', 0)) {
            return Promise.resolve();
        }

        const params = {
            ...previousParams,
            page: get(previousParams, 'page', 1) + 1,
        };

        return dispatch(planningApi.fetch(params))
            .then((items) => {
                if (get(items, 'length', 0) === MAIN.PAGE_SIZE) {
                    dispatch(self.requestPlannings(params));
                }
                dispatch(self.addToList(items.map((p) => p._id)));
                return Promise.resolve(items);
            });
    }
);

/**
 * Refetch planning items based on the current search
 */
const refetch = () => (
    (dispatch, getState, {notify}) => {
        if (!selectors.main.isPlanningView(getState())) {
            return Promise.resolve();
        }

        return dispatch(planningApi.refetch())
            .then(
                (items) => {
                    dispatch(self.setInList(items.map((p) => p._id)));
                    return Promise.resolve(items);
                }, (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to update the planning list!')
                    );
                    return Promise.reject(error);
                }
            );
    }
);

/**
 * Schedule the refetch to run after one second and avoid any other refetch
 */
let nextRefetch = {
    called: 0
};
const scheduleRefetch = () => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(), nextRefetch)
        )
    )
);

const duplicate = (plan) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.duplicate(plan))
            .then((newPlan) => {
                notify.success(gettext('Planning duplicated'));
                return dispatch(main.lockAndEdit(newPlan));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to duplicate the Planning')
                );

                return Promise.reject(error);
            })
    )
);

const cancelPlanning = (plan) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.cancel(plan))
            .then((plan) => {
                notify.success(gettext('Planning Item has been cancelled'));
                return Promise.resolve(plan);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to cancel the Planning Item!'))
                );
                return Promise.reject(error);
            })
    )
);

const cancelAllCoverage = (plan) => (
    (dispatch, getState, {notify}) => {
        // delete _cancelAllCoverage used for UI purposes
        delete plan._cancelAllCoverage;

        return dispatch(planningApi.cancelAllCoverage(plan))
            .then((plan) => {
                notify.success(gettext('All Coverage has been cancelled'));
                return Promise.resolve(plan);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to cancel all coverage!'))
                );

                return Promise.reject(error);
            });
    }
);

const openCancelPlanningModal = (plan, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.lock_action,
        publish
    ))
);

const openCancelAllCoverageModal = (plan, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action,
        publish
    ))
);

const _openActionModal = (plan,
    action,
    lockAction = null,
    publish = false,
    large = false
) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.lock(plan, lockAction))
            .then((lockedPlanning) => {
                lockedPlanning._publish = publish;
                return dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        planning: lockedPlanning,
                        actionType: action,
                        large: large,
                    },
                }));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to obtain the lock on Planning Item')
                );

                return Promise.reject(error);
            }
            )
    )
);

const save = (item) => (
    (dispatch, getState) => {
        if (selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING) {
            return dispatch(self.saveFromAuthoring(item));
        } else {
            return dispatch(self.saveAndReloadCurrentAgenda(item));
        }
    }
);

/**
 * Close advanced search panel
 */
const closeAdvancedSearch = () => ({type: PLANNING.ACTIONS.CLOSE_ADVANCED_SEARCH});

/**
 * Open advanced search panel
 */
const openAdvancedSearch = () => ({type: PLANNING.ACTIONS.OPEN_ADVANCED_SEARCH});

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const search = (params = {spikeState: SPIKED_STATE.NOT_SPIKED}) => (
    (dispatch) => {
        dispatch(self._setAdvancedSearch(params));
        return dispatch(actions.fetchSelectedAgendaPlannings());
    }
);

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const resetSearch = () => (
    (dispatch) => {
        dispatch(self._resetAdvancedSearch());
        return dispatch(actions.fetchSelectedAgendaPlannings());
    }
);

const _setAdvancedSearch = (params = {}) => ({
    type: PLANNING.ACTIONS.SET_ADVANCED_SEARCH,
    payload: params,
});

const _resetAdvancedSearch = () => ({type: PLANNING.ACTIONS.CLEAR_ADVANCED_SEARCH});

/**
 * Action that states that there are Planning items currently loading
 * @param {object} params - Parameters used when querying for planning items
 */
const requestPlannings = (params = {}) => ({
    type: MAIN.ACTIONS.REQUEST,
    payload: {[MAIN.FILTERS.PLANNING]: params},
});

const openEditor = checkPermission(
    _lockAndOpenEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a planning item!',
    preview
);

const unlockAndOpenEditor = checkPermission(
    _unlockAndOpenEditor,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to ed a planning item!'
);

/**
 * Toggle selected status for given item id
 *
 * @param {String} itemId
 */
function toggleItemSelected(itemId) {
    return {
        type: PLANNING.ACTIONS.TOGGLE_SELECTED,
        payload: itemId,
    };
}

/**
 * Select all visible items
 */
function selectAll() {
    return {type: PLANNING.ACTIONS.SELECT_ALL};
}

/** * Deselect all selected items
 */
function deselectAll() {
    return {type: PLANNING.ACTIONS.DESELECT_ALL};
}

const onAddCoverageClick = (item) => (
    (dispatch, getState, {notify}) => {
        const state = getState();
        const lockedItems = selectors.locks.getLockedItems(state);
        let promise;

        // If a differet planning item is already open in editor, unlock that.
        const currentItem = selectors.forms.currentItem(state);

        if (currentItem && get(item, '_id') !== get(currentItem, '_id')) {
            dispatch(locks.unlock(currentItem));
        }

        // If it is an existing item and the item is not locked
        // then lock the item, otherwise return the existing item
        if (get(item, '_id') && !lockUtils.getLock(item, lockedItems)) {
            promise = dispatch(locks.lock(item));
        } else {
            promise = Promise.resolve(item);
        }

        return promise.then((lockedItem) => {
            dispatch(planningApi.receivePlannings([lockedItem]));
            dispatch(main.closeEditor());
            dispatch(main.openEditor(lockedItem));
            return Promise.resolve(lockedItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to lock the item')
            );

            return Promise.reject(error);
        });
    }
);

const saveFromAuthoring = (plan) => (
    (dispatch, getState, {notify}) => {
        const {$scope, newsItem} = selectors.getCurrentModalProps(getState());

        dispatch(actions.actionInProgress(true));
        return dispatch(planningApi.save(plan))
            .then((newPlan) => {
                const coverages = orderBy(newPlan.coverages, ['firstcreated'], ['desc']);
                const coverage = coverages[0];

                return dispatch(actions.assignments.api.link(coverage.assigned_to, newsItem))
                    .then(() => {
                        notify.success('Content linked to the planning item.');
                        $scope.resolve();
                        dispatch(actions.actionInProgress(false));

                        // If a new planning item was created, close editor
                        // As it is too early for scope.destroy() watcher to get hold of it
                        if (!get(plan, '_id')) {
                            return dispatch(main.closeEditor(newPlan));
                        }

                        return Promise.resolve(newPlan);
                    }, (error) => {
                        notify.error(
                            getErrorMessage(error, 'Failed to link to the Planning item!')
                        );
                        $scope.reject();
                        return Promise.reject(error);
                    });
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to save the Planning item!')
                );
                $scope.reject();
                return Promise.reject(error);
            })
            .finally(() => {
                dispatch(actions.hideModal());
                dispatch(actions.actionInProgress(false));
            });
    }
);

// eslint-disable-next-line consistent-this
const self = {
    spike,
    unspike,
    save,
    saveAndReloadCurrentAgenda,
    preview,
    _openActionModal,
    openEditor,
    _openEditor,
    closeEditor,
    previewPlanningAndOpenAgenda,
    openPlanningWithAgenda,
    toggleOnlyFutureFilter,
    filterByKeyword,
    unlockAndOpenEditor,
    unlockAndCloseEditor,
    clearList,
    fetchToList,
    requestPlannings,
    setInList,
    addToList,
    loadMore,
    refetch,
    duplicate,
    closeAdvancedSearch,
    openAdvancedSearch,
    _setAdvancedSearch,
    _resetAdvancedSearch,
    search,
    resetSearch,
    toggleItemSelected,
    selectAll,
    deselectAll,
    openCancelPlanningModal,
    openCancelAllCoverageModal,
    cancelPlanning,
    cancelAllCoverage,
    onAddCoverageClick,
    saveFromAuthoring,
    scheduleRefetch
};

export default self;
