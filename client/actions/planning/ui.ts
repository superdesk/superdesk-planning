import {showModal} from '../index';
import planningApi from './api';
import {locks} from '../index';
import main from '../main';
import eventsUi from '../events/ui';
import {ITEM_TYPE} from '../../constants';

import {
    getErrorMessage,
    lockUtils,
    dispatchUtils,
    gettext,
    getItemId,
    isExistingItem,
    planningUtils,
} from '../../utils';

import * as selectors from '../../selectors';
import {PLANNING, WORKSPACE, MODALS, MAIN, COVERAGES} from '../../constants';
import * as actions from '../index';
import {get, orderBy, cloneDeep} from 'lodash';

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
        var previewId = selectors.main.previewId(getState());

        if (!selectors.main.isPlanningView(getState())) {
            return Promise.resolve();
        }
        if (previewId) {
            dispatch(main.fetchItemHistory({_id: previewId, type: ITEM_TYPE.PLANNING}));
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
 * @param {object} agenda - Agenda to be assigned
 * @return Promise
 */
const assignToAgenda = (item, agenda) => (
    (dispatch, getState, {notify}) => (
        dispatch(locks.lock(item, 'assign_agenda'))
            .then((original) => {
                const updates = cloneDeep(original);

                updates.agendas = [...get(original, 'agendas', []), agenda._id];
                return dispatch(main.saveAndUnlockItem(original, updates)).then(() => {
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
                const openInModal = selectors.forms.currentItemIdModal(getState());

                if (get(plan, 'event_item')) {
                    dispatch(main.unlockAndCancel(plan)).then(() => {
                        dispatch(main.openForEdit(newPlan, !openInModal, openInModal));
                    });
                } else {
                    dispatch(main.openForEdit(newPlan, !openInModal, openInModal));
                }

                return Promise.resolve(newPlan);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to duplicate the Planning')
                );

                return Promise.reject(error);
            })
    )
);

const cancelPlanning = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.cancel(original, updates))
            .then((plan) => {
                notify.success(gettext('Planning Item has been cancelled'));
                dispatch(main.closePreviewAndEditorForItems([plan], null, '_id', true));

                return plan;
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to cancel the Planning Item!'))
                );
                return Promise.reject(error);
            })
    )
);

const cancelAllCoverage = (original, updates) => (
    (dispatch, getState, {notify}) => {
        // delete _cancelAllCoverage used for UI purposes
        delete original._cancelAllCoverage;

        return dispatch(planningApi.cancelAllCoverage(original, updates))
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

const openFeaturedPlanningModal = () => (
    (dispatch, getState, {notify}) => {
        const lockUser = selectors.featuredPlanning.featureLockUser(getState());
        const currentUser = selectors.general.currentUserId(getState());

        if (lockUser && lockUser !== currentUser) {
            return dispatch(showModal({modalType: MODALS.UNLOCK_FEATURED_STORIES}));
        }

        return dispatch(planningApi.lockFeaturedPlanning())
            .then(() => dispatch(showModal({
                modalType: MODALS.FEATURED_STORIES,
            })),
            (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to lock featured story action!'))
                );
            });
    }
);

const modifyPlanningFeatured = (item, remove = false) => (
    (dispatch) => (
        dispatch(main.openActionModalFromEditor(
            item,
            gettext('Save changes before adding to top stories ?'),
            (unlockedItem, previousLock, openInEditor, openInModal) => (
                dispatch(self._modifyPlanningFeatured(unlockedItem, remove))
                    .then((updatedItem) => {
                        if (get(previousLock, 'action')) {
                            return dispatch(locks.lock(updatedItem, previousLock.action));
                        }
                    })
            )
        ))
    )
);

/**
 * Action dispatcher that mark/unmark a Planning item as featured
 * @param {object} item - The Planning item to add/remove as featured
 * @return Promise
 */
const _modifyPlanningFeatured = (item, remove = false) => (
    (dispatch, getState, {api, notify}) => (
        dispatch(locks.lock(item, remove ? 'remove_featured' : 'add_featured'))
            .then((lockedItem) => {
                lockedItem.featured = !remove;
                return dispatch(self.saveAndUnlockPlanning(lockedItem)).then((updatedItem) => {
                    remove ? notify.success(gettext('Planning item removed as featured story')) :
                        notify.success(gettext('Planning item added as featured story'));
                    return Promise.resolve(updatedItem);
                }, (error) => {
                    remove ? notify.error(gettext('Failed to remove planning item as featured story')) :
                        notify.error(gettext('Failed to add planning item added as featured story'));
                    return Promise.reject(error);
                });
            })
    )
);

const openCancelPlanningModal = (plan, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.lock_action,
        post
    ))
);

const openSpikeModal = (plan, post = false, modalProps = {}) => (
    (dispatch) => (
        dispatch(self._openActionModal(
            plan,
            PLANNING.ITEM_ACTIONS.SPIKE.actionName,
            null,
            post,
            false,
            modalProps
        )
        )
    )
);

const openUnspikeModal = (plan, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.UNSPIKE.actionName,
        null,
        post
    ))
);

const openCancelAllCoverageModal = (plan, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action,
        post
    ))
);

const _openActionModal = (
    plan,
    action,
    lockAction = null,
    post = false,
    large = false,
    modalProps = {}
) => (
    (dispatch, getState, {notify}) => (
        dispatch(planningApi.lock(plan, lockAction))
            .then((lockedPlanning) => {
                lockedPlanning._post = post;
                return dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        original: lockedPlanning,
                        actionType: action,
                        large: large,
                        ...modalProps,
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

const save = (original, updates) => (
    (dispatch, getState) => {
        if (selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING) {
            return dispatch(self.saveFromAuthoring(original, updates));
        } else {
            if (get(updates, '_post') && get(original, 'recurrence_id')) {
                return dispatch(eventsUi.openEventPostModal(
                    original,
                    updates,
                    true,
                    null,
                    {},
                    original,
                    planningApi.save.bind(null, original, updates)));
            }
            return dispatch(planningApi.save(original, updates));
        }
    }
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

        // If a different planning item is already open in editor, unlock that.
        const currentItem = selectors.forms.currentItem(state);

        if (currentItem && getItemId(item) !== getItemId(currentItem)) {
            dispatch(locks.unlock(currentItem));
        }

        // If it is an existing item and the item is not locked
        // then lock the item, otherwise return the existing item
        if (isExistingItem(item) && !lockUtils.getLock(item, lockedItems)) {
            promise = dispatch(locks.lock(item));
        } else {
            promise = Promise.resolve(item);
        }

        return promise.then((lockedItem) => {
            dispatch(planningApi.receivePlannings([lockedItem]));
            dispatch(main.closeEditor());
            dispatch(main.openForEdit(lockedItem));
            return Promise.resolve(lockedItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to lock the item')
            );

            return Promise.reject(error);
        });
    }
);

const saveFromAuthoring = (original, updates) => (
    (dispatch, getState, {notify}) => {
        dispatch(actions.actionInProgress(true));
        let resolved = true;

        return dispatch(planningApi.save(original, updates))
            .then((newPlan) => {
                const newsItem = get(selectors.general.modalProps(getState()), 'newsItem') ||
                    get(selectors.general.previousModalProps(getState()), 'newsItem');
                const coverages = orderBy(newPlan.coverages, ['firstcreated'], ['desc']);
                const coverage = coverages[0];
                const reassign = false;

                return dispatch(actions.assignments.api.link(coverage.assigned_to, newsItem, reassign))
                    .then(() => {
                        notify.success('Content linked to the planning item.');

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
    (dispatch, getState, {notify}) => {
        let updates = {coverages: cloneDeep(original.coverages)};

        updates.coverages[index] = planningUtils.getActiveCoverage(updatedCoverage,
            selectors.general.newsCoverageStatus(getState()));

        return dispatch(planningApi.save(original, updates))
            .then((savedItem) => {
                notify.success(gettext('Coverage added to workflow.'));
                return dispatch(self.updateItemOnSave(savedItem));
            });
    }
);

const addScheduledUpdateToWorkflow = (original, coverage, coverageIndex, scheduledUpdate, index) => (
    (dispatch, getState, {notify}) => {
        let updates = {coverages: cloneDeep(original.coverages)};
        let coverage = updates.coverages[coverageIndex];

        coverage.scheduled_updates[index] = planningUtils.getActiveCoverage(scheduledUpdate,
            selectors.general.newsCoverageStatus(getState()));

        return dispatch(planningApi.save(original, updates))
            .then((savedItem) => {
                notify.success(gettext('Scheduled update added to workflow.'));
                return dispatch(self.updateItemOnSave(savedItem));
            });
    }
);

/**
 * Action to update the values of a single Coverage so the Assignment is placed in the workflow
 * @param {object} original - Original Planning item
 * @param {object} updatedCoverage - Coverage to update (along with any coverage fields to update as well)
 * @param {number} index - index of the Coverage in the coverages[] array
 */
const removeAssignment = (original, updatedCoverage, index) => (
    (dispatch, getState, {notify}) => {
        const updates = {coverages: cloneDeep(original.coverages)};
        const coverage = cloneDeep(updatedCoverage);

        updates.coverages[index] = coverage;

        return dispatch(planningApi.save(original, updates))
            .then((savedItem) => {
                notify.success(gettext('Removed assignment from coverage.'));
                return dispatch(self.updateItemOnSave(savedItem));
            });
    }
);

const updateItemOnSave = (savedItem) => (
    (dispatch) => {
        const modifiedItem = planningUtils.modifyForClient(savedItem);

        dispatch(planningApi.receivePlannings([modifiedItem]));
        return Promise.resolve(modifiedItem);
    }
);

const addNewCoverageToPlanning = (coverageType, item) => (
    (dispatch) => (dispatch(main.openForEdit({
        ...item,
        _addCoverage: coverageType,
    })))
);

const openCancelCoverageModal = (planning, coverage, index, onSubmit, onCancel,
    scheduledUpdate, scheduledUpdateIndex) => (
    (dispatch, getState) =>
        dispatch(showModal({
            modalType: MODALS.ITEM_ACTIONS_MODAL,
            modalProps: {
                original: planning,
                actionType: COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE.actionName,
                coverage: coverage,
                index: index,
                onSubmit: onSubmit,
                onCancel: onCancel,
                scheduledUpdate: scheduledUpdate,
                scheduledUpdateIndex: scheduledUpdateIndex,
            },
        }))
);

const cancelCoverage = (original, updatedCoverage, index, scheduledUpdate, scheduledUpdateIndex) => (
    (dispatch, getState, {notify}) => {
        let updates = {coverages: cloneDeep(original.coverages)};

        if (!scheduledUpdate) {
            updates.coverages[index] = cloneDeep(updatedCoverage);
        } else {
            updates.coverages[index].scheduled_updates[scheduledUpdateIndex] = cloneDeep(scheduledUpdate);
        }

        return dispatch(planningApi.save(original, updates))
            .then((savedItem) => {
                notify.success(gettext('Coverage cancelled.'));
                return dispatch(self.updateItemOnSave(savedItem));
            });
    }
);

// eslint-disable-next-line consistent-this
const self = {
    spike,
    unspike,
    openSpikeModal,
    openUnspikeModal,
    save,
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
    addCoverageToWorkflow,
    removeAssignment,
    _modifyPlanningFeatured,
    modifyPlanningFeatured,
    openFeaturedPlanningModal,
    updateItemOnSave,
    addNewCoverageToPlanning,
    openCancelCoverageModal,
    cancelCoverage,
    addScheduledUpdateToWorkflow,
};

export default self;
