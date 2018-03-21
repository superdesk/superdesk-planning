import {gettext} from '../utils/gettext';

export const EVENTS = {
    ACTIONS: {
        SPIKE_EVENT: 'SPIKE_EVENT',
        UNSPIKE_EVENT: 'UNSPIKE_EVENT',
        REQUEST_EVENTS: 'REQUEST_EVENTS',
        SET_EVENTS_LIST: 'SET_EVENTS_LIST',
        CLEAR_LIST: 'CLEAR_EVENTS_LIST',
        ADD_TO_EVENTS_LIST: 'ADD_TO_EVENTS_LIST',
        OPEN_ADVANCED_SEARCH: 'EVENT_OPEN_ADVANCED_SEARCH',
        CLOSE_ADVANCED_SEARCH: 'EVENT_CLOSE_ADVANCED_SEARCH',
        PREVIEW_EVENT: 'PREVIEW_EVENT',
        OPEN_EVENT_DETAILS: 'OPEN_EVENT_DETAILS',
        CLOSE_EVENT_DETAILS: 'CLOSE_EVENT_DETAILS',
        ADD_EVENTS: 'ADD_EVENTS',
        RECEIVE_EVENT_HISTORY: 'RECEIVE_EVENT_HISTORY',
        TOGGLE_EVENT_LIST: 'TOGGLE_EVENT_LIST',
        SELECT_EVENTS: 'SELECT_EVENTS',
        DESELECT_EVENT: 'DESELECT_EVENT',
        DESELECT_ALL_EVENT: 'DESELECT_ALL_EVENT',
        MARK_EVENT_CANCELLED: 'MARK_EVENT_CANCELLED',
        MARK_EVENT_POSTPONED: 'MARK_EVENT_POSTPONED',
        MARK_EVENT_HAS_PLANNINGS: 'MARK_EVENT_HAS_PLANNINGS',
        LOCK_EVENT: 'LOCK_EVENT',
        UNLOCK_EVENT: 'UNLOCK_EVENT',
        MARK_EVENT_PUBLISHED: 'MARK_EVENT_PUBLISHED',
        MARK_EVENT_UNPUBLISHED: 'MARK_EVENT_UNPUBLISHED',
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
            actionName: 'onUnspikeEvent'
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
            lock_action: 'update_repetitions'
        },
        PUBLISH_EVENT: {label: gettext('Publish')}
    },
    DEFAULT_VALUE: (occurStatuses) => ({
        type: 'event',
        occur_status: occurStatuses[5], // eocstat:eos5: Planned, occurs certainly
        dates: {}
    })
};
