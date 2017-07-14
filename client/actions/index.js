export * from './events'
export * from './locations'
export * from './modal'
export * from './vocabularies'
export * from './ingest_providers'
export * from './privileges'
export * from './agenda'
export * from './users'
export * from './desks'
export * from './subjects'
export * from './session'

import planning from './planning/index'
import events from './events/index'

import { agendaNotifications } from './agenda'
import { eventNotifications } from './events'

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
}
