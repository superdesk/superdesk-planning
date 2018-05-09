import {showModal} from '../index';
import planningApi from './api';
import {locks} from '../index';
import main from '../main';

import {
    getErrorMessage,
    lockUtils,
    dispatchUtils,
    gettext,
} from '../../utils';

import * as selectors from '../../selectors';
import {PLANNING, WORKSPACE, MODALS, MAIN, COVERAGES, ASSIGNMENTS} from '../../constants';
import * as actions from '../index';
import {get, set, orderBy, cloneDeep} from 'lodash';

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
    called: 0,
};
const scheduleRefetch = () => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(), nextRefetch)
        )
    )
);

/**
 * Action dispatcher that attempts to assign an agenda to a Planning item
 * @param {object} item - The Planning item to asssign the agenda
 * @param {object} item - Agenda to be assigned
 * @return Promise
 */
const assignToAgenda = (item, agenda) => (
    (dispatch, getState, {notify}) => (
        dispatch(locks.lock(item))
            .then((lockedItem) => {
                lockedItem.agendas = [...get(lockedItem, 'agendas', []), agenda._id];
                return dispatch(self.saveAndUnlockPlanning(lockedItem)).then(() => {
                    notify.success(gettext('Agenda assigned to the planning item.'));
                    return Promise.resolve();
                });
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Could not obtain lock on the planning item.'))
                );
                return Promise.reject(error);
            })
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

const openCancelPlanningModal = (plan, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.lock_action,
        post
    ))
);

const openCancelAllCoverageModal = (plan, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action,
        post
    ))
);

const _openActionModal = (plan,
    action,
    lockAction = null,
    post = false,
    large = false
) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.lock(plan, lockAction))
            .then((lockedPlanning) => {
                lockedPlanning._post = post;
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
 * Action dispatcher that attempts to save and unlock a Planning item
 * @param {object} item - The Planning item to save and unlock
 * @return Promise
 */
const saveAndUnlockPlanning = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(self.save(item))
            .then((savedItem) => dispatch(locks.unlock(savedItem))
                .then(() => Promise.resolve(savedItem))
                .catch(() => {
                    notify.error(gettext('Could not unlock the planning item.'));
                    return Promise.resolve(savedItem);
                }), (error) => {
                notify.error(gettext('Could not save the planning item.'));
                return Promise.resolve(item);
            })
    )
);

/**
 * Action that states that there are Planning items currently loading
 * @param {object} params - Parameters used when querying for planning items
 */
const requestPlannings = (params = {}) => ({
    type: MAIN.ACTIONS.REQUEST,
    payload: {[MAIN.FILTERS.PLANNING]: params},
});

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
        dispatch(actions.actionInProgress(true));
        let resolved = true;

        return dispatch(planningApi.save(plan))
            .then((newPlan) => {
                const newsItem = get(selectors.general.modalProps(getState()), 'newsItem', null);
                const coverages = orderBy(newPlan.coverages, ['firstcreated'], ['desc']);
                const coverage = coverages[0];
                const reassign = false;

                return dispatch(actions.assignments.api.link(coverage.assigned_to, newsItem, reassign))
                    .then(() => {
                        notify.success('Content linked to the planning item.');
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
                        resolved = false;
                        return Promise.reject(error);
                    });
            }, (error) => {
                resolved = false;
                notify.error(
                    getErrorMessage(error, 'Failed to save the Planning item!')
                );

                return Promise.reject(error);
            })
            .finally(() => {
                // resolving scope here because if there is a confirmation modal
                // while saving the planning item, scope won't be available
                const $scope = get(selectors.general.modalProps(getState()), '$scope', null);

                if ($scope) {
                    if (resolved) {
                        $scope.resolve();
                    } else {
                        $scope.reject();
                    }
                }

                dispatch(actions.hideModal());
                dispatch(actions.actionInProgress(false));
            });
    }
);

/**
 * Action to update the values of a single Coverage so the Assignment is placed in the workflow
 * @param {object} original - Original Planning item
 * @param {object} updatedCoverage - Coverage to update (along with any coverage fields to update as well)
 * @param {number} index - index of the Coverage in the coverages[] array
 */
const addCoverageToWorkflow = (original, updatedCoverage, index) => (
    (dispatch) => {
        const updates = {coverages: cloneDeep(original.coverages)};
        const coverage = cloneDeep(updatedCoverage);

        set(coverage, 'workflow_status', COVERAGES.WORKFLOW_STATE.ACTIVE);
        set(coverage, 'assigned_to.state', ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED);
        updates.coverages[index] = coverage;

        return dispatch(planningApi.save(updates, original));
    }
);

/**
 * Action to update the values of a single Coverage so the Assignment is placed in the workflow
 * @param {object} original - Original Planning item
 * @param {object} updatedCoverage - Coverage to update (along with any coverage fields to update as well)
 * @param {number} index - index of the Coverage in the coverages[] array
 */
const removeAssignment = (original, updatedCoverage, index) => (
    (dispatch) => {
        const updates = {coverages: cloneDeep(original.coverages)};
        const coverage = cloneDeep(updatedCoverage);

        updates.coverages[index] = coverage;

        return dispatch(planningApi.save(updates, original));
    }
);

// eslint-disable-next-line consistent-this
const self = {
    spike,
    unspike,
    save,
    saveAndReloadCurrentAgenda,
    _openActionModal,
    clearList,
    fetchToList,
    requestPlannings,
    setInList,
    addToList,
    loadMore,
    refetch,
    duplicate,
    openCancelPlanningModal,
    openCancelAllCoverageModal,
    cancelPlanning,
    cancelAllCoverage,
    onAddCoverageClick,
    saveFromAuthoring,
    scheduleRefetch,
    assignToAgenda,
    saveAndUnlockPlanning,
    addCoverageToWorkflow,
    removeAssignment,
};

export default self;
