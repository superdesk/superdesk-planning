import { get, cloneDeep, pickBy, isEqual, has } from 'lodash'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { getTimeZoneOffset, sanitizeTextForQuery } from '../../utils'
import moment from 'moment'
import {
    PLANNING,
    PUBLISHED_STATE,
    SPIKED_STATE,
    WORKFLOW_STATE,
} from '../../constants'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const spike = (item) => (
    (dispatch, getState, { api }) => (
        api.update('planning_spike', { ...item }, {})
        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: item,
            })
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
        api.update('planning_unspike', { ...item }, {})

        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: item,
            })
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher to perform fetch the list of planning items from the server.
 * @param {string} eventIds - An event ID to fetch Planning items for that event
 * @param {string} spikeState - Planning item's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @param {agendas} list of agenda ids
 * @param {int} page - The page number to query for
 * @return Promise
 */
const query = ({
    eventIds,
    spikeState=SPIKED_STATE.BOTH,
    agendas,
    noAgendaAssigned=false,
    page=1,
    advancedSearch={},
    onlyFuture,
    fulltext,
}) => (
    (dispatch, getState, { api }) => {
        let query = {}
        let mustNot = []
        let must = []

        if (eventIds) {
            if (Array.isArray(eventIds)) {
                const chunkSize = PLANNING.FETCH_IDS_CHUNK_SIZE
                if (eventIds.length <= chunkSize) {
                    must.push({ terms: { event_item: eventIds } })
                } else {
                    const requests = []
                    for (let i = 0; i < Math.ceil(eventIds.length / chunkSize); i++) {
                        const args = {
                            ...arguments[0],
                            eventIds: eventIds.slice(i * chunkSize, (i + 1) * chunkSize),
                        }
                        requests.push(dispatch(self.query(args)))
                    }

                    // Flatten responses and return a response-like object
                    return Promise.all(requests).then((responses) => (
                        Array.prototype.concat(...responses)
                    ))
                }

            } else {
                must.push({ term: { event_item: eventIds } })
            }
        }

        [
            {
                condition: () => (true),
                do: () => {
                    if (agendas) {
                        must.push({ terms: { agendas: agendas } })
                    } else if (noAgendaAssigned) {
                        let field = { field: 'agendas' }
                        mustNot.push({ constant_score: { filter: { exists: field } } })
                    }
                },
            },
            {
                condition: () => (spikeState === SPIKED_STATE.SPIKED),
                do: () => {
                    must.push({ term: { state: WORKFLOW_STATE.SPIKED } })
                },
            },
            {
                condition: () => (spikeState === SPIKED_STATE.NOT_SPIKED || !spikeState),
                do: () => {
                    mustNot.push({ term: { state: WORKFLOW_STATE.SPIKED } })
                },
            },
            {
                condition: () => (fulltext),
                do: () => {
                    let query = { bool: { should: [] } }
                    let queryString = {
                        query_string: {
                            query: '(' + sanitizeTextForQuery(fulltext) + ')',
                            lenient: false,
                            default_operator: 'AND',
                        },
                    }
                    query.bool.should.push(queryString)
                    query.bool.should.push({
                        has_child: {
                            type: 'coverage',
                            query: { bool: { must: [queryString] } },
                        },
                    })
                    must.push(query)
                },
            },
            {
                condition: () => (!get(advancedSearch, 'dates') && onlyFuture),
                do: () => {
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: {
                                bool: {
                                    must: [
                                        {
                                            range: {
                                                '_coverages.scheduled': {
                                                    gte: 'now/d',
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    })
                },
            },
            {
                condition: () => (!get(advancedSearch, 'dates') && !onlyFuture),
                do: () => {
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: {
                                bool: {
                                    must: [
                                        {
                                            range: {
                                                '_coverages.scheduled': {
                                                    lt: 'now/d',
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    })
                },
            },
            {
                condition: () => (get(advancedSearch, 'dates')),
                do: () => {
                    let range = { '_coverages.scheduled': { time_zone: getTimeZoneOffset() } }
                    let rangeType = get(advancedSearch, 'dates.range', 'today')

                    if (rangeType === 'today') {
                        range['_coverages.scheduled'].gte = 'now/d'
                        range['_coverages.scheduled'].lt = 'now+24h/d'
                    } else if (rangeType === 'last24') {
                        range['_coverages.scheduled'].gte = 'now-24h'
                        range['_coverages.scheduled'].lt = 'now'
                    } else if (rangeType === 'week') {
                        range['_coverages.scheduled'].gte = 'now/w'
                        range['_coverages.scheduled'].lt = 'now+1w/w'
                    } else {
                        if (get(advancedSearch, 'dates.start')) {
                            range['_coverages.scheduled'].gte = get(advancedSearch, 'dates.start')
                        }

                        if (get(advancedSearch, 'dates.end')) {
                            range['_coverages.scheduled'].lte = get(advancedSearch, 'dates.end')
                        }
                    }

                    must.push({
                        nested: {
                            path: '_coverages',
                            query: { bool: { must: [{ range: range }] } },
                        },
                    })
                },
            },
            {
                condition: () => (advancedSearch.slugline),
                do: () => {
                    let query = { bool: { should: [] } }
                    let queryText = sanitizeTextForQuery(advancedSearch.slugline)
                    let queryString = {
                        query_string: {
                            query: 'slugline:(' + queryText + ')',
                            lenient: false,
                            default_operator: 'AND',
                        },
                    }
                    query.bool.should.push(queryString)
                    queryString = cloneDeep(queryString)
                    queryString.query_string.query = 'planning.slugline:(' + queryText + ')'
                    if (!advancedSearch.noCoverage) {
                        query.bool.should.push({
                            has_child: {
                                type: 'coverage',
                                query: { bool: { must: [queryString] } },
                            },
                        })
                    }

                    must.push(query)
                },
            },
            {
                condition: () => (advancedSearch.headline),
                do: () => {
                    let query = { bool: { should: [] } }
                    let queryText = sanitizeTextForQuery(advancedSearch.headline)
                    let queryString = {
                        query_string: {
                            query: 'headline:(' + queryText + ')',
                            lenient: false,
                            default_operator: 'AND',
                        },
                    }
                    query.bool.should.push(queryString)
                    queryString = cloneDeep(queryString)
                    queryString.query_string.query = 'planning.headline:(' + queryText + ')'
                    if (!advancedSearch.noCoverage) {
                        query.bool.should.push({
                            has_child: {
                                type: 'coverage',
                                query: { bool: { must: [queryString] } },
                            },
                        })
                    }

                    must.push(query)
                },
            },
            {
                condition: () => (Array.isArray(advancedSearch.anpa_category) &&
                advancedSearch.anpa_category.length > 0),
                do: () => {
                    const codes = advancedSearch.anpa_category.map((cat) => cat.qcode)
                    must.push({ terms: { 'anpa_category.qcode': codes } })
                },
            },
            {
                condition: () => (Array.isArray(advancedSearch.subject) &&
                advancedSearch.subject.length > 0),
                do: () => {
                    const codes = advancedSearch.subject.map((subject) => subject.qcode)
                    must.push({ terms: { 'subject.qcode': codes } })
                },
            },
            {
                condition: () => (advancedSearch.urgency),
                do: () => {
                    must.push({ term: { urgency: advancedSearch.urgency } })
                },
            },
            {
                condition: () => (advancedSearch.g2_content_type),
                do: () => {
                    let term = { '_coverages.g2_content_type': advancedSearch.g2_content_type }
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: { bool: { must: [{ term: term }] } },
                        },
                    })
                },
            },
            {
                condition: () => (advancedSearch.noCoverage),
                do: () => {
                    let noCoverageTerm = { term: { '_coverages.coverage_id': 'NO_COVERAGE' } }
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: { bool: { must: [noCoverageTerm] } },
                        },
                    })
                },
            },
        ].forEach((action) => {
            if (!eventIds && action.condition()) {
                action.do()
            }
        })

        query.bool = {
            must,
            must_not: mustNot,
        }

        let sort = [
            {
                '_coverages.scheduled': {
                    order: onlyFuture ? 'asc' : 'desc',
                    nested_path: '_coverages',
                    nested_filter: {
                        range: {
                            '_coverages.scheduled': onlyFuture ? {
                                gte: 'now/d',
                                time_zone: getTimeZoneOffset(),
                            } : {
                                lt: 'now/d',
                                time_zone: getTimeZoneOffset(),
                            },
                        },
                    },
                },
            },
        ]

        if (eventIds) {
            sort = [{ _planning_date: { order: 'asc' } }]
        }

        // Query the API
        return api('planning').query({
            page,
            source: JSON.stringify({
                query,
                sort,
            }),
            embedded: { original_creator: 1 }, // Nest creator to planning
            timestamp: new Date(),
        })
        .then((data) => {
            if (get(data, '_items')) {
                data._items.forEach(_convertCoveragesGenreToObject)
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
    (dispatch) => (
        dispatch(self.query(params))
        .then((items) => (
            dispatch(self.fetchPlanningsEvents(items))
            .then(() => {
                dispatch(self.receivePlannings(items))
                return Promise.resolve(items)
            }, (error) => (Promise.reject(error)))
        ), (error) => {
            dispatch(self.receivePlannings([]))
            return Promise.reject(error)
        })
    )
)

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page=1, plannings=[]) => (
    (dispatch, getState) => {
        const prevParams = selectors.getPreviousPlanningRequestParams(getState())
        let params = selectors.getPlanningFilterParams(getState())
        params.page = page

        return dispatch(self.query(params))
        .then((items) => {
            plannings = plannings.concat(items)
            page++
            if (get(prevParams, 'page', 1) >= page) {
                return dispatch(self.refetch(page, plannings))
            }

            dispatch(self.receivePlannings(plannings))
            return Promise.resolve(plannings)
        }, (error) => (Promise.reject(error)))
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
            return dispatch(actions.events.api.silentlyFetchEventsById(linkedEvents,
                SPIKED_STATE.BOTH))
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

        return api('planning').getById(pid)
        .then((item) => (
            dispatch(self.fetchPlanningsEvents([_convertCoveragesGenreToObject(item)]))
            .then(() => {
                dispatch(self.receivePlannings([item]))
                return Promise.resolve(item)
            }, (error) => (Promise.reject(error)))
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
            _convertCoverageGenreToObject(coverage)
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
 * @param {string} spikeState - Planning item's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @return Promise
 */
const loadPlanningById = (ids=[], spikeState = SPIKED_STATE.BOTH) => (
    (dispatch, getState, { api }) => {
        if (Array.isArray(ids)) {
            return dispatch(self.loadPlanning({
                ids,
                spikeState,
            }))
        } else {
            return api('planning').getById(ids)
            .then((item) => {
                _convertCoveragesGenreToObject(item)
                dispatch(self.receivePlannings([item]))
                return Promise.resolve([item])
            }, (error) => (Promise.reject(error)))
        }
    }
)

/**
 * Action dispatcher to load Planning items by Event ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {string} eventIds - The Event ID used to query the API
 * @param {string} spikeState - Planning item's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @return Promise
 */
const loadPlanningByEventId = (eventIds, spikeState = SPIKED_STATE.BOTH) => (
    (dispatch) => (
        dispatch(self.loadPlanning({
            eventIds,
            spikeState,
        }))
    )
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

            if (item.agendas) {
                item.agendas = item.agendas.map((agenda) => agenda._id || agenda)
            }

            if (!get(originalItem, '_id')) {
                return api('planning').save(cloneDeep(originalItem), item)
                .then(
                    (item) => (Promise.resolve(item)),
                    (error) => (Promise.reject(error))
                )
            }

            return dispatch(self.saveAndDeleteCoverages(
                    coverages,
                    originalItem,
                    get(originalItem, 'coverages', [])
            ))
            .then(() => (
                api('planning').save(cloneDeep(originalItem), item)
                .then(
                    (item) => (Promise.resolve(item)),
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

                    // Convert genre back to an Array
                    if (get(coverage, 'planning.genre')) {
                        coverage.planning.genre = [coverage.planning.genre]
                    }

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
                const currentAgendaId = selectors.getCurrentAgendaId(getState())
                const errorMessage = { data: {} }

                if (!currentAgendaId) {
                    errorMessage.data._message = 'No Agenda is currently selected.'
                    return Promise.reject(errorMessage)
                } else if (currentAgenda && !currentAgenda.is_enabled) {
                    errorMessage.data._message =
                        'Cannot create a new planning item in a disabled Agenda.'
                    return Promise.reject(errorMessage)
                }

                item.agendas = currentAgenda ? [currentAgenda] : []
            }

            return dispatch(self.save(item, originalItem))
            .then(
                (item) => (Promise.resolve(item)),
                (error) => (Promise.reject(error))
            )
        })
    )
)

const duplicate = (plan) => (
    (dispatch, getState, { api }) => (
        api('planning_duplicate', plan).save({})
        .then((items) => {
            if ('_items' in items) {
                return Promise.resolve(items._items[0])
            }

            return Promise.resolve(items)
        }, (error) => (
            Promise.reject(error)
        ))
    )
)

/**
 * Set a Planning item as Published
 * @param {string} plan - Planning item
 */
const publish = (plan) => (
    (dispatch, getState, { api }) => (
        api.save('planning_publish', {
            planning: plan._id,
            etag: plan._etag,
            pubstatus: PUBLISHED_STATE.USABLE,
        })
    )
)

/**
 * Save a Planning item, then Publish it
 * @param {object} plan - Planning item
 */
const saveAndPublish = (plan) => (
    (dispatch) => (
        dispatch(self.save(plan))
        .then(
            (newItem) => (
                dispatch(self.publish(newItem))
                .then(
                    () => (Promise.resolve(newItem)),
                    (error) => (Promise.reject(error))
                )
            ), (error) => (Promise.reject(error))
        )
    )
)

/**
 * Set a Planning item as not Published
 * @param {string} plan - Planning item ID
 */
const unpublish = (plan) => (
    (dispatch, getState, { api }) => (
        api.save('planning_publish', {
            planning: plan._id,
            etag: plan._etag,
            pubstatus: PUBLISHED_STATE.CANCELLED,
        })
    )
)

/**
 * Save a Planning item then Unpublish it
 * @param {object} plan - Planning item
 */
const saveAndUnpublish = (plan) => (
    (dispatch) => (
        dispatch(self.save(plan))
        .then(
            (newItem) => (
                dispatch(self.unpublish(newItem))
                .then(
                    () => Promise.resolve(newItem),
                    (error) => Promise.reject(error)
                )
            ), (error) => Promise.reject(error)
        )
    )
)

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

/**
 * Utility to convert a Planning item's coverage's genre from an Array to an Object
 * @param {object} plan - The planning item to modify it's coverages
 * @return {object} planning item provided
 */
const _convertCoveragesGenreToObject = (plan) => {
    get(plan, 'coverages', []).forEach(_convertCoverageGenreToObject)
    return plan
}

/**
 * Utility to convert coverage genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
const _convertCoverageGenreToObject = (coverage) => {
    // Make sure the coverage has a planning field
    if (!('planning' in coverage)) coverage.planning = {}

    // Convert genre from an Array to an Object
    coverage.planning.genre = get(coverage, 'planning.genre[0]')

    return coverage
}

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
    unlock,
    lock,
    loadPlanning,
    loadPlanningById,
    fetchPlanningHistory,
    receivePlanningHistory,
    loadPlanningByEventId,
    publish,
    unpublish,
    saveAndPublish,
    saveAndUnpublish,
    refetch,
    duplicate,
}

export default self
