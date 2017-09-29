export * from './events'
export * from './locations'
export * from './modal'
export * from './agenda'
export * from './assignment'

import planning from './planning/index'
import events from './events/index'
import locks from './locks'

import { agendaNotifications } from './agenda'
import { eventNotifications } from './events'

import { RESET_STORE, INIT_STORE } from '../constants'

const resetStore = () => ({ type: RESET_STORE })
const initStore = (workspace) => ({
    type: INIT_STORE,
    payload: workspace,
})

/**
 * Map WebSocket Notifications to Action Event
 * This is used by client.controller.PlanningController to listen for
 * the WebSocket Notifications from the server, and dispatch events
 **/

const notifications = {
    ...agendaNotifications,
    ...planning.notifications.events,
    ...eventNotifications,
    ...events.notifications.events,
}

export {
    planning,
    notifications,
    events,
    resetStore,
    initStore,
    locks,
}
