import * as selectors from '../selectors'
import { LOCKS } from '../constants'
import { planning, events } from './index'
import { getLock } from '../utils'

/**
 * Action Dispatcher to load all Event and Planning locks
 * Then send them to the lock reducer for processing and storage
 */
const loadAllLocks = () => (
    (dispatch) => (
        Promise.all([
            dispatch(events.api.queryLockedEvents()),
            dispatch(planning.api.queryLockedPlanning()),
        ])
        .then((data) => {
            const payload = {
                events: data[0],
                plans: data[1],
            }
            dispatch({
                type: LOCKS.ACTIONS.RECEIVE,
                payload,
            })
            return Promise.resolve(payload)
        }, (error) => Promise.reject(error))
    )
)

/**
 * Action Dispatcher to release the lock an a chain of Events and/or Planning items
 * It retrieves the lock from the Redux store for the item provided
 * and calls the appropriate unlock method on the item that is actually locked
 * @param {object} item - The Event or Planning item chain to unlock
 */
const unlock = (item) => (
    (dispatch, getState, { notify }) => {
        const locks = selectors.getLockedItems(getState())
        const currentLock = getLock(item, locks)

        if (currentLock === null) {
            notify.error('Failed to unlock the item. Lock not found!')
            return Promise.reject('Failed to unlock the item. Lock not found!')
        }

        switch (currentLock.item_type) {
            case 'planning':
                return dispatch(planning.api.unlock({ _id: currentLock.item_id }))
            case 'events':
                return dispatch(events.api.unlock({ _id: currentLock.item_id }))
        }
    }
)

const self = {
    unlock,
    loadAllLocks,
}

export default self
