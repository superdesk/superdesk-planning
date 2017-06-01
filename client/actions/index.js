export * from './events'
export * from './locations'
export * from './modal'
export * from './planning'
export * from './vocabularies'
export * from './ingest_providers'
export * from './privileges'
export * from './agenda'
export * from './users'
export * from './desks'
export * from './subjects'

import { agendaNotifications } from './agenda'
import { planningNotifications } from './planning'
import { eventNotifications } from './events'

/**
 * Map WebSocket Notifications to Action Event
 * This is used by client.controller.PlanningController to listen for
 * the WebSocket Notifications from the server, and dispatch events
 **/

export const notifications = {
    ...agendaNotifications,
    ...planningNotifications,
    ...eventNotifications,
}
