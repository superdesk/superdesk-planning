export { PRIVILEGES } from './privileges'
export { PLANNING } from './planning'
export { AGENDA } from './agenda'

export const LIST_ITEM_1_LINE_HEIGHT = 38
export const LIST_ITEM_2_LINES_HEIGHT = 56
export const EVENT_LIST_DAY_HEADER_HEIGHT = 43
export const PLANNING_LIST_ITEM_MARGIN_HEIGHT = 20
export { EVENTS } from './events'

export const ITEM_STATE = {
    ACTIVE: 'active',
    SPIKED: 'spiked',
    ALL: 'all',
}

export const WS_NOTIFICATION = 'WS_NOTIFICATION'

export const DATE_FORMATS = {
    COMPARE_FORMAT: 'YYYY-M-D',
    DISPLAY_DATE_FORMAT: 'D. MMMM YYYY HH:mm',
    DISPLAY_CDATE_FORMAT: 'D. MMMM HH:mm',
    DISPLAY_DAY_FORMAT: 'dddd, ',
    DISPLAY_TODAY_FORMAT: '[Today], ',
}

/**
 * These next states are the new WORKFLOW and PUBLISHED states. Currently these are only
 * used for Planning items, but will later be used for Events as well, replacing the above
 * constant for ITEM_STATE along with events.PUB_STATUS and events.STATE
 */
export const WORKFLOW_STATE = {
    IN_PROGRESS: 'in_progress',
    INGESTED: 'ingested',
    PUBLISHED: 'published',
    KILLED: 'killed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
    POSTPONED: 'postponed',
    SPIKED: 'spiked',
}

export const PUBLISHED_STATE = {
    USABLE: 'usable',
    CANCELLED: 'cancelled',
}

export const GENERIC_ITEM_ACTIONS = {
    SPIKE: {
        label: 'Spike',
        icon: 'icon-trash',
    },
}
