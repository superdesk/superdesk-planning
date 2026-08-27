import {get, cloneDeep, pickBy, every} from 'lodash';
import {IEventItem, IPlanningSearchParams, IPlanningItem, IFile} from '../../interfaces';
import {appConfig} from 'appConfig';
import {planningApi} from '../../superdeskApi';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {
    getErrorMessage,
    planningUtils,
    isExistingItem,
    isPublishedItemId,
    isValidFileInput,
    gettext,
} from '../../utils';
import {
    PLANNING,
    POST_STATE,
    SPIKED_STATE,
    MAIN,
    WORKSPACE,
    TO_BE_CONFIRMED_FIELD,
} from '../../constants';
import main from '../main';
import {planningParamsToSearchParams} from '../../utils/search';
import {getRelatedEventIdsForPlanning} from '../../utils/planning';
import moment from 'moment';
import planningUi from './ui';
import {uploadFileWithRetry} from '../../utils/upload';

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const spike = (items) => (
    (dispatch, getState, {api}) => {
        let plansToSpike = (Array.isArray(items) ? items : [items]);

        return Promise.all(
            plansToSpike.map((plan) => (api.update('planning_spike', {...plan}, {})))
        ).then(
            () => Promise.resolve(plansToSpike),
            (error) => (Promise.reject(error))
        );
    }
);

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const unspike = (items) => (
    (dispatch, getState, {api}) => {
        let plansToSpike = (Array.isArray(items) ? items : [items]);

        return Promise.all(
            plansToSpike.map((plan) => (api.update('planning_unspike', {...plan}, {})))
        ).then(
            () => Promise.resolve(plansToSpike),
            (error) => (Promise.reject(error))
        );
    }
);

const cancel = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'planning_cancel',
            original,
            {reason: get(updates, 'reason', undefined)}
        )
    )
);

const cancelAllCoverage = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'planning_cancel',
            original,
            {
                reason: get(updates, 'reason', undefined),
                cancel_all_coverage: true,
            }
        )
    )
);

// Action dispatcher to perform fetch the list of planning items from the server.
function query(
    params: IPlanningSearchParams = {},
    storeTotal = true,
    timeZoneOffset = null,
    includeScheduledUpdates = false
) {
    return (dispatch, getState) => (
        planningApi.planning.search(planningParamsToSearchParams({
            ...params,
            timezoneOffset: timeZoneOffset ?? params.timezoneOffset,
            filter_id: params.filter_id || selectors.main.currentSearchFilterId(getState()),
            includeScheduledUpdates: includeScheduledUpdates || params.includeScheduledUpdates,
        }))
            .then((response) => {
                if (storeTotal) {
                    dispatch(main.setTotal(MAIN.FILTERS.PLANNING, response._meta?.total ?? 0));
                }

                if (response?._items != null) {
                    if (selectors.featuredPlanning.inUse(getState()) &&
                        params.advancedSearch?.dates?.range === 'for_date') {
                        // For featuredstories modal, we get all items in a loop
                        // So, send the total along with the result for loop calculation
                        const result = {
                            _items: response._items,
                            total: response._meta.total,
                        };

                        return Promise.resolve(result);
                    }

                    return Promise.resolve(response);
                } else {
                    return Promise.reject('Failed to retrieve items');
                }
            }, (error) => Promise.reject(error))
    );
}

const handleItemsForLastFetchedDay = (
    items: Array<IPlanningItem>,
    params: IPlanningSearchParams = {},
    total: number,
    dispatch: any,
    getState: () => any,
): Promise<Array<IPlanningItem>> => {
    if (items.length < 1) {
        return Promise.resolve([]);
    }

    const lastDayGroupItems = selectors.planning.lastDayGroup(getState()) ?? [];
    const itemIdsInList = selectors.planning.planIdsInList(getState());

    // all items in list view and items for the last group
    const hasFetchedAllItems = total === (items.length + lastDayGroupItems.length + itemIdsInList.length);

    if (hasFetchedAllItems) {
        dispatch(storeLastDayGroup([]));

        return Promise.resolve([
            ...items,
            ...lastDayGroupItems
        ]);
    }

    const itemsGrouped = planningUtils.getPlanningByDate(
        [...items, ...lastDayGroupItems],
        {},
        params.advancedSearch?.dates?.start ?? moment(),
        params.advancedSearch?.dates?.end,
        params.timezoneOffset,
    );

    // On initial page load we still trigger loadMore to avoid dead-end scrolling
    // states, but keep currently fetched items visible instead of returning an
    // empty list while waiting for subsequent pages.
    if (itemsGrouped.length === 1 || params.page === 1) {
        const lastPage = Math.ceil(total / params.maxResults);
        const hasMorePages = params.page < lastPage;

        // No pages left to fetch
        if (!hasMorePages) {
            dispatch(storeLastDayGroup([]));

            return Promise.resolve(itemsGrouped.flatMap((x) => x.events));
        }

        if (itemsGrouped.length > 1) {
            const lastGroup = itemsGrouped[itemsGrouped.length - 1];

            dispatch(storeLastDayGroup(lastGroup.events));
            dispatch(planningUi.loadMore());

            return Promise.resolve(
                itemsGrouped.slice(0, itemsGrouped.length - 1).flatMap((x) => x.events),
            );
        }

        dispatch(storeLastDayGroup([...items, ...lastDayGroupItems]));
        dispatch(planningUi.loadMore());

        return Promise.resolve(itemsGrouped.flatMap((x) => x.events));
    } else if (itemsGrouped.length > 1) {
        const lastGroup = itemsGrouped[itemsGrouped.length - 1];

        dispatch(storeLastDayGroup(lastGroup.events));

        return Promise.resolve(
            itemsGrouped.slice(0, itemsGrouped.length - 1).flatMap((x) => x.events),
        );
    }

    return Promise.resolve(itemsGrouped.flatMap((x) => x.events));
};

/**
 * Action dispatcher for requesting a fetch of planning items
 * Then store them in the redux store. This also replaces the list of
 * visibile Planning items for the PlanningList component
 * @param {object} params - Parameters used when fetching the planning items
 * @return Promise
 */
const fetch = (params: IPlanningSearchParams = {}) => ((dispatch, getState) => (
    dispatch(self.query(params, true))
        .then((response) => {
            // added for test cases
            if (response._meta == null) {
                return response._items;
            }

            return handleItemsForLastFetchedDay(
                response._items,
                {
                    ...params,
                    maxResults: response._meta.max_results,
                    page: response._meta.page,
                    advancedSearch: {
                        ...params.advancedSearch,
                        dates: {
                            ...(params.advancedSearch?.dates ?? {}),
                            start: params.advancedSearch?.dates?.start
                                ? params.advancedSearch.dates.start
                                : moment(),
                            end: params.advancedSearch?.dates?.end,
                        },
                    },
                },
                response._meta.total,
                dispatch,
                getState,
            );
        })
        .then((items) => {
            return dispatch(self.fetchPlanningsEvents(items))
                .then(() => {
                    dispatch(self.receivePlannings(items));

                    return Promise.resolve(items);
                })
                .catch((error) => Promise.reject(error));
        })
        .catch((error) => {
            dispatch(self.receivePlannings([]));

            return Promise.reject(error);
        })
));

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page = 1, plannings = []) => (
    (dispatch, getState) => {
        const prevParams = selectors.main.lastRequestParams(getState());
        const params = {
            ...prevParams,
            page,
        };

        return dispatch(self.query(params, true))
            .then((response) => {
                return handleItemsForLastFetchedDay(
                    response._items,
                    {
                        ...params,
                        maxResults: response._meta.max_results,
                        page: response._meta.page,
                        advancedSearch: {
                            ...params.advancedSearch,
                            dates: {
                                ...(params.advancedSearch?.dates ?? {}),
                                start: params.advancedSearch?.dates?.start
                                    ? params.advancedSearch.dates.start
                                    : moment(),
                                end: params.advancedSearch?.dates?.end,
                            },
                        },
                    },
                    response._meta.total,
                    dispatch,
                    getState,
                );
            })
            .then((items) => {
                const allPlanningItems = plannings.concat(items);
                const nextPage = page + 1;

                if ((prevParams?.page ?? 1) >= nextPage) {
                    return dispatch(self.refetch(nextPage, allPlanningItems));
                }

                dispatch(self.receivePlannings(allPlanningItems));

                return Promise.resolve(allPlanningItems);
            })
            .catch((error) => Promise.reject(error));
    }
);

/**
 * Action dispatcher to fetch Events associated with Planning items
 * and place them in the local store.
 * @param {Array} plannings - An array of Planning items
 * @return Promise
 */
const fetchPlanningsEvents = (plannings: Array<IPlanningItem>) => (
    (dispatch, getState) => {
        const loadedEvents = selectors.events.storedEvents(getState());

        const linkedEventIds = plannings
            .map((plan) => getRelatedEventIdsForPlanning(plan))
            .flat()
            .filter((eventId) => loadedEvents[eventId] == null);

        // load missing events, if there are any
        return linkedEventIds.length > 0 ?
            dispatch(actions.events.api.silentlyFetchEventsById(linkedEventIds, 'both')) :
            Promise.resolve([]);
    }
);

/**
 * Action Dispatcher that fetches a Planning Item by ID
 * and adds or updates it in the redux store.
 * If the Planning item already exists in the local store, then don't
 * fetch the Planning item from the API
 * @param {string} pid - The ID of the Planning item to fetch
 * @param {boolean} force - Force using the API instead of Redux store
 * @param {boolean} saveToStore - If true, save the Planning item in the Redux store
 * @param {boolean} loadEvents - If true, load associated Event item as well
 * @return Promise
 */
const fetchById = (pid, {force = false, saveToStore = true, loadEvents = true} = {}) => (
    (dispatch) => {
        if (isPublishedItemId(pid)) {
            return Promise.resolve({});
        }

        return planningApi.planning.getById(pid, saveToStore, force).then((item) => {
            if (loadEvents) {
                return dispatch(self.fetchPlanningsEvents([item]))
                    .then(
                        () => Promise.resolve(item),
                        (error) => Promise.reject(error)
                    );
            }

            return Promise.resolve(item);
        }, (error) => Promise.reject(error));
    }
);

/**
 * Action Dispatcher to fetch planning history from the server
 * This will add the history of action on that planning item in planning history list
 * @param {object} currentPlanningId - Query parameters to send to the server
 * @return arrow function
 */
const fetchPlanningHistory = (currentPlanningId) => (
    (dispatch, getState, {api}) => (
        // Query the API and sort by created
        api('planning_history').query({
            where: {planning_id: currentPlanningId},
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
            .then((data) => (Promise.resolve(data._items)), (error) => (Promise.reject(error)))
    )
);

/**
 * Action to receive the history of actions on planning item
 * @param {array} planningHistoryItems - An array of planning history items
 * @return object
 */
const receivePlanningHistory = (planningHistoryItems) => ({
    type: PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY,
    payload: planningHistoryItems,
});

/**
 * Action dispatcher to load Planning items by ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {string} id - a single Planning ID to fetch
 * @param {string} spikeState - Planning item's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @param {boolean} saveToStore - If true, save the Planning item in the Redux store
 * @return Promise
 */
const loadPlanningById = (id, spikeState = SPIKED_STATE.BOTH, saveToStore = true) => (
    (dispatch) => planningApi.planning.getById(id)
        .then((item) => {
            if (saveToStore) {
                dispatch(self.receivePlannings([item]));
            }

            return Promise.resolve([item]);
        }, (error) => (Promise.reject(error)))
);

function loadPlanningByIds(ids: Array<IPlanningItem['_id']>, saveToStore: boolean = true) {
    return (dispatch) => (
        planningApi.planning.getByIds(ids)
            .then((items) => {
                if (saveToStore && items.length > 0) {
                    dispatch(self.receivePlannings(items));
                }

                return items;
            })
    );
}

/**
 * Action dispatcher to load Planning items by Event ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {string} eventId - The Event ID used to query the API
 * @param {boolean} loadToStore - If true, save the Planning Items to the Redux Store
 * @return Promise
 */
const loadPlanningByEventId = (eventId: IEventItem['_id'], loadToStore: boolean = true) => (
    (dispatch) => (
        planningApi.planning.search({
            event_item: [eventId],
            only_future: false,
            include_killed: true,
        })
            .then((data) => {
                if (loadToStore) {
                    dispatch(self.receivePlannings(data._items));
                }

                return Promise.resolve(data._items);
            }, (error) => Promise.reject(error))
    )
);

const loadPlanningByRecurrenceId = (recurrenceId, loadToStore = true) => (
    (dispatch) => (
        planningApi.planning.search({
            recurrence_id: recurrenceId,
            only_future: false,
        })
            .then((data) => {
                if (loadToStore) {
                    dispatch(self.receivePlannings(data._items));
                }

                return Promise.resolve(data._items);
            }, (error) => Promise.reject(error))
    )
);

/**
 * Action Dispatcher to get a single Planning item
 * If the Planning item is already stored in the Redux store, then return that
 * Otherwise fetch the Planning item from the server and optionally
 * save the Planning item in the Redux store
 * @param {string} planId - The ID of the Planning item to retrieve
 * @param {boolean} saveToStore - If true, save the Planning item in the Redux store
 */
const getPlanning = (planId, saveToStore = true) => (
    (dispatch, getState) => {
        const plannings = selectors.planning.storedPlannings(getState());

        if (planId in plannings) {
            return Promise.resolve(plannings[planId]);
        }

        return dispatch(self.loadPlanningById(planId, SPIKED_STATE.BOTH, saveToStore))
            .then(
                (items) => Promise.resolve(items[0]),
                (error) => Promise.reject(error)
            );
    }
);

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param {object} original - If supplied, will use this as the original Planning item
 * @param {object} planUpdates - The Planning item to save
 * @return Promise
 */
const save = (original, planUpdates) => (
    (dispatch, getState, {api}) => {
        let promise;

        if (original) {
            promise = Promise.resolve(original);
        } else if (isExistingItem(planUpdates)) {
            promise = dispatch(self.fetchById(planUpdates._id));
        } else {
            promise = Promise.resolve({});
        }

        return promise.then((originalPlan) => {
            // Clone the original because `save` will modify it
            const originalItem = cloneDeep(originalPlan);

            // remove all properties starting with _ or lock_,
            const updates: Partial<IPlanningItem> = pickBy(
                cloneDeep(planUpdates),
                (v, k) => ((k === TO_BE_CONFIRMED_FIELD || !k.startsWith('_')) && !k.startsWith('lock_'))
            );

            // remove nested original creator
            delete updates.original_creator;

            // remove revert_state
            delete updates.revert_state;

            if (updates.agendas) {
                updates.agendas = updates.agendas.map((agenda) => agenda._id || agenda);
            }

            const cleanedUpdates = planningUtils.modifyForServer(cloneDeep(updates), originalPlan);

            if (isExistingItem(originalPlan) || get(cleanedUpdates, 'coverages.length', 0) < 1) {
                return api('planning').save(originalItem, cleanedUpdates);
            }

            // If the new Planning item has coverages then we need to create
            // the planning first before saving the coverages
            // As assignments are created and require a Planning ID
            let modifiedUpdates = cloneDeep(cleanedUpdates);

            if (cleanedUpdates.pubstatus === POST_STATE.USABLE) {
                // We are create&posting from add-to-planning
                delete modifiedUpdates.pubstatus;
                delete modifiedUpdates.state;
            }

            const addToPlanning = {
                add_to_planning: selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING,
            };

            return api('planning').save(
                {},
                {...modifiedUpdates, coverages: []},
                addToPlanning,
            )
                .then((originalItem) => api('planning').save(originalItem, cleanedUpdates, addToPlanning))
                .catch((error) => Promise.reject(error));
        });
    }
);

const duplicate = (plan) => (
    (dispatch, getState, {api}) => (
        api('planning_duplicate', plan).save({})
            .then((newPlan) => {
                newPlan.type = 'planning';
                return Promise.resolve(newPlan);
            }, (error) => (
                Promise.reject(error)
            ))
    )
);

/**
 * Set a Planning item as Posted
 * @param {Object} original - Planning item
 * @param {Object} updates - Planning item
 */
const post = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.save('planning_post', {
            planning: original._id,
            etag: original._etag,
            pubstatus: get(updates, 'pubstatus', POST_STATE.USABLE),
        }).then(
            () => dispatch(self.fetchById(original._id, {force: true})),
            (error) => Promise.reject(error)
        )
    )
);

/**
 * Set a Planning item as not Posted
 * @param {Object} original - Planning item ID
 * @param {Object} updates - Planning item ID
 */
const unpost = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.save('planning_post', {
            planning: original._id,
            etag: original._etag,
            pubstatus: get(updates, 'pubstatus', POST_STATE.CANCELLED),
        }).then(
            () => dispatch(self.fetchById(original._id, {force: true})),
            (error) => Promise.reject(error)
        )
    )
);

/**
 * Action for updating the list of planning items in the redux store
 * Also loads all the associated contacts (if any)
 * @param  {array, object} plannings - An array of planning item objects
 */
const receivePlannings = (plannings): any => (
    (dispatch) => {
        dispatch(actions.contacts.fetchContactsFromPlanning(plannings));
        dispatch({
            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
            payload: plannings,
        });
    }
);

export const storeLastDayGroup = (group): any => (
    (dispatch) => {
        dispatch({
            type: PLANNING.ACTIONS.STORE_LAST_DAY_GROUP,
            payload: {group},
        });
    }
);

const fetchPlanningFiles = (planning) => (
    (dispatch, getState) => {
        if (!planningUtils.shouldFetchFilesForPlanning(planning)) {
            return Promise.resolve();
        }

        const filesToFetch = planningUtils.getPlanningFiles(planning);
        const filesInStore = selectors.general.files(getState());

        if (every(filesToFetch, (f) => f in filesInStore)) {
            return Promise.resolve();
        }

        return dispatch(getFiles(filesToFetch));
    }
);

const getFiles = (files) => (
    (dispatch, getState, {api}) => (
        api('planning_files').query(
            {
                where: {$and: [{_id: {$in: files}}]},
            }
        )
            .then((data) => {
                if (get(data, '_items.length')) {
                    dispatch({
                        type: 'RECEIVE_FILES',
                        payload: get(data, '_items'),
                    });
                }
                return Promise.resolve();
            })
    )
);

const markPlanningCancelled = (plan, reason, coverageState, eventCancellation) => ({
    type: PLANNING.ACTIONS.MARK_PLANNING_CANCELLED,
    payload: {
        planning_item: plan,
        reason: reason,
        coverage_state: coverageState,
        event_cancellation: eventCancellation,
    },
});

const markCoverageCancelled = (plan, reason, coverageState, ids, etag) => ({
    type: PLANNING.ACTIONS.MARK_COVERAGE_CANCELLED,
    payload: {
        planning_item: plan,
        reason: reason,
        coverage_state: coverageState,
        ids: ids,
        etag: etag,
    },
});

const markPlanningPostponed = (plan, reason) => ({
    type: PLANNING.ACTIONS.MARK_PLANNING_POSTPONED,
    payload: {
        planning_item: plan,
        reason: reason,
    },
});

const uploadFiles = (planning) => (
    (dispatch, getState, {upload}) => {
        const clonedPlanning = cloneDeep(planning);

        // If no files, do nothing
        if (get(clonedPlanning, 'files.length', 0) === 0) {
            return Promise.resolve([]);
        }

        // Calculate the files to upload
        const filesToUpload = clonedPlanning.files.filter(
            (f) => isValidFileInput(f)
        );

        if (filesToUpload.length < 1) {
            return Promise.resolve([]);
        }

        return Promise.all(filesToUpload.map((file) => (
            uploadFileWithRetry(
                upload,
                '/planning_files/',
                file,
                {retries: 2},
            )
        )))
            .then((results) => {
                const files: Array<IFile> = results;

                if (get(files, 'length', 0) > 0) {
                    dispatch({
                        type: 'RECEIVE_FILES',
                        payload: files,
                    });
                }
                return Promise.resolve(files);
            }, (error) => Promise.reject(error));
    }
);

const removeFile = (file) => (
    (dispatch, getState, {api, notify}) => (
        api('planning_files').remove(file)
            .then(() => {
                dispatch({
                    type: 'REMOVE_FILE',
                    payload: file._id,
                });
            }, (err) => {
                notify.error(
                    getErrorMessage(err, gettext('Failed to remove the file from planning.'))
                );
                return Promise.reject(err);
            })
    )
);

// eslint-disable-next-line consistent-this
const self = {
    spike,
    unspike,
    query,
    fetch,
    receivePlannings,
    save,
    fetchById,
    fetchPlanningsEvents,
    loadPlanningById,
    loadPlanningByIds,
    fetchPlanningHistory,
    receivePlanningHistory,
    loadPlanningByEventId,
    post,
    unpost,
    refetch,
    duplicate,
    markPlanningCancelled,
    markCoverageCancelled,
    markPlanningPostponed,
    getPlanning,
    loadPlanningByRecurrenceId,
    cancel,
    cancelAllCoverage,
    fetchPlanningFiles,
    uploadFiles,
    removeFile,
    getFiles,
};

export default self;
