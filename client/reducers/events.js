import {orderBy, cloneDeep, uniq, get} from 'lodash';
import moment from 'moment';
import {EVENTS, RESET_STORE, INIT_STORE, LOCKS} from '../constants';
import {createReducer} from '../utils';
import {WORKFLOW_STATE} from '../constants';

const initialState = {
    events: {},
    eventsInList: [],
    selectedEvents: [],
    readOnly: true,
    eventHistoryItems: [],
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
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [EVENTS.ACTIONS.SELECT_EVENTS]: (state, payload) => (
        {
            ...state,
            selectedEvents: uniq([...state.selectedEvents, ...payload]),
        }
    ),
    [EVENTS.ACTIONS.DESELECT_EVENT]: (state, payload) => (
        {
            ...state,
            selectedEvents: state.selectedEvents.filter((e) => e !== payload),
        }
    ),
    [EVENTS.ACTIONS.DESELECT_ALL_EVENT]: (state) => (
        {
            ...state,
            selectedEvents: [],
        }
    ),
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
            eventsInList: orderBy(
                uniq([...payload, ...state.selectedEvents]),
                (e) => state.events[e].dates.start,
                ['desc']
            ),
        }
    ),
    [EVENTS.ACTIONS.CLEAR_LIST]: (state) => (
        {
            ...state,
            eventsInList: []
        }
    ),

    [EVENTS.ACTIONS.ADD_TO_EVENTS_LIST]: (state, payload) => (
        eventsReducer(state, {
            type: EVENTS.ACTIONS.SET_EVENTS_LIST,
            payload: [...state.eventsInList, ...payload],
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
            payload.occur_status
        );

        // Now mark all associated Events that are also cancelled
        (get(payload, 'cancelled_items') || []).forEach(
            (event) => markEventCancelled(
                events,
                event._id,
                event._etag,
                payload.reason,
                payload.occur_status
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

        let ednote = `------------------------------------------------------------
Event Postponed
`;

        if (get(payload, 'reason', null) !== null) {
            ednote += `Reason: ${payload.reason}\n`;
        }

        if (get(event, 'ednote', null) !== null) {
            ednote = `${event.ednote}\n\n${ednote}`;
        }

        event.ednote = ednote;
        event.state = WORKFLOW_STATE.POSTPONED;

        removeLock(event);

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

    [EVENTS.ACTIONS.MARK_EVENT_PUBLISHED]: (state, payload) => (
        onEventPublishChanged(state, payload)
    ),

    [EVENTS.ACTIONS.MARK_EVENT_UNPUBLISHED]: (state, payload) => (
        onEventPublishChanged(state, payload)
    ),
});

const onEventPublishChanged = (state, payload) => {
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
};

const markEventCancelled = (events, eventId, etag, reason, occurStatus) => {
    if (!(eventId in events)) return;

    let updatedEvent = events[eventId];

    let ednote = `------------------------------------------------------------
Event Cancelled
`;

    if (reason !== null) {
        ednote += `Reason: ${reason}\n`;
    }

    if (get(updatedEvent, 'ednote', null) !== null) {
        ednote = `${updatedEvent.ednote}\n\n${ednote}`;
    }

    updatedEvent.ednote = ednote;
    updatedEvent.state = WORKFLOW_STATE.CANCELLED;
    updatedEvent.occur_status = occurStatus;
    updatedEvent._etag = etag;
};

export default eventsReducer;
