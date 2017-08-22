export { PRIVILEGES } from './privileges'
export { PLANNING } from './planning'
export { AGENDA } from './agenda'
export { ASSIGNMENTS } from './assignments'

export const LIST_ITEM_1_LINE_HEIGHT = 38
export const LIST_ITEM_2_LINES_HEIGHT = 56
export const EVENT_LIST_DAY_HEADER_HEIGHT = 43
export const PLANNING_LIST_ITEM_MARGIN_HEIGHT = 20
export { EVENTS } from './events'

export const WS_NOTIFICATION = 'WS_NOTIFICATION'

export const DATE_FORMATS = {
    COMPARE_FORMAT: 'YYYY-M-D',
    DISPLAY_DATE_FORMAT: 'D. MMMM YYYY HH:mm',
    DISPLAY_CDATE_FORMAT: 'D. MMMM HH:mm',
    DISPLAY_DAY_FORMAT: 'dddd, ',
    DISPLAY_TODAY_FORMAT: '[Today], ',
}

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
    UNSPIKE: {
        label: 'Unspike',
        icon: 'icon-unspike',
    },
    DUPLICATE: {
        label: 'Duplicate',
        icon: 'icon-copy',
    },
    HISTORY: { label: 'View History' },
    DIVIDER: { label: 'Divider' },
    LABEL: { label: 'Label' },
}

export const SPIKED_STATE = {
    SPIKED: WORKFLOW_STATE.SPIKED,
    NOT_SPIKED: WORKFLOW_STATE.IN_PROGRESS,
    BOTH: 'both',
}

export const ADVANCED_SEARCH_CONTEXT = {
    EVENT: 'event',
    PLANNING: 'planning',
}
export const RESET_STORE = 'RESET_STORE'
export const INIT_STORE = 'INIT_STORE'
