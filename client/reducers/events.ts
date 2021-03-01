import {orderBy, cloneDeep, uniq, get} from 'lodash';
import moment from 'moment';

import {IEventState, LIST_VIEW_TYPE} from '../interfaces';

import {EVENTS, RESET_STORE, INIT_STORE, LOCKS, WORKFLOW_STATE} from '../constants';
import {createReducer} from './createReducer';

const initialState: IEventState = {
    events: {},
    eventsInList: [],
    readOnly: true,
    eventHistoryItems: [],
    calendars: [],
    currentCalendarId: undefined,
    currentFilterId: undefined,
    eventTemplates: [],
};

const modifyEventsBeingAdded = (state, payload) => {
    let _events = cloneDeep(state.events);

    payload.forEach((e) => {
        _events[e._id] = e;

        // Change dates to moment objects
        if (e.dates) {
            e.dates.start = moment(e.dates.start);
            e.dates.end = moment(e.dates.end);
            if (get(e, 'dates.recurring_rule.until')) {
                e.dates.recurring_rule.until = moment(e.dates.recurring_rule.until);
            }
            e._startTime = moment(e.dates.start);
            e._endTime = moment(e.dates.end);
        }

        if (e.location && Array.isArray(e.location)) {
            e.location = e.location[0];
        }
    });

    return _events;
};

const removeLock = (event, etag = null) => {
    delete event.lock_action;
    delete event.lock_user;
    delete event.lock_time;
    delete event.lock_session;

    if (etag !== null) {
        event._etag = etag;
    }
};

export const spikeEvent = (events, payload) => {
    const event = get(events, payload.id);

    if (!event) return;

    event.state = WORKFLOW_STATE.SPIKED;
    event.revert_state = payload.revert_state;
    event._etag = payload.etag;
};

export const unspikeEvent = (events, payload) => {
    const event = get(events, payload.id);

    if (!event) return;

    event.state = payload.state;
    delete event.revert_state;
    event._etag = payload.etag;
};

const eventsReducer = createReducer(initialState, {
    [RESET_STORE]: () => (initialState),

    [INIT_STORE]: () => (initialState),

    [EVENTS.ACTIONS.ADD_EVENTS]: (state, payload) => {
        const _events = modifyEventsBeingAdded(state, payload);

        return {
            ...state,
            events: _events,
        };
    },

    [EVENTS.ACTIONS.SET_EVENTS_LIST]: (state, payload) => (
        {
            ...state,
            eventsInList: payload.listViewType === LIST_VIEW_TYPE.LIST ?
                uniq([...payload.ids]) :
                orderBy(
                    uniq([...payload.ids]),
                    (e) => state.events[e].dates.start,
                    ['desc']
                ),
        }
    ),
    [EVENTS.ACTIONS.CLEAR_LIST]: (state) => (
        {
            ...state,
            eventsInList: [],
        }
    ),

    [EVENTS.ACTIONS.ADD_TO_EVENTS_LIST]: (state, payload) => (
        eventsReducer(state, {
            type: EVENTS.ACTIONS.SET_EVENTS_LIST,
            payload: {
                ids: [...state.eventsInList, ...payload.ids],
                listViewType: payload.listViewType,
            },
        })
    ),
    [EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY]: (state, payload) => (
        {
            ...state,
            eventHistoryItems: payload,
        }
    ),

    [EVENTS.ACTIONS.MARK_EVENT_CANCELLED]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event_id in state.events) && get(payload, 'cancelled_items.length', 0) < 1)
            return state;

        let events = cloneDeep(state.events);

        // First mark the original Event as cancelled
        markEventCancelled(
            events,
            payload.event_id,
            payload.etag,
            payload.reason,
            payload.occur_status,
            payload.actionedDate
        );

        // Now mark all associated Events that are also cancelled
        (get(payload, 'cancelled_items') || []).forEach(
            (event) => markEventCancelled(
                events,
                event._id,
                event._etag,
                payload.reason,
                payload.occur_status,
                payload.actionedDate
            )
        );

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.MARK_EVENT_HAS_PLANNINGS]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event_item in state.events)) return state;

        let events = cloneDeep(state.events);
        let event = events[payload.event_item];

        const planningIds = get(event, 'planning_ids', []);

        planningIds.push(payload.planning_item);
        event.planning_ids = planningIds;

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.LOCK_EVENT]: (state, payload) => {
        let events = cloneDeep(state.events);
        const newEvent = payload.event;
        let event = get(events, newEvent._id, payload.event);

        event.lock_action = newEvent.lock_action;
        event.lock_user = newEvent.lock_user;
        event.lock_time = newEvent.lock_time;
        event.lock_session = newEvent.lock_session;
        event._etag = newEvent._etag;

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state;

        let events = cloneDeep(state.events);
        const newEvent = payload.event;
        let event = events[newEvent._id];

        removeLock(event, newEvent._etag);

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.MARK_EVENT_POSTPONED]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state;

        let events = cloneDeep(state.events);
        let event = events[payload.event._id];

        if (get(payload, 'reason.length', 0) > 0) {
            event.state_reason = payload.reason;
        }

        if (get(payload, 'actionedDate')) {
            event.actioned_date = payload.actionedDate;
        }

        event.state = WORKFLOW_STATE.POSTPONED;

        return {
            ...state,
            events,
        };
    },

    [LOCKS.ACTIONS.RECEIVE]: (state, payload) => (
        get(payload, 'events.length', 0) <= 0 ?
            state :
            eventsReducer(state, {
                type: EVENTS.ACTIONS.ADD_EVENTS,
                payload: payload.events,
            })
    ),

    [EVENTS.ACTIONS.SPIKE_EVENT]: (state, payload) => {
        // If there is only 1 event and that event is not loaded
        // then disregard this action
        if (get(payload, 'items.length', 0) < 2 && !get(state.events, payload.item))
            return state;

        // Otherwise iterate over the items and mark them
        // with their new etag and spike state
        let events = cloneDeep(state.events);

        payload.items.forEach((event) => spikeEvent(events, event));

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.UNSPIKE_EVENT]: (state, payload) => {
        // If there is only 1 event and that event is not loaded
        // then disregard this action
        if (get(payload, 'items.length', 0) < 2 && !get(state.events, payload.item))
            return state;

        // Otherwise iterate over the items and mark them
        // with their new etag and spike state
        let events = cloneDeep(state.events);

        payload.items.forEach((event) => unspikeEvent(events, event));

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.MARK_EVENT_POSTED]: (state, payload) => (
        onEventPostChanged(state, payload)
    ),

    [EVENTS.ACTIONS.MARK_EVENT_UNPOSTED]: (state, payload) => (
        onEventPostChanged(state, payload)
    ),

    [EVENTS.ACTIONS.RECEIVE_CALENDARS]: (state, payload) => ({
        ...state,
        calendars: payload,
    }),

    [EVENTS.ACTIONS.SELECT_CALENDAR]: (state, payload) => ({
        ...state,
        currentCalendarId: payload,
        currentFilterId: null,
    }),
    [EVENTS.ACTIONS.SELECT_FILTER]: (state, payload) => ({
        ...state,
        currentCalendarId: null,
        currentFilterId: payload,
    }),

    [EVENTS.ACTIONS.EXPIRE_EVENTS]: (state, payload) => {
        let events = cloneDeep(state.events);

        payload.forEach((eventId) => {
            if (events[eventId])
                events[eventId].expired = true;
        });

        return {
            ...state,
            events,
        };
    },

    [EVENTS.ACTIONS.RECEIVE_EVENT_TEMPLATES]: (state, payload) => ({
        ...state,
        eventTemplates: payload,
    }),
});

const onEventPostChanged = (state, payload) => {
    // If there is only 1 event and that event is not loaded,
    // then disregard this action
    if (get(payload, 'items.length', 0) === 1 && !get(state.events, payload.item))
        return state;

    // Otherwise iterate over the items and mark them
    // with their new etag, state and pubstatus values
    let events = cloneDeep(state.events);

    payload.items.forEach((event) =>
        updateEventPubstatus(
            events,
            event.id,
            event.etag,
            payload.state,
            payload.pubstatus
        )
    );

    return {
        ...state,
        events,
    };
};

const updateEventPubstatus = (events, eventId, etag, state, pubstatus) => {
    // If the event is not loaded, disregard this action
    if (!(eventId in events)) return;

    const updatedEvent = events[eventId];

    updatedEvent.state = state;
    updatedEvent.pubstatus = pubstatus;
    updatedEvent._etag = etag;

    if (state === WORKFLOW_STATE.SCHEDULED || state === WORKFLOW_STATE.KILLED) {
        updatedEvent.state_reason = null;
    }
};

const markEventCancelled = (events, eventId, etag, reason, occurStatus, actionedDate) => {
    if (!(eventId in events)) return;

    let updatedEvent = events[eventId];

    if (get(reason, 'length', 0) > 0) {
        updatedEvent.state_reason = reason;
    }

    updatedEvent.state = WORKFLOW_STATE.CANCELLED;
    updatedEvent.occur_status = occurStatus;
    updatedEvent._etag = etag;

    if (actionedDate) {
        updatedEvent.actioned_date = actionedDate;
    }
};

export default eventsReducer;
