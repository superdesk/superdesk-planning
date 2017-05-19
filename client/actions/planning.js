import * as selectors from '../selectors'
import * as actions from '../actions'
import { pickBy, cloneDeep, isNil, has, get } from 'lodash'
import { addToCurrentAgenda, selectAgenda,
    fetchSelectedAgendaPlannings } from './agenda'
import { PRIVILEGES, PLANNING, ITEM_STATE } from '../constants'
import { checkPermission, getErrorMessage } from '../utils'

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
const _saveAndDeleteCoverages = (coverages, planning, originalCoverages) => (
    (dispatch, getState, { api }) => {
        const promises = []
        // saves coverages
        if (coverages && coverages.length > 0) {
            coverages.forEach((coverage) => {
                coverage.planning_item = planning._id
                // patch or post ? look for an original coverage
                const originalCoverage = originalCoverages.find((c) => (
                    c._id === coverage._id
                ))
                promises.push(
                    api('coverage').save(cloneDeep(originalCoverage || {}), coverage)
                )
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
        dispatch({ type: 'REQUEST_PLANINGS' })
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
            // load missing events
            return dispatch(actions.silentlyFetchEventsById(linkedEvents, ITEM_STATE.ALL))
            .then(() => dispatch(receivePlannings(plannings)))
        })
    }
)

/**
 * Opens the Planning Editor
 * @param {object} planning - The planning item to open
 * @return Promise
 */
const _openPlanningEditor = (planning) => (
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
const _openPlanningEditorAndAgenda = (planning) => (
    (dispatch, getState) => {
        const agenda = selectors.getAgendas(getState()).find(
            (a) => (a.planning_items || []).indexOf(planning) > -1
        )
        if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
            dispatch(selectAgenda(agenda._id))
        }
        // open the planning details
        return dispatch(openPlanningEditor(planning))
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
const openPlanningEditorAndAgenda = checkPermission(
    _openPlanningEditorAndAgenda,
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

export {
    spikePlanning,
    unspikePlanning,
    savePlanning,
    savePlanningAndReloadCurrentAgenda,
    fetchPlannings,
    openPlanningEditor,
    closePlanningEditor,
    openPlanningEditorAndAgenda,
    toggleOnlyFutureFilter,
    planningFilterByKeyword,
    toggleOnlySpikedFilter,
}
