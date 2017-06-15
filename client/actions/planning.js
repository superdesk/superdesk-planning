import * as selectors from '../selectors'
import * as actions from '../actions'
import { pickBy, cloneDeep, isNil, has, get, isEqual } from 'lodash'
import { addToCurrentAgenda, selectAgenda,
    fetchSelectedAgendaPlannings } from './agenda'
import { PRIVILEGES, PLANNING, ITEM_STATE } from '../constants'
import { checkPermission, getErrorMessage } from '../utils'
import moment from 'moment'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} planning - The planning item to spike
 * @return Promise
 */
const _spikePlanning = (planning) => (
    (dispatch, getState, { api, notify }) => (
        api.update('planning_spike', planning, {})
        .then(() => {
            notify.success('The Planning Item has been spiked.')
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: planning,
            })
            if (selectors.getCurrentPlanningId(getState()) === planning._id) {
                dispatch(closePlanningEditor())
            }
        }, (error) => (
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not spiked!')
            )
        ))
        .then(() => (dispatch(fetchPlannings())))
    )
)

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} planning - The Planning item to unspike
 * @return Promise
 */
const _unspikePlanning = (planning) => (
    (dispatch, getState, { api, notify }) => (
        api.update('planning_unspike', planning, {})
        .then(() => {
            notify.success('The Planning Item has been unspiked.')
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: planning,
            })
        }, (error) => (
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not unspiked!')
            )
        ))
        .then(() => (dispatch(fetchPlannings())))
    )
)

/**
 * Saves the supplied planning item and reload the
 * list of Agendas and their associated planning items.
 * If the planning item does not have an ._id, then add it to the
 * currently selected Agenda
 * If no Agenda is selected, or the currently selected Agenda is spiked,
 * then notify the end user and reject this action
 * @param {object} originalPlanning - The planning item to save
 * @return Promise
 */
const _savePlanningAndReloadCurrentAgenda = (originalPlanning) => (
    (dispatch, getState, { notify }) => {
        // If we're creating a new Planning Item, then check if Agenda is
        // selected, and that the Agenda is not spiked,
        // otherwise notify the end user
        const currentAgenda = selectors.getCurrentAgenda(getState())
        const isNewAgenda = isNil(originalPlanning) || isNil(originalPlanning._id)
        if (isNewAgenda) {
            if (!currentAgenda) {
                notify.error('No Agenda is currently selected.')
                return Promise.reject()
            } else if (currentAgenda.state === ITEM_STATE.SPIKED) {
                notify.error('Cannot create a new planning item in a spiked Agenda.')
                return Promise.reject()
            }
        }

        return dispatch(savePlanning(originalPlanning))
        .then((planning) => (
            Promise.resolve((() => {
                if (isNewAgenda) {
                    return dispatch(addToCurrentAgenda(planning))
                }
            })())
            .then(() => (
                dispatch(fetchSelectedAgendaPlannings())
                .then(() => (planning))
            ))
        ))
    }
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param planning
 * @return Promise
 */
const _savePlanning = (planning) => (
    (dispatch, getState, { api, notify }) => {
        // find original
        let originalPlanning = {}
        if (planning._id) {
            const plannings = selectors.getStoredPlannings(getState())
            originalPlanning = cloneDeep(plannings[planning._id])
        }
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        planning = pickBy(planning, (v, k) => (!k.startsWith('_')))
        // clone and remove the nested coverages to save them later
        const coverages = cloneDeep(planning.coverages)
        delete planning.coverages
        // remove nested original creator
        delete planning.original_creator
        // save through the api
        return api('planning').save(cloneDeep(originalPlanning), planning)
        .then((planning) => (
            // save/delete coverages
            dispatch(saveAndDeleteCoverages(coverages, planning, originalPlanning.coverages))
            // returns the planning
            .then(() => (planning))
        ), (e) => {
            notify.error(
                `An error occured : ${JSON.stringify(get(e, 'data._issues', e.statusText))}`
            )
            throw e
        })
        // notify the user
        .then((planning) => {
            notify.success('The planning has been saved')
            return planning
        })
    }
)

/**
 * Saves or deletes coverages through the API to
 * the given planning based on the original coverages
 * @param {array, object} coverages - An array of coverage objects
 * @param {object} planning - The associated planning item
 * @param {object} originalCoverages - The original version of the coverage list
 * @return Promise
 */
const _saveAndDeleteCoverages = (coverages, planning, originalCoverages=[]) => (
    (dispatch, getState, { api }) => {
        const promises = []
        // saves coverages
        if (coverages && coverages.length > 0) {
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

                // Only update the coverage if it has changed
                if (!isEqual(coverage, originalCoverage)) {
                    coverage.planning_item = planning._id
                    promises.push(
                        api('coverage').save(cloneDeep(originalCoverage || {}), coverage)
                    )
                }
            })
        }
        // deletes coverages
        if (originalCoverages && originalCoverages.length > 0) {
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
 * Action dispatcher to perform fetch the list of planning items from the server
 * @param {object} query - Query object used when requesting the planning items
 * @return thunk function
 */
const performFetchRequest = ({ source, where }) => (
    (dispatch, getState, { api }) => (
        api('planning').query({
            source: source,
            where: where,
            embedded: { original_creator: 1 }, // nest creator to planning
            max_results: 10000,
            timestamp: new Date(),
        })
        .then((data) => data._items)
    )
)

/**
 * Action dispatcher for requesting a fetch of planning items
 * @param {object} params - Parameters used when fetching the planning items
 * @return thunk function
 */
const fetchPlannings = (params={}) => (
    (dispatch, getState) => {
        // announce that we are loading plannings
        dispatch({ type: PLANNING.ACTIONS.REQUEST_PLANNINGS })
        // fetch the plannings through the api
        let q = {}
        if (params.planningIds) {
            q = { query: { bool: {} } }
            q.query.bool.should = params.planningIds.map(
                (pid) => ({ term: { _id: pid } })
            )
        }
        // fetch the plannings
        return dispatch(performFetchRequest(q))
        // announce that we received the plannings
        .then((plannings) => {
            const linkedEvents = plannings
            .map((p) => p.event_item)
            .filter((eid) => (
                eid && !has(selectors.getEvents(getState()), eid)
            ))

            // load missing events, if there are any
            if (linkedEvents.length > 0) {
                return dispatch(actions.silentlyFetchEventsById(linkedEvents, ITEM_STATE.ALL))
                    .then(() => dispatch(receivePlannings(plannings)))
            }

            return dispatch(receivePlannings(plannings))
        })
    }
)

/**
 * Action Dispatcher that fetches a Planning Item by ID
 * and adds or updates it in the redux store
 * @param {string} id - The ID of the Planning item to fetch
 */
const fetchPlanningById = (id) => (
    (dispatch, getState, { api, notify }) => {
        dispatch({ type: PLANNING.ACTIONS.REQUEST_PLANNINGS })
        return api('planning').getById(id)
        .then((planning) => {
            dispatch(receivePlannings([planning]))
            if (get(planning, 'event_item', null) !== null) {
                return dispatch(
                    actions.silentlyFetchEventsById([planning.event_item], ITEM_STATE.ALL)
                )
                .then(() => planning)
            }

            return Promise.resolve(planning)
        }, (error) => {
            // Dispatch empty receivePlannings so store.planning.planningsAreLoading is set to false
            dispatch(receivePlannings([]))
            notify.error(getErrorMessage(error, 'Failed to get a new Planning Item!'))
        })
    }
)

/**
 * Action Dispatcher that fetches a Coverage by ID and adds or updates it
 * in the redux store for the associated Planning item
 * @param {string} id - The ID of the Coverage to fetch
 */
const fetchCoverageById = (id) => (
    (dispatch, getState, { api, notify }) => (
        api('coverage').getById(id)
        .then((coverage) => {
            dispatch(receiveCoverage(coverage))
            return Promise.resolve(coverage)
        }, (error) => {
            notify.error(getErrorMessage(error, 'Failed to fetch the Coverage!'))
        })
    )
)

/**
 * Opens the Planning in read-only mode
 * @param {object} planning - The planning item to open
 * @return Promise
 */
const previewPlanning = (planning) => (
    {
        type: PLANNING.ACTIONS.PREVIEW_PLANNING,
        payload: planning,
    }
)

/**
 * Opens the Planning Editor
 * @param {object} planning - The planning item to open
 * @return Promise
 */
const _openPlanningEditor = (planning) => (
    // Here, check locking and take appropriate action.
    {
        type: PLANNING.ACTIONS.OPEN_PLANNING_EDITOR,
        payload: planning,
    }
)

/**
 * Opens the Planning Editor
 * Also changes the currently selected agenda to the the agenda this planning
 * item is associated with
 * @param planning
 * @return Promise
 */
const previewPlanningAndOpenAgenda = (planning) => (
    (dispatch, getState) => {
        const agenda = selectors.getAgendas(getState()).find(
            (a) => (a.planning_items || []).indexOf(planning) > -1
        )
        if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
            dispatch(selectAgenda(agenda._id))
        }
        // open the planning details
        return dispatch(previewPlanning(planning))
    }
)

/**
 * Action for closing the planning editor
 * @return object
 */
const closePlanningEditor = () => (
    { type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR }
)

/**
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return arrow function
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: PLANNING.ACTIONS.SET_ONLY_FUTURE,
            payload: !getState().planning.onlyFuture,
        })
        return Promise.resolve()
    }
)

/**
 * Action dispatcher to set the planning item filter keyword
 * This is used by the PlanningPanelContainer through the selector
 * to filter the list of planning items to display
 * @param {string} value - The filter string used to filter planning items
 */
const planningFilterByKeyword = (value) => ({
    type: 'PLANNING_FILTER_BY_KEYWORD',
    payload: value && value.trim() || null,
})

/**
 * Action dispatcher to toggle the `Spiked` toggle of the planning list
 * @return arrow function
 */
const toggleOnlySpikedFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: PLANNING.ACTIONS.SET_ONLY_SPIKED,
            payload: !getState().planning.onlySpiked,
        })
        return Promise.resolve()
    }
)

// Action Privileges
const savePlanningAndReloadCurrentAgenda = checkPermission(
    _savePlanningAndReloadCurrentAgenda,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to create a new planning item!'
)
const savePlanning = checkPermission(
    _savePlanning,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to modify a planning item!'
)
const saveAndDeleteCoverages = checkPermission(
    _saveAndDeleteCoverages,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to modify planning coverages'
)
const openPlanningEditor = checkPermission(
    _openPlanningEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a planning item!'
)

const spikePlanning = checkPermission(
    _spikePlanning,
    PRIVILEGES.SPIKE_PLANNING,
    'Unauthorised to spike a planning item!'
)

const unspikePlanning = checkPermission(
    _unspikePlanning,
    PRIVILEGES.UNSPIKE_PLANNING,
    'Unauthorised to unspike a planning item!'
)

// WebSocket Notifications
/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningCreated = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(fetchPlanningById(data.item))
        }
    }
)

/**
 * WS Action when a Coverage gets created or updated
 * If the associated Planning item is not loaded,
 * silently discard this notification
 * @param {object} _e - Event object
 * @param {object} data - Coverage, Planning and User IDs
 */
const onCoverageCreatedOrUpdated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item && data.planning) {
            const storedPlans = selectors.getStoredPlannings(getState())
            const plan = get(storedPlans, data.planning, null)

            // If we haven't got this planning loaded,
            // no need to respond to this event
            if (plan === null) return Promise.resolve()

            // Otherwise send an Action to update the store
            return dispatch(fetchCoverageById(data.item))
        }
    }
)

/**
 * WS Action when a Coverage gets deleted
 * @param {object} _e - Event object
 * @param {object} data - Coverage, Planning and User IDs
 */
const onCoverageDeleted = (_e, data) => (
    (dispatch) => {
        if (data && data.item && data.planning) {
            return dispatch({
                type: PLANNING.ACTIONS.COVERAGE_DELETED,
                payload: {
                    _id: data.item,
                    planning_item: data.planning,
                },
            })
        }
    }
)

/**
 * WS Action when a Planning item gets updated, spiked or unspiked
 * If the Planning Item is not loaded, silently discard this notification
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningUpdated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const storedPlans = selectors.getStoredPlannings(getState())
            const plan = get(storedPlans, data.item, null)

            // If we haven't got this planning loaded,
            // no need to respond to this event
            if (plan === null) return Promise.resolve()

            // Otherwise send an Action to update the store
            return dispatch(fetchPlanningById(data.item))
        }
    }
)

// Map of notification name and Action Event to execute
const planningNotifications = {
    'planning:created': onPlanningCreated,
    'coverage:created': onCoverageCreatedOrUpdated,
    'coverage:updated': onCoverageCreatedOrUpdated,
    'coverage:deleted': onCoverageDeleted,
    'planning:updated': onPlanningUpdated,
    'planning:spiked': onPlanningUpdated,
    'planning:unspiked': onPlanningUpdated,
}

export {
    spikePlanning,
    unspikePlanning,
    savePlanning,
    savePlanningAndReloadCurrentAgenda,
    saveAndDeleteCoverages,
    fetchPlannings,
    fetchPlanningById,
    fetchCoverageById,
    openPlanningEditor,
    closePlanningEditor,
    previewPlanningAndOpenAgenda,
    toggleOnlyFutureFilter,
    planningFilterByKeyword,
    toggleOnlySpikedFilter,
    planningNotifications,
    previewPlanning,
}
