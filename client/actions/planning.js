import * as selectors from '../selectors'
import * as actions from '../actions'
import { pickBy, cloneDeep, isNil, has, get } from 'lodash'
import { fetchAgendas, addToCurrentAgenda, selectAgenda,
    fetchSelectedAgendaPlannings } from './agenda'
import { PRIVILEGES } from '../constants'
import { checkPermission } from './privileges'

/**
 * Action dispatcher to delete a planning item
 * @param {object} planning - The planning item to delete
 * @return arrow function
 */
const deletePlanning = (planning) => (
    (dispatch, getState, { api, notify }) => (
        api('planning').remove(planning)
        // close the editor if the removed planning was opened
        .then(() => {
            if (selectors.getCurrentPlanningId(getState()) === planning._id) {
                dispatch(closePlanningEditor())
            }
        })
        .then(() => notify.success('The planning has been deleted.'))
        // reloads agendas because they contains the list of the plannings to show and plannings
        .then(() => (dispatch(fetchAgendas())))
        .then(() => (dispatch({
            type: 'DELETE_PLANNING',
            payload: planning._id,
        })))
    )
)

/**
 * Saves the supplied planning item and reload the
 * list of Agendas and their associated planning items.
 * If the planning item does not have an ._id, then add it to the
 * currently selected Agenda
 * @param {function} dispatch - The redux store's dispatch function
 * @param {function} getState - The redux store's getState function
 * @param {service} notify - The superdesk.core.notify angular service
 * @param {object} originalPlanning - The planning item to save
 * @return Promise
 */
const _savePlanningAndReloadCurrentAgenda = (
    dispatch,
    getState,
    { notify },
    { originalPlanning }) => (
    dispatch(savePlanning(originalPlanning))
    .then((planning) => (
        Promise.resolve((() => {
            // if event is new (there is no _id), adds to current agenda
            if (isNil(originalPlanning) || isNil(originalPlanning._id)) {
                return dispatch(addToCurrentAgenda(planning))
            }
        })())
        .then(() => (
            // update the planning list
            dispatch(fetchSelectedAgendaPlannings())
            .then(() => (planning))
        ))
    ))
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item istead
 * @param {function} dispatch - The redux store's dispatch function
 * @param {function} getState - The redux store's getState function
 * @param {service} api - The superdesk.core.api angular service
 * @param {service} notify - The superdesk.core.notify angular service
 * @param planning
 * @return Promise
 */
const _savePlanning = (dispatch, getState, { api, notify }, { planning }) => {
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

/**
 * Saves or deletes coverages through the API to
 * the given planning based on the original coverages
 * @param {function} dispatch - The redux store's dispatch function
 * @param {function} getState - The redux store's getState function
 * @param {service} api - The superdesk.core.api angular service
 * @param {array, object} coverages - An array of coverage objects
 * @param {object} planning - The associated planning item
 * @param {object} originalCoverages - The original version of the coverage list
 * @return Promise
 */
const _saveAndDeleteCoverages = (dispatch, getState, { api }, {
    coverages,
    planning,
    originalCoverages,
}) => {
    const promises = []
    // saves coverages
    if (coverages.length > 0) {
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
    if (originalCoverages.length > 0) {
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

/**
 * Action for updating the list of planning items in the redux store
 * @param  {array, object} plannings - An array of planning item objects
 * @return action object
 */
const receivePlannings = (plannings) => ({
    type: 'RECEIVE_PLANNINGS',
    payload: plannings,
})

/**
 * Action dispatcher to perform fetch the list of planning items from the server
 * @param {object} query - Query object used when requesting the planning items
 * @return thunk function
 */
const performFetchRequest = (query={}) => (
    (dispatch, getState, { api }) => (
        api('planning').query({
            source: query.source,
            where: query.where,
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
            return dispatch(actions.silentlyFetchEventsById(linkedEvents))
            .then(() => dispatch(receivePlannings(plannings)))
        })
    }
)

/**
 * Opens the Planning Editor
 * @param {function} dispatch - The redux store's dispatch function
 * @param {function} getState - The redux store's getState function
 * @param {object} services - Not used in this instance
 * @param {object} planning - The planning item to open
 * @return Promise
 */
const _openPlanningEditor = (dispatch, getState, services, { planning }) => (
    dispatch({
        type: 'OPEN_PLANNING_EDITOR',
        payload: planning,
    })
)

/**
 * Opens the Planning Editor
 * Also changes the currently selected agenda to the the agenda this planning
 * item is associated with
 * @param {function} dispatch - The redux store's dispatch function
 * @param {function} getState - The redux store's getState function
 * @param {object} services - Not used in this instance
 * @param planning
 * @return Promise
 */
const _openPlanningEditorAndAgenda = (dispatch, getState, services, { planning }) => {
    const agenda = selectors.getAgendas(getState()).find(
        (a) => (a.planning_items || []).indexOf(planning) > -1
    )
    if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
        dispatch(selectAgenda(agenda._id))
    }
    // open the planning details
    return dispatch(openPlanningEditor(planning))
}

/**
 * Action for closing the planning editor
 * @return object
 */
const closePlanningEditor = () => (
    { type: 'CLOSE_PLANNING_EDITOR' }
)

/**
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return arrow function
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: 'SET_ONLY_FUTURE',
            payload: !getState().planning.onlyFuture,
        })
        return Promise.resolve()
    }
)

// Action Privileges
/**
 * Action Dispatcher to save the supplied Planning Item and
 * reload the list of Agendas
 * Also checks the permission if the user can do so
 * @param originalPlanning
 * @return thunk function
 */
const savePlanningAndReloadCurrentAgenda = (originalPlanning) => (
    checkPermission(
        _savePlanningAndReloadCurrentAgenda,
        PRIVILEGES.PLANNING_MANAGEMENT,
        'Unauthorised to create a new planning item!',
        { originalPlanning }
    )
)

/**
 * Action Dispatcher to save the supplied Planning Item
 * Also checks the permission if the user can do so
 * @param planning
 * @return thunk function
 */
const savePlanning = (planning) => (
    checkPermission(
        _savePlanning,
        PRIVILEGES.PLANNING_MANAGEMENT,
        'Unauthorised to modify a planning item!',
        { planning }
    )
)

/**
 * Action Dispatcher to modify the coverages of a Planning Item
 * Also checks the permission if the user can do so
 * @param {array} coverages - The new list of coverage items
 * @param {object} planning - The Planning Item the coverages are associated with
 * @param {array} originalCoverages - The list of original coverage items
 * @return thunk function
 */
const saveAndDeleteCoverages = (coverages=[], planning, originalCoverages=[]) => (
    checkPermission(
        _saveAndDeleteCoverages,
        PRIVILEGES.PLANNING_MANAGEMENT,
        'Unauthorised to modify planning coverages',
        {
            coverages,
            planning,
            originalCoverages,
        }
    )
)

/**
 * Action Dispatcher to open the Planning Editor to edit a Planning Item
 * Also checks the permission if the user can do so
 * @param {object} planning - The Planning Item to edit
 * @return thunk function
 */
const openPlanningEditor = (planning) => (
    checkPermission(
        _openPlanningEditor,
        PRIVILEGES.PLANNING_MANAGEMENT,
        'Unauthorised to edit a planning item!',
        { planning }
    )
)

/**
 * Action Dispatcher to open the Planning Editor to edit a Planning Item
 * And change the currently selected Agenda to the one the planning item is
 * associated with
 * Also checks the permission if the user can do so
 * @param {object} planning - The planning Item to edit
 * @return thunk function
 */
const openPlanningEditorAndAgenda = (planning) => (
    checkPermission(
        _openPlanningEditorAndAgenda,
        PRIVILEGES.PLANNING_MANAGEMENT,
        'Unauthorised to edit a planning item!',
        { planning }
    )
)

export {
    deletePlanning,
    savePlanning,
    savePlanningAndReloadCurrentAgenda,
    fetchPlannings,
    openPlanningEditor,
    closePlanningEditor,
    openPlanningEditorAndAgenda,
    toggleOnlyFutureFilter,
}
