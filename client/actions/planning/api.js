import { PLANNING, ITEM_STATE } from '../../constants'
import { get, cloneDeep, pickBy, isEqual, has } from 'lodash'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import moment from 'moment'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const spike = (item) => (
    (dispatch, getState, { api }) => (
        api.update('planning_spike', item, {})
        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: item,
            })
            return dispatch(self.fetch())
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const unspike = (item) => (
    (dispatch, getState, { api }) => (
        api.update('planning_unspike', item, {})
        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: item,
            })
            return dispatch(self.fetch())
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher to perform fetch the list of planning items from the server
 * @param {Array} ids - An array of Planning item ids to fetch
 * @param {string} eventItem - An event ID to fetch Planning items for that event
 * @param {string} state - Planning item state
 * @return Promise
 */
const query = ({
    ids,
    eventItem,
    state=ITEM_STATE.ALL,
}) => (
    (dispatch, getState, { api }) => {
        let query = {}
        let mustNot = []
        let must = []

        if (ids) {
            const chunkSize = PLANNING.FETCH_IDS_CHUNK_SIZE
            if (ids.length <= chunkSize) {
                must.push({ terms: { _id: ids } })
            } else {
                // chunk the requests
                const requests = []
                for (let i = 0; i < Math.ceil(ids.length / chunkSize); i++) {
                    const args = {
                        ...arguments[0],
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    }
                    requests.push(dispatch(self.query(args)))
                }
                // flattern responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    Array.prototype.concat(...responses)
                ))
            }
        }

        if (eventItem) {
            must.push({ term: { event_item: eventItem } })
        }

        switch (state) {
            case ITEM_STATE.SPIKED:
                must.push({ term: { state: ITEM_STATE.SPIKED } })
                break
            case ITEM_STATE.ALL:
                break
            case ITEM_STATE.ACTIVE:
            default:
                mustNot.push({ term: { state: ITEM_STATE.SPIKED } })
        }

        query.bool = {
            must,
            must_not: mustNot,
        }

        // Query the API
        return api('planning').query({
            source: JSON.stringify({ query }),
            embedded: { original_creator: 1 }, // Nest creator to planning
            timestamp: new Date(),
        })
        .then((data) => {
            if (get(data, '_items')) {
                return Promise.resolve(data._items)
            } else {
                return Promise.reject('Failed to retrieve items')
            }
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action dispatcher for requesting a fetch of planning items
 * Then store them in the redux store. This also replaces the list of
 * visibile Planning items for the PlanningList component
 * @param {object} params - Parameters used when fetching the planning items
 * @return Promise
 */
const fetch = (params={}) => (
    (dispatch) => {
        // Announce that we are loading planning items
        dispatch(self.requestPlannings())

        // Fetch the Planning Items
        return dispatch(self.query(params))
        .then((items) => (
            dispatch(self.fetchPlanningsEvents(items))
            .then(() => {
                dispatch(self.receivePlannings(items))
                dispatch(self.setInList(items.map((p) => p._id)))
                return Promise.resolve(items)
            }, (error) => {
                dispatch(self.receivePlannings([]))
                return Promise.reject(error)
            })
            .catch((error) => {
                expect(error).toBe(null)
                expect(error.stack).toBe(null)
            })
        ), (error) => {
            dispatch(self.receivePlannings([]))
            return Promise.reject(error)
        })
    }
)

/**
 * Action dispatcher to fetch Events associated with Planning items
 * and place them in the local store.
 * @param {Array} plannings - An array of Planning items
 * @return Promise
 */
const fetchPlanningsEvents = (plannings) => (
    (dispatch, getState) => {
        const loadedEvents = selectors.getEvents(getState())
        const linkedEvents = plannings
        .map((p) => p.event_item)
        .filter((eid) => (
            eid && !has(loadedEvents, eid)
        ))

        // load missing events, if there are any
        if (get(linkedEvents, 'length', 0) > 0) {
            return dispatch(actions.silentlyFetchEventsById(linkedEvents, ITEM_STATE.ALL))
        }

        return Promise.resolve([])
    }
)

/**
 * Action Dispatcher that fetches a Planning Item by ID
 * and adds or updates it in the redux store.
 * If the Planning item already exists in the local store, then don't
 * fetch the Planning item from the API
 * @param {string} pid - The ID of the Planning item to fetch
 * @param {boolean} force - Force using the API instead of local store
 * @return Promise
 */
const fetchPlanningById = (pid, force=false) => (
    (dispatch, getState, { api }) => {
        // Test if the Planning item is already loaded into the store
        // If so, return that instance instead
        const storedPlannings = selectors.getStoredPlannings(getState())
        if (has(storedPlannings, pid) && !force) {
            return Promise.resolve(storedPlannings[pid])
        }

        dispatch(self.requestPlannings())
        return api('planning').getById(pid)
        .then((item) => (
            dispatch(self.fetchPlanningsEvents([item]))
            .then(() => {
                dispatch(self.receivePlannings([item]))
                dispatch(self.addToList([item._id]))
                return Promise.resolve(item)
            }, (error) => {
                dispatch(self.receivePlannings([]))
                return Promise.reject(error)
            })
        ), (error) => {
            dispatch(self.receivePlannings([]))
            return Promise.reject(error)
        })
    }
)

/**
 * Action Dispatcher that fetches a Coverage by ID and adds or updates it
 * in the redux store for the associated Planning item
 * @param {string} cid - The ID of the Coverage to fetch
 * @return Promise
 */
const fetchCoverageById = (cid) => (
    (dispatch, getState, { api }) => (
        api('coverage').getById(cid)
        .then((coverage) => {
            dispatch(self.receiveCoverage(coverage))
            return Promise.resolve(coverage)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action Dispatcher to fetch planning history from the server
 * This will add the history of action on that planning item in planning history list
 * @param {object} currentPlanningId - Query parameters to send to the server
 * @return arrow function
 */
const fetchPlanningHistory = (currentPlanningId) => (
    (dispatch, getState, { api }) => (
        // Query the API and sort by created
        api('planning_history').query({
            where: { planning_id: currentPlanningId },
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
        .then(data => {
            dispatch(self.receivePlanningHistory(data._items))
            return Promise.resolve(data)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action to receive the history of actions on planning item
 * @param {array} planningHistoryItems - An array of planning history items
 * @return object
 */
const receivePlanningHistory = (planningHistoryItems) => ({
    type: PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY,
    payload: planningHistoryItems,
})

/**
 * Action dispatcher to load a Planning item from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {object} query - The query used to query the Planning items
 * @return Promise
 */
const loadPlanning = (query) => (
    (dispatch) => (
        dispatch(self.query(query))
        .then((data) => {
            dispatch(self.receivePlannings(data))
            return Promise.resolve(data)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher to load Planning items by ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 * @param {string} state - The state of the Planning items
 * @return Promise
 */
const loadPlanningById = (ids=[], state = ITEM_STATE.ALL) => (
    (dispatch, getState, { api }) => {
        if (Array.isArray(ids)) {
            return dispatch(self.loadPlanning({
                ids,
                state,
            }))
        } else {
            return api('planning').getById(ids)
            .then((item) => {
                dispatch(self.receivePlannings([item]))
                return Promise.resolve([item])
            }, (error) => (Promise.reject(error)))
        }
    }
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param {object} item - The Planning item to save
 * @param {object} original - If supplied, will use this as the original Planning item
 * @return Promise
 */
const save = (item, original=undefined) => (
    (dispatch, getState, { api }) => (
        // Find the original (if it exists) either from the store or the API
        new Promise((resolve, reject) => {
            if (original !== undefined) {
                return resolve(original)
            } else if (get(item, '_id')) {
                return dispatch(self.fetchPlanningById(item._id))
                .then(
                    (item) => (resolve(item)),
                    (error) => (reject(error))
                )
            } else {
                return resolve({})
            }
        })
        .then((originalItem) => {
            // remove all properties starting with _,
            // otherwise it will fail for "unknown field" with `_type`
            item = pickBy(item, (v, k) => (!k.startsWith('_')))
            // clone and remove the nested coverages to save them later
            const coverages = cloneDeep(item.coverages)
            delete item.coverages
            // remove nested original creator
            delete item.original_creator

            // Save through the api
            return api('planning').save(cloneDeep(originalItem), item)
            .then((item) => (
                dispatch(self.saveAndDeleteCoverages(
                    coverages,
                    item,
                    get(originalItem, 'coverages', [])
                ))
                .then(
                    () => (Promise.resolve(item)),
                    (error) => (Promise.reject(error))
                )
            ), (error) => (Promise.reject(error)))
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Saves or deletes coverages through the API to
 * the given planning based on the original coverages
 * @param {array, object} coverages - An array of coverage objects
 * @param {object} item - The associated planning item
 * @param {object} originalCoverages - The original version of the coverage list
 * @return Promise
 */
const saveAndDeleteCoverages = (coverages, item, originalCoverages) => (
    (dispatch, getState, { api }) => {
        const promises = []

        // Saves coverages
        if (get(coverages, 'length', 0) > 0) {
            coverages.forEach((coverage) => {
                // patch or post ? look for an original coverage
                const originalCoverage = originalCoverages.find((c) => (
                    c._id === coverage._id
                ))

                // If the coverage is scheduled, convert it to a moment instance
                // so the lodash.isEqual function can compare it with the new coverage
                if (get(originalCoverage, 'planning.scheduled')) {
                    originalCoverage.planning.scheduled = moment(
                        originalCoverage.planning.scheduled
                    )
                }

                // Make sure that the updated coverage schedule is
                // a moment instance as well
                if (get(coverage, 'planning.scheduled')) {
                    coverage.planning.scheduled = moment(coverage.planning.scheduled)
                }

                // Only update the coverage if it has changed
                if (!isEqual(coverage, originalCoverage)) {
                    coverage.planning_item = item._id
                    promises.push(
                        api('coverage').save(cloneDeep(originalCoverage || {}), coverage)
                    )
                }
            })
        }

        // Deletes coverages
        if (get(originalCoverages, 'length', 0) > 0) {
            originalCoverages.forEach((originalCoverage) => {
                // if there is a coverage in the original planning that is not anymore
                // in the planning, we delete it
                if (coverages.findIndex((c) => (
                    c._id && c._id === originalCoverage._id
                )) === -1) {
                    promises.push(
                        api('coverage').remove(originalCoverage)
                    )
                }
            })
        }

        // returns the up to date planning when all is done
        return Promise.all(promises)
    }
)

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
    (dispatch, getState) => (
        new Promise((resolve, reject) => {
            if (get(item, '_id')) {
                return dispatch(self.fetchPlanningById(item._id))
                .then(
                    (item) => (resolve(item)),
                    (error) => (reject(error))
                )
            } else {
                return resolve({})
            }
        })
        .then((originalItem) => {
            if (isEqual(originalItem, {})) {
                const currentAgenda = selectors.getCurrentAgenda(getState())
                const errorMessage = { data: {} }
                if (!currentAgenda) {
                    errorMessage.data._message = 'No Agenda is currently selected.'
                    return Promise.reject(errorMessage)
                } else if (get(currentAgenda, 'state', ITEM_STATE.ACTIVE) === ITEM_STATE.SPIKED) {
                    errorMessage.data._message =
                        'Cannot create a new planning item in a spiked Agenda.'
                    return Promise.reject(errorMessage)
                }
            }

            return dispatch(self.save(item, originalItem))
            .then((item) => {
                // If this is a new planning item, then re-fetch the selected
                // agendas planning items
                if (isEqual(originalItem, {})) {
                    return dispatch(actions.addToCurrentAgenda(item))
                    .then(
                        () => (
                            dispatch(actions.fetchSelectedAgendaPlannings())
                            .then(
                                () => (Promise.resolve(item)),
                                (error) => (Promise.reject(error))
                            )
                        ),
                        (error) => (Promise.reject(error))
                    )
                }

                return Promise.resolve(item)
            }, (error) => (Promise.reject(error)))
        })
    )
)

/**
 * Action that sets the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const setInList = (ids) => ({
    type: PLANNING.ACTIONS.SET_LIST,
    payload: ids,
})

/**
 * Action that adds Planning items to the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const addToList = (ids) => ({
    type: PLANNING.ACTIONS.ADD_TO_LIST,
    payload: ids,
})

/**
 * Action for updating the list of planning items in the redux store
 * @param  {array, object} plannings - An array of planning item objects
 * @return action object
 */
const receivePlannings = (plannings) => ({
    type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
    payload: plannings,
})

/**
 * Action for updating Planning item's coverage in the redux store
 * @param {object} coverage - The Coverage to add to the store
 */
const receiveCoverage = (coverage) => ({
    type: PLANNING.ACTIONS.RECEIVE_COVERAGE,
    payload: coverage,
})

/**
 * Action that states that there are Planning items currently loading
 */
const requestPlannings = () => ({ type: PLANNING.ACTIONS.REQUEST_PLANNINGS })

/**
 * Action dispatcher that attempts to unlock a Planning item through the API
 * @param {object} item - The Planning item to unlock
 * @return Promise
 */
const unlock = (item) => (
    (dispatch, getState, { api }) => (
        api('planning_unlock', item).save({})
    )
)

/**
 * Action dispatcher that attempts to lock a Planning item through the API
 * @param {object} item - The Planning item to lock
 * @return Promise
 */
const lock = (item) => (
    (dispatch, getState, { api }) => (
        api.save(
            'planning_lock',
            {},
            { lock_action: 'edit' },
            { _id: item }
        )
    )
)

const self = {
    spike,
    unspike,
    query,
    fetch,
    receivePlannings,
    receiveCoverage,
    save,
    saveAndDeleteCoverages,
    saveAndReloadCurrentAgenda,
    fetchCoverageById,
    fetchPlanningById,
    fetchPlanningsEvents,
    requestPlannings,
    unlock,
    lock,
    setInList,
    addToList,
    loadPlanning,
    loadPlanningById,
    fetchPlanningHistory,
    receivePlanningHistory,
}

export default self
