import {superdeskApi} from '../superdeskApi';

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
        SELECT_FILTER: 'SELECT_EVENT_FILTER',
        RECEIVE_CALENDARS: 'RECEIVE_CALENDARS',
        RECEIVE_EVENT_TEMPLATES: 'RECEIVE_EVENT_TEMPLATES',
        EXPIRE_EVENTS: 'EXPIRE_EVENTS',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    ITEM_ACTIONS: {
        SPIKE: {
            label: 'Spike',
            icon: 'icon-trash',
            actionName: 'onSpikeEvent',
        },
        UNSPIKE: {
            label: 'Unspike',
            icon: 'icon-unspike',
            actionName: 'onUnspikeEvent',
        },
        DUPLICATE: {
            label: 'Duplicate',
            icon: 'icon-copy',
            actionName: 'onDuplicateEvent',
        },
        CREATE_PLANNING: {
            label: 'Create Planning Item',
            icon: 'icon-new-doc',
            actionName: 'onCreatePlanning',
        },
        CREATE_AND_OPEN_PLANNING: {
            label: 'Create and Open Planning Item',
            icon: 'icon-new-doc',
            actionName: 'onCreateAndOpenPlanning',
        },
        CANCEL_EVENT: {
            label: 'Cancel',
            icon: 'icon-close-small',
            actionName: 'onCancelEvent',
            lock_action: 'cancel',
        },
        UPDATE_TIME: {
            label: 'Update time',
            icon: 'icon-time',
            actionName: 'onEventUpdateTime',
            lock_action: 'update_time',
        },
        RESCHEDULE_EVENT: {
            label: 'Reschedule',
            icon: 'icon-calendar',
            actionName: 'onRescheduleEvent',
            lock_action: 'reschedule',
        },
        POSTPONE_EVENT: {
            label: 'Mark as Postponed',
            icon: 'icon-calendar-list',
            actionName: 'onPostponeEvent',
            lock_action: 'postpone',
        },
        CONVERT_TO_RECURRING: {
            label: 'Convert to Recurring Event',
            icon: 'icon-repeat',
            actionName: 'onConvertToRecurringEvent',
            lock_action: 'convert_recurring',
        },
        UPDATE_REPETITIONS: {
            label: 'Update Repetitions',
            icon: 'icon-repeat',
            actionName: 'onUpdateEventRepetitions',
            lock_action: 'update_repetitions',
        },
        POST_EVENT: {
            label: 'Post',
            actionName: 'onPostEvent',
        },
        EDIT_EVENT: {
            label: 'Edit',
            icon: 'icon-pencil',
            actionName: 'onEditEvent',
            lock_action: 'edit',
        },
        EDIT_EVENT_MODAL: {
            label: 'Edit in popup',
            icon: 'icon-external',
            actionName: 'onEditEventModal',
            lock_action: 'edit',
        },
        ASSIGN_TO_CALENDAR: {
            label: 'Assign to calendar',
            icon: 'icon-list-plus',
            actionName: 'onEventAssignCalendar',
            lock_action: 'assign_calendar',
        },
        SAVE_AS_TEMPLATE: {
            label: 'Save event as a template',
            icon: 'icon-new-doc',
            actionName: 'onCreateEventTemplate',
        },
        MARK_AS_COMPLETED: {
            label: 'Mark as completed',
            icon: 'icon-ok',
            actionName: 'onMarkEventCompleted',
            lock_action: 'mark_completed',
        },
        PREVIEW: {
            label: 'Preview',
            icon: 'icon-preview-mode',
            actionName: 'onEventPreview',
        },
    },
    FILTER: {
        NO_CALENDAR_ASSIGNED: 'NO_CALENDAR_ASSIGNED',
        ALL_CALENDARS: 'ALL_CALENDARS',
        DEFAULT: 'ALL_CALENDARS',
    },
    LIST: {
        PRIMARY_FIELDS: ['slugline', 'internalnote', 'name'],
        SECONDARY_FIELDS: ['state', 'actionedState', 'calendars', 'location'],
    },
    EXPORT_LIST: {
        PRIMARY_FIELDS: ['slugline', 'name'],
        SECONDARY_FIELDS: ['location'],
    },
    UPDATE_METHODS: [{
        name: 'This event only',
        value: 'single',
    }, {
        name: 'This and all future events',
        value: 'future',
    }, {
        name: 'All Events',
        value: 'all',
    }],
};

export function assignEventConstantTranslations() {
    const {gettext} = superdeskApi.localization;

    EVENTS.ITEM_ACTIONS.SPIKE.label = gettext('Spike');
    EVENTS.ITEM_ACTIONS.UNSPIKE.label = gettext('Unspike');
    EVENTS.ITEM_ACTIONS.DUPLICATE.label = gettext('Duplicate');
    EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label = gettext('Create Planning Item');
    EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.label = gettext('Create and Open Planning Item');
    EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label = gettext('Cancel');
    EVENTS.ITEM_ACTIONS.UPDATE_TIME.label = gettext('Update time');
    EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label = gettext('Reschedule');
    EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label = gettext('Mark as Postponed');
    EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label = gettext('Convert to Recurring Event');
    EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label = gettext('Update Repetitions');
    EVENTS.ITEM_ACTIONS.POST_EVENT.label = gettext('Post');
    EVENTS.ITEM_ACTIONS.EDIT_EVENT.label = gettext('Edit');
    EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.label = gettext('Edit in popup');
    EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.label = gettext('Assign to calendar');
    EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.label = gettext('Save event as a template');
    EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.label = gettext('Mark as completed');
    EVENTS.ITEM_ACTIONS.PREVIEW.label = gettext('Preview');

    EVENTS.UPDATE_METHODS[0].name = gettext('This event only');
    EVENTS.UPDATE_METHODS[1].name = gettext('This and all future events');
    EVENTS.UPDATE_METHODS[2].name = gettext('All Events');
}
