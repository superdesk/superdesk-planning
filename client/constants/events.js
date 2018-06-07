import {gettext} from '../utils/gettext';

export const EVENTS = {
    ACTIONS: {
        SPIKE_EVENT: 'SPIKE_EVENT',
        UNSPIKE_EVENT: 'UNSPIKE_EVENT',
        REQUEST_EVENTS: 'REQUEST_EVENTS',
        SET_EVENTS_LIST: 'SET_EVENTS_LIST',
        CLEAR_LIST: 'CLEAR_EVENTS_LIST',
        ADD_TO_EVENTS_LIST: 'ADD_TO_EVENTS_LIST',
        ADD_EVENTS: 'ADD_EVENTS',
        RECEIVE_EVENT_HISTORY: 'RECEIVE_EVENT_HISTORY',
        MARK_EVENT_CANCELLED: 'MARK_EVENT_CANCELLED',
        MARK_EVENT_POSTPONED: 'MARK_EVENT_POSTPONED',
        MARK_EVENT_HAS_PLANNINGS: 'MARK_EVENT_HAS_PLANNINGS',
        LOCK_EVENT: 'LOCK_EVENT',
        UNLOCK_EVENT: 'UNLOCK_EVENT',
        MARK_EVENT_POSTED: 'MARK_EVENT_POSTED',
        MARK_EVENT_UNPOSTED: 'MARK_EVENT_UNPOSTED',
        SELECT_CALENDAR: 'SELECT_EVENT_CALENDAR',
        RECEIVE_CALENDARS: 'RECEIVE_CALENDARS',
        EXPIRE_EVENTS: 'EXPIRE_EVENTS',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    ITEM_ACTIONS: {
        SPIKE: {
            label: gettext('Spike'),
            icon: 'icon-trash',
            actionName: 'onSpikeEvent',
        },
        UNSPIKE: {
            label: gettext('Unspike'),
            icon: 'icon-unspike',
            actionName: 'onUnspikeEvent',
        },
        DUPLICATE: {
            label: gettext('Duplicate'),
            icon: 'icon-copy',
            actionName: 'onDuplicateEvent',
        },
        CREATE_PLANNING: {
            label: gettext('Create Planning Item'),
            icon: 'icon-new-doc',
            actionName: 'onCreatePlanning',
        },
        CREATE_AND_OPEN_PLANNING: {
            label: gettext('Create and Open Planning Item'),
            icon: 'icon-new-doc',
            actionName: 'onCreateAndOpenPlanning',
        },
        CANCEL_EVENT: {
            label: gettext('Cancel'),
            icon: 'icon-close-small',
            actionName: 'onCancelEvent',
            lock_action: 'cancel',
        },
        UPDATE_TIME: {
            label: gettext('Update time'),
            icon: 'icon-time',
            actionName: 'onEventUpdateTime',
            lock_action: 'update_time',
        },
        RESCHEDULE_EVENT: {
            label: gettext('Reschedule'),
            icon: 'icon-calendar',
            actionName: 'onRescheduleEvent',
            lock_action: 'reschedule',
        },
        POSTPONE_EVENT: {
            label: gettext('Mark as Postponed'),
            icon: 'icon-calendar-list',
            actionName: 'onPostponeEvent',
            lock_action: 'postpone',
        },
        CONVERT_TO_RECURRING: {
            label: gettext('Convert to recurring event'),
            icon: 'icon-repeat',
            actionName: 'onConvertToRecurringEvent',
            lock_action: 'convert_recurring',
        },
        UPDATE_REPETITIONS: {
            label: gettext('Update Repetitions'),
            icon: 'icon-repeat',
            actionName: 'onUpdateEventRepetitions',
            lock_action: 'update_repetitions',
        },
        POST_EVENT: {label: gettext('Post')},
        EDIT_EVENT: {
            label: gettext('Edit'),
            icon: 'icon-pencil',
            actionName: 'onEditEvent',
            lock_action: 'edit',
        },
        EDIT_EVENT_MODAL: {
            label: gettext('Edit in popup'),
            icon: 'icon-external',
            actionName: 'onEditEventModal',
            lock_action: 'edit',
        },
    },
    FILTER: {
        NO_CALENDAR_ASSIGNED: 'NO_CALENDAR_ASSIGNED',
        ALL_CALENDARS: 'ALL_CALENDARS',
        DEFAULT: 'ALL_CALENDARS',
    },
};
