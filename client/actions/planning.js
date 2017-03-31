import { hideModal } from './modal'
import * as selectors from '../selectors'
import * as actions from '../actions'
import { pickBy, cloneDeep, isNil, has } from 'lodash'

const createAgenda = ({ name }) => (
    (dispatch, getState, { api }) => {
        api('planning').save({}, {
            planning_type: 'agenda',
            name: name,
        })
        .then((agenda) => {
            dispatch(hideModal())
            dispatch(addOrReplaceAgenda(agenda))
            dispatch(selectAgenda(agenda._id))
        })
    }
)

const deletePlanning = (planning) => (
    (dispatch, getState, { api, notify }) => (
        api('planning').remove(planning)
        // close the editor if the removed planning was opened
        .then(() => {
            if (selectors.getCurrentPlanningId(getState()) === planning._id) {
                dispatch(closePlanningEditor())
            }
        })
        .then(() => notify.success('planning deleted'))
        // reloads agendas because they contains the list of the plannings to show and plannings
        .then(() => (dispatch(fetchAgendas())))
        .then(() => (dispatch({
            type: 'DELETE_PLANNING',
            payload: planning._id,
        })))
    )
)

const savePlanningAndReloadCurrentAgenda = (originalPlanning) => (
    (dispatch) => (
        dispatch(savePlanning(originalPlanning))
        .then((planning) => (
            Promise.resolve((() => {
                // if event is new (there is no _id), adds to current agenda
                if (isNil(originalPlanning) || isNil(originalPlanning._id)) {
                    return dispatch(addToCurrentAgenda(planning))
                }
            })()).then(() => (
                // update the planning list
                dispatch(fetchSelectedAgendaPlannings())
                .then(() => (planning))
            ))
        ))
    )
)

const addToCurrentAgenda = (planning) => (
    (dispatch, getState) => {
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) throw Error('unable to find the current agenda')
        // add the planning to the agenda
        return dispatch(addPlanningToAgenda({
            planning: planning,
            agenda: currentAgenda,
        }))
        // returns the planning to chain well with planning savings actions
        .then(() => (planning))

    }
)

const savePlanning = (planning) => (
    (dispatch, getState, { api }) => {
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
        // save/delete coverages
        .then((planning) => (
            dispatch(saveAndDeleteCoverages(coverages, planning, originalPlanning.coverages))
            // returns the planning
            .then(() => (planning))
        ))
    }
)

/**
*   This will save or delete coverages through the API to
*   the given planning based on the origial coverages
*/
const saveAndDeleteCoverages = (coverages=[], planning, originalCoverages=[]) => (
    (dispatch, getState, { api }) => {
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
)

const addOrReplaceAgenda = (agenda) => (
    {
        type: 'ADD_OR_REPLACE_AGENDA',
        payload: agenda,
    }
)

const addPlanningToAgenda = ({ planning, agenda }) => (
    (dispatch, getState, { api }) => {
        // clone agenda
        agenda = cloneDeep(agenda)
        // init planning_items array if does not exist yet
        let planningItems = agenda.planning_items || []
        // add planning to planning_items
        planningItems.push(planning._id)
        // update the agenda
        return api('planning').save(agenda, { planning_items: planningItems })
        .then((agenda) => {
            // replace the agenda in the store
            dispatch(addOrReplaceAgenda(agenda))
            return agenda
        })
    }
)

const addEventToCurrentAgenda = (event) => (
    (dispatch, getState) => {
        // check if there is a current agenda, throw an error if not
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) throw 'unable to find the current agenda'
        // planning inherits some fields from the given event
        return dispatch(savePlanning({
            event_item: event._id,
            slugline: event.name,
            headline: event.definition_short,
            subject: event.subject,
            anpa_category: event.anpa_category,
        }))
        .then((planning) => (
            dispatch(addToCurrentAgenda(planning))
        ))
        .then(() => (
            // reload the plannings of the current calendar
            dispatch(fetchSelectedAgendaPlannings())
        ))
    }
)

const receiveAgendas = (agendas) => (
    {
        type: 'RECEIVE_AGENDAS',
        payload: agendas,
    }
)

const receivePlannings = (plannings) => (
    {
        type: 'RECEIVE_PLANNINGS',
        payload: plannings,
    }
)

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

const fetchAgendas = () => (
    (dispatch) => {
        dispatch({ type: 'REQUEST_AGENDAS' })
        const q = { where: { planning_type: 'agenda' } }
        return dispatch(performFetchRequest(q))
        .then((agendas) => dispatch(receiveAgendas(agendas)))
    }
)

const fetchPlannings = (params={}) => (
    (dispatch, getState) => {
        // annonce that we are loading plannings
        dispatch({ type: 'REQUEST_PLANINGS' })
        // fetch the plannings through the api
        const q = { query: { bool: { must_not:  { term:  { planning_type: 'agenda' } } } } }
        if (params.planningIds) {
            q.query.bool.should = params.planningIds.map((pid) => ({ term: { _id: pid } }))
        }
        // fetch the plannings
        return dispatch(performFetchRequest(q))
        // annonce that we received the plannings
        .then((plannings) => {
            const linkedEvents = plannings
            .map((p) => p.event_item)
            .filter((eid) => (
                eid && has(selectors.getEvents(getState()), eid)
            ))
            // load missing events
            return dispatch(actions.silentlyFetchEventsById(linkedEvents))
            .then(() => dispatch(receivePlannings(plannings)))
        })
    }
)

const fetchSelectedAgendaPlannings = () => (
    (dispatch, getState) => {
        const agenda = selectors.getCurrentAgenda(getState())
        if (!agenda || !agenda.planning_items) return Promise.resolve()
        const planningIds = agenda.planning_items.map((pid) => (pid))
        return dispatch(fetchPlannings({ planningIds }))
    }
)

const selectAgenda = (agendaId) => (
    (dispatch, getState, { $timeout, $location }) => {
        // save in store selected agenda
        dispatch({
            type: 'SELECT_AGENDA',
            payload: agendaId,
        })
        // update the url (deep linking)
        $timeout(() => ($location.search('agenda', agendaId)))
        // reload the plannings list
        return dispatch(fetchSelectedAgendaPlannings())
    }
)

const openPlanningEditor = (planning) => (
    (dispatch) => (dispatch({
        type: 'OPEN_PLANNING_EDITOR',
        payload: planning,
    }))
)

const closePlanningEditor = () => (
    { type: 'CLOSE_PLANNING_EDITOR' }
)

export {
    createAgenda,
    deletePlanning,
    savePlanningAndReloadCurrentAgenda,
    addEventToCurrentAgenda,
    fetchPlannings,
    fetchAgendas,
    selectAgenda,
    openPlanningEditor,
    closePlanningEditor,
}
