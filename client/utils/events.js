import {
    PRIVILEGES,
    WORKFLOW_STATE,
    POST_STATE,
    EVENTS,
    GENERIC_ITEM_ACTIONS,
} from '../constants';
import {
    getItemWorkflowState,
    lockUtils,
    isItemSpiked,
    isItemPublic,
    getPostedState,
    isItemCancelled,
    isItemRescheduled,
    isItemPostponed,
    getDateTimeString,
    isEmptyActions,
    isDateInRange,
    gettext,
} from './index';
import moment from 'moment';
import RRule from 'rrule';
import {get, map, isNil, sortBy, cloneDeep, omitBy} from 'lodash';
import {EventUpdateMethods} from '../components/Events';


/**
 * Helper function to determine if the starting and ending dates
 * occupy entire day(s)
 * @param {moment} startingDate - A moment instance for the starting date/time
 * @param {moment} endingDate - A moment instance for the starting date/time
 * @param {boolean} checkMultiDay - If true include multi-day in the check, otherwise must be single day only
 * @return {boolean} If the date/times occupy entire day(s)
 */
const isEventAllDay = (startingDate, endingDate, checkMultiDay = false) => {
    const start = moment(startingDate).clone();
    const end = moment(endingDate).clone();

    return (checkMultiDay || start.isSame(end, 'day')) &&
        start.isSame(start.clone().startOf('day'), 'minute') &&
        end.isSame(end.clone().endOf('day'), 'minute');
};

const isEventSameDay = (startingDate, endingDate) => (
    moment(startingDate).format('DD/MM/YYYY') === moment(endingDate).format('DD/MM/YYYY')
);

const eventHasPlanning = (event) => get(event, 'planning_ids', []).length > 0;

const isEventLocked = (event, locks) =>
    !isNil(event) && locks && (
        event._id in locks.event ||
        get(event, 'recurrence_id') in locks.recurring
    );

const isEventLockRestricted = (event, session, locks) =>
    isEventLocked(event, locks) &&
    !lockUtils.isItemLockedInThisSession(event, session);

/**
 * Helper function to determine if a recurring event instances overlap
 * Using the RRule library (similar to that the server uses), it coverts the
 * recurring_rule to an RRule instance and determines if instances overlap
 * @param {moment} startingDate - The starting date/time of the selected event
 * @param {moment} endingDate - The ending date/time of the selected event
 * @param {object} recurringRule - The list of recurring rules
 * @returns {boolean} True if the instances overlap, false otherwise
 */
const doesRecurringEventsOverlap = (startingDate, endingDate, recurringRule) => {
    if (!recurringRule || !startingDate || !endingDate ||
        !('frequency' in recurringRule) || !('interval' in recurringRule)) return false;

    const freqMap = {
        YEARLY: RRule.YEARLY,
        MONTHLY: RRule.MONTHLY,
        WEEKLY: RRule.WEEKLY,
        DAILY: RRule.DAILY,
    };

    const dayMap = {
        MO: RRule.MO,
        TU: RRule.TU,
        WE: RRule.WE,
        TH: RRule.TH,
        FR: RRule.FR,
        SA: RRule.SA,
        SU: RRule.SU,
    };

    const rules = {
        freq: freqMap[recurringRule.frequency],
        interval: parseInt(recurringRule.interval, 10) || 1,
        dtstart: startingDate.toDate(),
        count: 2,
    };

    if ('byday' in recurringRule) {
        rules.byweekday = recurringRule.byday.split(' ').map((day) => dayMap[day]);
    }

    const rule = new RRule(rules);

    let nextEvent = moment(rule.after(startingDate.toDate()));

    return nextEvent.isBetween(startingDate, endingDate) || nextEvent.isSame(endingDate);
};

const getRelatedEventsForRecurringEvent = (recurringEvent, filter) => {
    let eventsInSeries = get(recurringEvent, '_recurring', []);
    let events = [];
    let plannings = get(recurringEvent, '_plannings', []);

    switch (filter.value) {
    case EventUpdateMethods[1].value: // Selected & Future Events
        events = eventsInSeries.filter((e) => (
            moment(e.dates.start).isSameOrAfter(moment(recurringEvent.dates.start)) &&
                e._id !== recurringEvent._id
        ));
        break;
    case EventUpdateMethods[2].value: // All Events
        events = eventsInSeries.filter((e) => e._id !== recurringEvent._id);
        break;
    case EventUpdateMethods[0].value: // Selected Event Only
    default:
        break;
    }

    if (plannings.length > 0) {
        const eventIds = map(events, '_id');

        plannings = plannings.filter(
            (p) => (eventIds.indexOf(p.event_item) > -1 || p.event_item === recurringEvent._id)
        );
    }

    return {
        ...recurringEvent,
        _events: events,
        _relatedPlannings: plannings,
    };
};

const isEventIngested = (event) => (
    get(event, 'state', WORKFLOW_STATE.DRAFT) === WORKFLOW_STATE.INGESTED
);

const canSpikeEvent = (event, session, privileges, locks) => {
    const eventState = getItemWorkflowState(event);

    return !isNil(event) &&
        !isItemPublic(event) &&
        (eventState === WORKFLOW_STATE.DRAFT || isEventIngested(event) || isItemPostponed(event)) &&
        !!privileges[PRIVILEGES.SPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isEventLockRestricted(event, session, locks) &&
        !get(event, 'reschedule_from') &&
        !isEventInUse(event);
};

const canUnspikeEvent = (event, privileges) => (
    !isNil(event) &&
        isItemSpiked(event) &&
        !!privileges[PRIVILEGES.UNSPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
);

const canDuplicateEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
);

const canCreatePlanningFromEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isEventLockRestricted(event, session, locks) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(event) &&
        !isItemPostponed(event)
);

const canCreateAndOpenPlanningFromEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isEventLockRestricted(event, session, locks) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(event) &&
        !isItemPostponed(event) &&
        !isEventLocked(event, locks)
);

const canPostEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !!get(event, '_id') &&
        !isItemSpiked(event) &&
        getPostedState(event) !== POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.POST_EVENT] &&
        !isEventLockRestricted(event, session, locks) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(event)
);

const canUnpostEvent = (event, session, privileges, locks) => (
    !isNil(event) && !isItemSpiked(event) &&
        !isEventLockRestricted(event, session, locks) &&
        getPostedState(event) === POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.POST_EVENT] &&
        !isItemRescheduled(event)
);

const canCancelEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event)
);

const isEventInUse = (event) => (
    !isNil(event) &&
        (eventHasPlanning(event) || isItemPublic(event))
);

const isEventLockedForMetadataEdit = (event) => (
    get(event, 'lock_action', null) === 'edit'
);

const canConvertToRecurringEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !event.recurrence_id &&
        canEditEvent(event, session, privileges, locks) &&
        !isItemPostponed(event) &&
        !isEventLockedForMetadataEdit(event)
);

const canEditEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event)
);

const canUpdateEvent = (event, session, privileges, locks) => (
    canEditEvent(event, session, privileges, locks) &&
        isItemPublic(event) &&
        !!privileges[PRIVILEGES.POST_EVENT]
);

const canUpdateEventTime = (event, session, privileges, locks) => (
    !isNil(event) &&
        canEditEvent(event, session, privileges, locks) &&
        !isItemPostponed(event) &&
        !isEventLockedForMetadataEdit(event)
);

const canRescheduleEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemRescheduled(event) &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isEventLockedForMetadataEdit(event)
);

const canPostponeEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemPostponed(event) &&
        !isItemRescheduled(event) &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isEventLockedForMetadataEdit(event)
);

const canUpdateEventRepetitions = (event, session, privileges, locks) => (
    !isNil(event) &&
        isEventRecurring(event) &&
        canRescheduleEvent(event, session, privileges, locks)
);

const getEventItemActions = (event, session, privileges, actions, locks) => {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [EVENTS.ITEM_ACTIONS.SPIKE.label]: () =>
            canSpikeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UNSPIKE.label]: () =>
            canUnspikeEvent(event, privileges, locks),
        [EVENTS.ITEM_ACTIONS.DUPLICATE.label]: () =>
            canDuplicateEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: () =>
            canCancelEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label]: () =>
            canCreatePlanningFromEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.label]: () =>
            canCreateAndOpenPlanningFromEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: () =>
            canUpdateEventTime(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: () =>
            canRescheduleEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: () =>
            canPostponeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: () =>
            canConvertToRecurringEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label]: () =>
            canUpdateEventRepetitions(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT.label]: () =>
            canEditEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.label]: () =>
            canEditEvent(event, session, privileges, locks),
    };

    actions.forEach((action) => {
        if (actionsValidator[action.label] &&
                !actionsValidator[action.label](event, session, privileges)) {
            return;
        }

        itemActions.push({
            ...action,
            key: `${action.label}-${key}`,
        });

        key++;
    });

    if (isEmptyActions(itemActions)) {
        return [];
    }

    return itemActions;
};

const isEventAssociatedWithPlannings = (eventId, allPlannings) => (
    Object.keys(allPlannings)
        .filter((pid) => get(allPlannings[pid], 'event_item', null) === eventId).length > 0
);

const isEventRecurring = (item) => (
    get(item, 'recurrence_id', null) !== null
);

const getDateStringForEvent = (event, dateFormat, timeFormat, dateOnly = false) => {
    // !! Note - expects event dates as instance of moment() !! //
    const start = get(event.dates, 'start');
    const end = get(event.dates, 'end');

    if (!start || !end)
        return;

    if (start.isSame(end, 'day')) {
        if (dateOnly) {
            return start.format(dateFormat);
        } else {
            return getDateTimeString(start, dateFormat, timeFormat) + ' - ' +
                end.format(timeFormat);
        }
    } else if (dateOnly) {
        return start.format(dateFormat) + ' - ' + end.format(dateFormat);
    } else {
        return getDateTimeString(start, dateFormat, timeFormat) + ' - ' +
                getDateTimeString(end, dateFormat, timeFormat);
    }
};

const getEventActions = (item, session, privileges, lockedItems, callBacks, withMultiPlanningDate = false) => {
    if (!get(item, '_id')) {
        return [];
    }

    let actions = [];

    Object.keys(callBacks).forEach((callBackName) => {
        switch (callBackName) {
        case EVENTS.ITEM_ACTIONS.DUPLICATE.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.DUPLICATE,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.SPIKE.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.SPIKE,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.UNSPIKE.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.UNSPIKE,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.EDIT_EVENT,
                    callback: callBacks[callBackName].bind(null, item),
                });
            break;

        case EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName:
            callBacks[callBackName] &&
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL,
                    callback: callBacks[callBackName].bind(null, item, true),
                });
            break;
        }
    });

    const CREATE_PLANNING = callBacks[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName];
    const CREATE_AND_OPEN_PLANNING = callBacks[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName];

    if (!withMultiPlanningDate || self.isEventSameDay(item)) {
        if (CREATE_PLANNING || CREATE_AND_OPEN_PLANNING) {
            actions.push(GENERIC_ITEM_ACTIONS.DIVIDER);

            if (CREATE_PLANNING) {
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                    callback: CREATE_PLANNING.bind(null, item, null, false),
                });
            }

            if (CREATE_AND_OPEN_PLANNING) {
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING,
                    callback: CREATE_AND_OPEN_PLANNING.bind(null, item, null, true),
                });
            }
        }
    } else {
        // Multi-day event with a requirement of a submenu
        let subActions = {
            create: {
                current: [],
                past: [],
            },
            createAndOpen: {
                current: [],
                past: [],
            },
        };

        let eventDate = moment(item.dates.start);
        const currentDate = moment();

        for (; isDateInRange(eventDate, item.dates.start, item.dates.end); eventDate.add(1, 'days')) {
            const label = '@ ' + eventDate.format('DD/MM/YYYY ') + item.dates.start.format('HH:mm');
            const eventCallBack = CREATE_PLANNING.bind(null, item, moment(eventDate), false);
            const openCallBack = CREATE_AND_OPEN_PLANNING &&
                CREATE_AND_OPEN_PLANNING.bind(null, item, moment(eventDate), true);

            if (eventDate.isSameOrAfter(currentDate, 'date')) {
                subActions.create.current.push({
                    label: label,
                    callback: eventCallBack,
                });

                openCallBack && subActions.createAndOpen.current.push({
                    label: label,
                    callback: openCallBack,
                });
            } else {
                subActions.create.past.push({
                    label: label,
                    callback: eventCallBack,
                });

                openCallBack && subActions.createAndOpen.past.push({
                    label: label,
                    callback: openCallBack,
                });
            }
        }

        // Combine past and other events with a divider and heading
        if (subActions.create.past.length > 0) {
            subActions.create.current = subActions.create.current.length === 0 ?
                subActions.create.past :
                [
                    ...subActions.create.current,
                    GENERIC_ITEM_ACTIONS,
                    {
                        ...GENERIC_ITEM_ACTIONS.LABEL,
                        text: gettext('Past Events'),
                    },
                    ...subActions.create.past,
                ];
        }

        if (subActions.createAndOpen.past.length > 0) {
            subActions.createAndOpen.current = subActions.createAndOpen.current.length === 0 ?
                subActions.createAndOpen.past :
                [
                    ...subActions.createAndOpen.current,
                    GENERIC_ITEM_ACTIONS,
                    {
                        ...GENERIC_ITEM_ACTIONS.LABEL,
                        text: gettext('Past Events'),
                    },
                    ...subActions.createAndOpen.past,
                ];
        }

        if (CREATE_PLANNING || CREATE_AND_OPEN_PLANNING) {
            actions.push(GENERIC_ITEM_ACTIONS.DIVIDER);
        }

        if (CREATE_PLANNING) {
            if (subActions.create.current.length > 1) {
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                    callback: subActions.create.current,
                });
            } else if (subActions.create.current.length === 1) {
                actions.push({
                    ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                    callback: subActions.create.current[0].callback,
                });
            }
        }

        if (CREATE_AND_OPEN_PLANNING) {
            if (subActions.createAndOpen.current.length > 1) {
                actions.push(
                    {
                        ...EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING,
                        callback: subActions.createAndOpen.current,
                    }
                );
            } else if (subActions.createAndOpen.current.length === 1) {
                actions.push(
                    {
                        ...EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING,
                        callback: subActions.createAndOpen.current[0].callback,
                    }
                );
            }
        }
    }

    return getEventItemActions(
        item,
        session,
        privileges,
        actions,
        lockedItems
    );
};

/*
 * Groups the events by date
 */
const getEventsByDate = (events, startDate, endDate) => {
    if (!events) return [];
    // check if search exists
    // order by date
    let sortedEvents = events.sort((a, b) => a.dates.start - b.dates.start);
    const days = {};

    function addEventToDate(event, date) {
        let eventDate = date || event.dates.start;
        let eventStart = event.dates.start;
        let eventEnd = event.dates.end;

        if (!event.dates.start.isSame(event.dates.end, 'day')) {
            eventStart = eventDate;
            eventEnd = event.dates.end.isSame(eventDate, 'day') ?
                event.dates.end : moment(eventDate.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(86399, 'seconds');
        }

        if (!(isDateInRange(startDate, eventStart, eventEnd) ||
            isDateInRange(endDate, eventStart, eventEnd))) {
            if (!isDateInRange(eventStart, startDate, endDate) &&
                !isDateInRange(eventEnd, startDate, endDate)) {
                return;
            }
        }

        let eventDateFormatted = eventDate.format('YYYY-MM-DD');

        if (!days[eventDateFormatted]) {
            days[eventDateFormatted] = [];
        }

        let evt = cloneDeep(event);

        evt._sortDate = eventDate;

        days[eventDateFormatted].push(evt);
    }

    sortedEvents.forEach((event) => {
        // compute the number of days of the event
        if (!event.dates.start.isSame(event.dates.end, 'day')) {
            let deltaDays = Math.max(event.dates.end.diff(event.dates.start, 'days'), 1);
            // if the event happens during more that one day, add it to every day
            // add the event to the other days

            for (let i = 1; i <= deltaDays; i++) {
                //  clone the date
                const newDate = moment(event.dates.start.format('YYYY-MM-DD'), 'YYYY-MM-DD', true);

                newDate.add(i, 'days');
                addEventToDate(event, newDate);
            }
        }

        // add event to its initial starting date
        addEventToDate(event);
    });

    let sortable = [];

    for (let day in days) sortable.push({
        date: day,
        events: sortBy(days[day], [(e) => (e._sortDate)]),
    });

    return sortBy(sortable, [(e) => (e.date)]);
};

/*
 * Convert event dates to moment.
 */
const convertToMoment = (item) => {
    const newItem = {
        ...item,
        dates: {
            ...item.dates,
            start: get(item.dates, 'start') ? moment(item.dates.start) : null,
            end: get(item.dates, 'end') ? moment(item.dates.end) : null,
        },
    };

    if (get(item, 'location[0]')) {
        newItem.location = item.location[0];
    }

    return newItem;
};

const duplicateEvent = (event, occurStatus) => {
    let duplicatedEvent = cloneDeep(omitBy(event, (v, k) => (
        k.startsWith('_')) ||
        ['guid', 'unique_name', 'unique_id', 'lock_user', 'lock_time', 'lock_session', 'lock_action',
            'pubstatus', 'recurrence_id', 'previous_recurrence_id', 'reschedule_from', 'reschedule_to',
            'planning_ids'].indexOf(k) > -1));

    // Delete recurring rule
    if (duplicatedEvent.dates.recurring_rule) {
        delete duplicatedEvent.dates.recurring_rule;
    }

    const daysBetween = moment().diff(duplicatedEvent.dates.start, 'days');

    if (daysBetween > 0) {
        // Add the delta to both start and end (to handle multi-day events)
        duplicatedEvent.dates.start = duplicatedEvent.dates.start.add(daysBetween, 'days');
        duplicatedEvent.dates.end = duplicatedEvent.dates.end.add(daysBetween, 'days');
    }

    duplicatedEvent.duplicate_from = event._id;
    duplicatedEvent.occur_status = occurStatus;
    return duplicatedEvent;
};

// eslint-disable-next-line consistent-this
const self = {
    isEventAllDay,
    doesRecurringEventsOverlap,
    getRelatedEventsForRecurringEvent,
    canSpikeEvent,
    canUnspikeEvent,
    canCreatePlanningFromEvent,
    canCreateAndOpenPlanningFromEvent,
    canPostEvent,
    canUnpostEvent,
    canEditEvent,
    canUpdateEvent,
    getEventItemActions,
    isEventAssociatedWithPlannings,
    canCancelEvent,
    eventHasPlanning,
    isEventInUse,
    canRescheduleEvent,
    canPostponeEvent,
    canUpdateEventTime,
    canConvertToRecurringEvent,
    isEventLocked,
    isEventLockRestricted,
    isEventSameDay,
    isEventRecurring,
    getDateStringForEvent,
    getEventActions,
    getEventsByDate,
    convertToMoment,
    duplicateEvent,
};

export default self;
