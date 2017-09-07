import planning from './index'
import { checkPermission, getErrorMessage, isItemLockedInThisSession } from '../../utils'
import * as selectors from '../../selectors'
import { PLANNING, PRIVILEGES, SPIKED_STATE } from '../../constants'
import * as actions from '../index'
import { get } from 'lodash'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const _spike = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.spike(item))
        .then(() => {
            notify.success('The Planning Item has been spiked.')
            if (selectors.getCurrentPlanningId(getState()) === item._id) {
                dispatch(self.closeEditor())
            }

            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not spiked!')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const _unspike = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unspike(item))
        .then(() => {
            notify.success('The Planning Item has been unspiked.')
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not unspiked!')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param {object} item - The Planning item to save
 * @return Promise
 */
const _save = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.save(item))
        .then((item) => {
            notify.success('The planning item has been saved.')
            return dispatch(self.refetch())
            .then(() => Promise.resolve(item))
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to save the Planning item!')
            )
            return Promise.reject(error)
        })
    )
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
const _saveAndReloadCurrentAgenda = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndReloadCurrentAgenda(item))
        .then((item) => {
            notify.success('The Planning item has been saved.')
            return dispatch(self.refetch())
            .then(() => (dispatch(planning.api.fetchPlanningById(item._id, true))))
            .then((item) => (Promise.resolve(item)))
        }, (error) => {
            notify.error(getErrorMessage(error, 'Failed to save the Planning item!'))
            return Promise.reject(error)
        })
    )
)

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
        })
        return Promise.resolve(item)
    }
)

/**
 * Unlock a Planning item and open it for editing
 * @param {object} item - The Planning item to unlock and edit
 * @return Promise
 */
const _unlockAndOpenEditor = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unlock(item))
        .then(() => {
            dispatch(self.openEditor(item._id))
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not unlock the planning item.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Unlock a Planning item and close editor if opened - used when item closed from workqueue
 * @param {object} item - The Planning item to unlock
 * @return Promise
 */
const unlockAndCloseEditor = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unlock(item))
        .then(() => {
            if (selectors.getCurrentPlanningId(getState()) === item._id) {
                dispatch({ type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR })
            }

            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not unlock the planning item.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Lock and open a Planning item for editing
 * @param {object} item - The Planning item to lock and edit
 * @return Promise
 */
const _lockAndOpenEditor = (item) => (
    (dispatch, getState, { notify }) => {
        // If the user already has a lock, don't obtain a new lock, open it directly
        const planningInState = selectors.getStoredPlannings(getState())[item]
        if (planningInState && isItemLockedInThisSession(planningInState,
                selectors.getSessionDetails(getState()))) {
            dispatch(self._openEditor(planningInState))
            return Promise.resolve(planningInState)
        }

        return dispatch(planning.api.lock(item))
        .then((lockedItem) => {
            dispatch(self._openEditor(lockedItem))
            return Promise.resolve(lockedItem)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not obtain lock on the planning item.')
            )
            dispatch(self._openEditor(item))
            return Promise.reject(error)
        })
    }
)

/**
 * Action for closing the planning editor
 * @return Promise
 */
const closeEditor = (item) => (
    (dispatch, getState, { notify }) => {
        dispatch({ type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR })

        if (!item) return Promise.resolve()

        if (isItemLockedInThisSession(item, selectors.getSessionDetails(getState()))) {
            return dispatch(planning.api.unlock(item))
            .then(() => Promise.resolve(item))
            .catch(() => {
                notify.error('Could not unlock the planning item.')
                return Promise.resolve(item)
            })
        } else {
            return Promise.resolve(item)
        }
    }
)

/**
 * Action for opening the planning editor
 *
 */
const _openEditor = (item) => ({
    type: PLANNING.ACTIONS.OPEN_PLANNING_EDITOR,
    payload: item,
})

/**
 * Previews the Planning Editor
 * Also selects the associated agenda of this planning item
 * @param {string} pid - The Planning item id to preview
 * @return Promise
 */
const previewPlanningAndOpenAgenda = (pid, agenda) => (
    (dispatch, getState) => {

        if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
            dispatch(actions.selectAgenda(agenda._id))
        }

        // open the planning details
        return dispatch(self.preview(pid))
    }
)

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
            dispatch(actions.selectAgenda(agendaId))
        }

        // open the planning details
        return dispatch(self._openEditor(planning))
    }
)

/**
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return Promise
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: PLANNING.ACTIONS.SET_ONLY_FUTURE,
            payload: !getState().planning.onlyFuture,
        })

        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

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
        })
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

/**
 * Clears the Planning List
 */
const clearList = () => ({ type: PLANNING.ACTIONS.CLEAR_LIST })

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
 * Queries the API and sets the Planning List to the items received
 * @param {object} params - Parameters used when querying for planning items
 */
const fetchToList = (params) => (
    (dispatch) => {
        dispatch(self.requestPlannings(params))
        return dispatch(planning.api.fetch(params))
        .then((items) => (dispatch(self.setInList(
            items.map((p) => p._id)
        ))))
    }
)

/**
 * Fetch more planning items and add them to the list
 * Uses planning.lastRequestParams from the redux store for the api query,
 * then adds the received Planning items to the Planning List
 */
const fetchMoreToList = () => (
    (dispatch, getState) => {
        const previousParams = selectors.getPreviousPlanningRequestParams(getState())
        const params = {
            ...previousParams,
            page: get(previousParams, 'page', 0) + 1,
        }
        dispatch(self.requestPlannings(params))
        return dispatch(planning.api.fetch(params))
        .then((items) => (dispatch(self.addToList(
            items.map((p) => p._id)
        ))))
    }
)

/**
 * Refetch planning items based on the current search
 */
const refetch = () => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.refetch())
        .then(
            (items) => {
                dispatch(planning.ui.setInList(items.map((p) => p._id)))
                return Promise.resolve(items)
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to update the planning list!')
                )
                return Promise.reject(error)
            }
        )
    )
)

const duplicate = (plan) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.duplicate(plan))
        .then((newPlan) => {
            dispatch(self.refetch())
            .then(() => {
                dispatch(self.closeEditor(plan))
                notify.success('Planning duplicated')
                return dispatch(self.openEditor(newPlan._id))
            }, (error) => (
                notify.error(
                    getErrorMessage(error, 'Failed to fetch Planning items')
                )
            ))
        }, (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to duplicate the Planning')
            )
        ))
    )
)

/**
 * Publish an item and notify user of success or failure
 * @param {object} item - The planning item
 */
const _publish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.publish(item))
        .then(() => (
            notify.success('Planning item published!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to publish Planning item!')
            )
        ))
    )
)

/**
 * Unpublish an item and notify user of success or failure
 * @param {object} item - The planning item
 */
const _unpublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unpublish(item))
        .then(() => (
            notify.success('Planning item unpublished!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to unpublish Planning item!')
            )
        ))
    )
)

/**
 * Save Planning item then Publish it
 * @param {object} item - Planning item
 */
const _saveAndPublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndPublish(item))
        .then(() => (
            notify.success('Planning item published!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to save Planning item!')
            )
        ))
    )
)

/**
 * Save Planning item then Unpublish it
 * @param item
 * @private
 */
const _saveAndUnpublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndUnpublish(item))
        .then(() => (
            notify.success('Planning item unpublished!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to save Planning item!')
            )
        ))
    )
)

/**
 * Close advanced search panel
 */
const closeAdvancedSearch = () => ({ type: PLANNING.ACTIONS.CLOSE_ADVANCED_SEARCH })

/**
 * Open advanced search panel
 */
const openAdvancedSearch = () => ({ type: PLANNING.ACTIONS.OPEN_ADVANCED_SEARCH })

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const search = (params={ spikeState: SPIKED_STATE.NOT_SPIKED }) => (
    (dispatch) => {
        dispatch(self._setAdvancedSearch(params))
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const resetSearch = () => (
    (dispatch) => {
        dispatch(self._resetAdvancedSearch())
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

const _setAdvancedSearch = (params={}) => ({
    type: PLANNING.ACTIONS.SET_ADVANCED_SEARCH,
    payload: params,
})

const _resetAdvancedSearch = () => ({ type: PLANNING.ACTIONS.CLEAR_ADVANCED_SEARCH })

/**
 * Action that states that there are Planning items currently loading
 * @param {object} params - Parameters used when querying for planning items
 */
const requestPlannings = (params={}) => ({
    type: PLANNING.ACTIONS.REQUEST_PLANNINGS,
    payload: params,
})

const spike = checkPermission(
    _spike,
    PRIVILEGES.SPIKE_PLANNING,
    'Unauthorised to spike a planning item!'
)

const unspike = checkPermission(
    _unspike,
    PRIVILEGES.UNSPIKE_PLANNING,
    'Unauthorised to unspike a planning item!'
)

const save = checkPermission(
    _save,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to create or modify a planning item!'
)

const saveAndReloadCurrentAgenda = checkPermission(
    _saveAndReloadCurrentAgenda,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to create or modify a planning item!'
)

const openEditor = checkPermission(
    _lockAndOpenEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a planning item!',
    preview
)

const unlockAndOpenEditor = checkPermission(
    _unlockAndOpenEditor,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to ed a planning item!'
)

const publish = checkPermission(
    _publish,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to publish a planning item!'
)

const unpublish = checkPermission(
    _unpublish,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to unpublish a planning item!'
)

const saveAndPublish = checkPermission(
    _saveAndPublish,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to publish a planning item!'
)

const saveAndUnpublish = checkPermission(
    _saveAndUnpublish,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to unpublish a planning item!'
)

/**
 * Toggle selected status for given item id
 *
 * @param {String} itemId
 */
function toggleItemSelected(itemId) {
    return {
        type: PLANNING.ACTIONS.TOGGLE_SELECTED,
        payload: itemId,
    }
}

/**
 * Select all visible items
 */
function selectAll() {
    return { type: PLANNING.ACTIONS.SELECT_ALL }
}

/** * Deselect all selected items
 */
function deselectAll() {
    return { type: PLANNING.ACTIONS.DESELECT_ALL }
}

const self = {
    spike,
    unspike,
    save,
    saveAndReloadCurrentAgenda,
    preview,
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
    fetchMoreToList,
    publish,
    unpublish,
    saveAndPublish,
    saveAndUnpublish,
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
}

export default self
