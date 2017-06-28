import planning from './index'
import { checkPermission, getErrorMessage } from '../../utils'
import * as selectors from '../../selectors'
import { PLANNING, PRIVILEGES } from '../../constants'
import * as actions from '../index'

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
            return Promise.resolve(item)
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
            return Promise.resolve(item)
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
    (dispatch, getState) => {
        dispatch(self.closeEditor(selectors.getCurrentPlanning(getState())))
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
 * Lock and open a Planning item for editing
 * @param {object} item - The Planning item to lock and edit
 * @return Promise
 */
const _lockAndOpenEditor = (item) => (
    (dispatch, getState, { notify }) => {
        dispatch(self.closeEditor(selectors.getCurrentPlanning(getState())))
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
        if (selectors.isCurrentPlanningLockedInThisSession(getState())) {
            dispatch(planning.api.unlock(item))
            .catch(() => {
                notify.error('Could not unlock the planning item.')
            })
        }

        dispatch({ type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR })
        return Promise.resolve(item)
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
 * Opens the Planning Editor
 * Also changes the currently selected agenda to the the agenda this planning
 * item is associated with
 * @param {string} pid - The Planning item id to open
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
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return Promise
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => (
        Promise.resolve(
            dispatch({
                type: PLANNING.ACTIONS.SET_ONLY_FUTURE,
                payload: !getState().planning.onlyFuture,
            })
        )
    )
)

/**
 * Action dispatcher to set the planning item filter keyword
 * This is used by the PlanningPanelContainer through the selector
 * to filter the list of planning items to display
 * @param {string} value - The filter string used to filter planning items
 */
const filterByKeyword = (value) => ({
    type: PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD,
    payload: value && value.trim() || null,
})

/**
 * Action dispatcher to toggle the `Spiked` toggle of the planning list
 * @return arrow function
 */
const toggleOnlySpikedFilter = () => (
    (dispatch, getState) => (
        Promise.resolve(
            dispatch({
                type: PLANNING.ACTIONS.SET_ONLY_SPIKED,
                payload: !getState().planning.onlySpiked,
            })
        )
    )
)

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
    'Unauthorised to edit a planning item!'
)

const unlockAndOpenEditor = checkPermission(
    _unlockAndOpenEditor,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to ed a planning item!'
)

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
    toggleOnlyFutureFilter,
    filterByKeyword,
    toggleOnlySpikedFilter,
    unlockAndOpenEditor,
}

export default self
