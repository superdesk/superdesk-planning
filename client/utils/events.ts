import moment from 'moment';
import RRule from 'rrule';
import {get, map, isNil, sortBy, cloneDeep, omitBy, find, isEqual, pickBy, flatten} from 'lodash';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';

import {appConfig} from 'appConfig';
import {IEventItem} from '../interfaces';

import {
    PRIVILEGES,
    WORKFLOW_STATE,
    POST_STATE,
    EVENTS,
    GENERIC_ITEM_ACTIONS,
    ITEM_TYPE,
    TIME_COMPARISON_GRANULARITY,
    TO_BE_CONFIRMED_FIELD,
} from '../constants';
import {
    getItemWorkflowState,
    lockUtils,
    isItemSpiked,
    isItemPublic,
    isItemKilled,
    getPostedState,
    isItemCancelled,
    isItemRescheduled,
    isItemPostponed,
    getDateTimeString,
    isEmptyActions,
    isDateInRange,
    gettext,
    getItemId,
    isExistingItem,
    isItemExpired,
    isItemPosted,
    timeUtils,
    getItemInArrayById,
    getTBCDateString,
    sortBasedOnTBC,
    sanitizeItemFields,
} from './index';
import {getUsersDefaultLanguage} from './users';
import {toUIFrameworkInterface} from './planning';


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
    !lockUtils.isItemLockedInThisSession(event, session, locks);

const isEventCompleted = (event) => (get(event, 'completed'));

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

const getRelatedEventsForRecurringEvent = (recurringEvent, filter, postedPlanningOnly) => {
    let eventsInSeries = get(recurringEvent, '_recurring', []);
    let events = [];
    let plannings = get(recurringEvent, '_plannings', []);

    switch (filter.value) {
    case EVENTS.UPDATE_METHODS[1].value: // Selected & Future Events
        events = eventsInSeries.filter((e) => (
            moment(e.dates.start).isSameOrAfter(moment(recurringEvent.dates.start)) &&
                e._id !== recurringEvent._id
        ));
        break;
    case EVENTS.UPDATE_METHODS[2].value: // All Events
        events = eventsInSeries.filter((e) => e._id !== recurringEvent._id);
        break;
    case EVENTS.UPDATE_METHODS[0].value: // Selected Event Only
    default:
        break;
    }

    if (plannings.length > 0) {
        const eventIds = map(events, '_id');

        plannings = plannings.filter(
            (p) => ((eventIds.indexOf(p.event_item) > -1 || p.event_item === recurringEvent._id) &&
                (!postedPlanningOnly || p.pubstatus === POST_STATE.USABLE))
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

const canSpikeEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemPosted(event) &&
        (
            getItemWorkflowState(event) === WORKFLOW_STATE.DRAFT ||
            isEventIngested(event) ||
            isItemPostponed(event)
        ) &&
        !!privileges[PRIVILEGES.SPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isEventLockRestricted(event, session, locks) &&
        !get(event, 'reschedule_from') &&
        (!isItemExpired(event) || privileges[PRIVILEGES.EDIT_EXPIRED])
);

const canUnspikeEvent = (event, privileges) => (
    !isNil(event) &&
        isItemSpiked(event) &&
        !!privileges[PRIVILEGES.UNSPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        (!isItemExpired(event) || privileges[PRIVILEGES.EDIT_EXPIRED])
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
        !isItemPostponed(event) &&
        !isItemExpired(event) &&
        !isItemKilled(event)
);

const canCreateAndOpenPlanningFromEvent = (event, session, privileges, locks) => (
    canCreatePlanningFromEvent(event, session, privileges, locks)
);

const canPostEvent = (event, session, privileges, locks) => (
    isExistingItem(event) &&
        !isItemSpiked(event) &&
        getPostedState(event) !== POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.POST_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isEventLockRestricted(event, session, locks) &&
        (!isItemCancelled(event) || getItemWorkflowState(event) === WORKFLOW_STATE.KILLED) &&
        !isItemRescheduled(event)
);

const canUnpostEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isEventLockRestricted(event, session, locks) &&
        getPostedState(event) === POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.UNPOST_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemRescheduled(event)
);

const canCancelEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
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
        !isEventLockedForMetadataEdit(event) && !isItemCancelled(event) && !isEventCompleted(event) &&
        !isItemExpired(event)
);

const canEditEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event) &&
        (!isItemExpired(event) || privileges[PRIVILEGES.EDIT_EXPIRED])
);

const canUpdateEvent = (event, session, privileges, locks) => (
    canEditEvent(event, session, privileges, locks) &&
        isItemPublic(event) &&
        !isItemKilled(event) &&
        !!privileges[PRIVILEGES.POST_EVENT]
);

const canUpdateEventTime = (event, session, privileges, locks) => (
    !isNil(event) &&
        canEditEvent(event, session, privileges, locks) &&
        !isItemPostponed(event) && !isItemCancelled(event) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
);

const canRescheduleEvent = (event, session, privileges, locks) => (
    !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !isEventLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemRescheduled(event) &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
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
        !isEventCompleted(event) &&
        !isItemExpired(event)
);

const canUpdateEventRepetitions = (event, session, privileges, locks) => (
    !isNil(event) &&
        isEventRecurring(event) &&
        canRescheduleEvent(event, session, privileges, locks) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
);

const canAssignEventToCalendar = (event, session, privileges, locks) => (
    canEditEvent(event, session, privileges, locks) &&
        !isEventLocked(event, locks)
);

const canSaveEventAsTemplate = (event, session, privileges, locks) => (
    !isEventLockRestricted(event, session, locks) && privileges[PRIVILEGES.EVENT_TEMPLATES]
);

const canMarkEventAsComplete = (event, session, privileges, locks) => {
    const currentDate = moment();
    const precondition = [
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.SCHEDULED,
    ].includes(event.state) && canEditEvent(event, session, privileges, locks) &&
    !isEventCompleted(event);

    if (get(event, 'recurrence_id')) {
        // can action on any recurring event from present to future
        return precondition && event.dates.end.isSameOrAfter(currentDate, 'date');
    } else {
        // can action only if event is of current day or current day passes through a multi day event
        return precondition && event.dates.start.isSameOrBefore(currentDate, 'date') &&
            event.dates.end.isSameOrAfter(currentDate, 'date');
    }
};

const getEventItemActions = (event, session, privileges, actions, locks) => {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: () =>
            canSpikeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: () =>
            canUnspikeEvent(event, privileges, locks),
        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: () =>
            canDuplicateEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: () =>
            canCancelEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: () =>
            canCreatePlanningFromEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]: () =>
            canCreateAndOpenPlanningFromEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: () =>
            canUpdateEventTime(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: () =>
            canRescheduleEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: () =>
            canPostponeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: () =>
            canConvertToRecurringEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: () =>
            canUpdateEventRepetitions(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]: () =>
            canEditEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]: () =>
            canEditEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]: () =>
            canAssignEventToCalendar(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]: () =>
            canMarkEventAsComplete(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName]: () =>
            canSaveEventAsTemplate(event, session, privileges, locks),
    };

    actions.forEach((action) => {
        if (actionsValidator[action.actionName] &&
                !actionsValidator[action.actionName](event, session, privileges)) {
            return;
        }

        itemActions.push({
            ...action,
            key: `${action.actionName}-${key}`,
        });

        key++;
    });

    if (isEmptyActions(itemActions)) {
        return [];
    }

    return itemActions;
};

const isEventRecurring = (item) => (
    get(item, 'recurrence_id', null) !== null
);

const getDateStringForEvent = (event, dateOnly = false, useLocal = true, withTimezone = true) => {
    // !! Note - expects event dates as instance of moment() !! //
    const dateFormat = appConfig.planning.dateformat;
    const timeFormat = appConfig.planning.timeformat;
    const start = get(event.dates, 'start');
    const end = get(event.dates, 'end');
    const tz = get(event.dates, 'tz');
    const localStart = timeUtils.getLocalDate(start, tz);
    let dateString, timezoneString = '';

    if (!start || !end)
        return;

    dateString = getTBCDateString(event, ' @ ', dateOnly);
    if (!dateString) {
        if (start.isSame(end, 'day')) {
            if (dateOnly) {
                dateString = start.format(dateFormat);
            } else {
                dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false) + ' - ' +
                    end.format(timeFormat);
            }
        } else if (dateOnly) {
            dateString = start.format(dateFormat) + ' - ' + end.format(dateFormat);
        } else {
            dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false) + ' - ' +
                    getDateTimeString(end, dateFormat, timeFormat, ' @ ', false);
        }
    }

    if (withTimezone) {
        timezoneString = !useLocal && tz ?
            timeUtils.getDateInRemoteTimeZone(start, tz).format('z') : localStart.format('z');
        timezoneString = `${timeUtils.getTimeZoneAbbreviation(timezoneString)} `;
    }

    if (!useLocal) {
        return tz ? `(${timezoneString}${dateString})` : null;
    } else {
        return `${timezoneString}${dateString}`;
    }
};

const getSingleDayPlanningActions = (item, actions, createPlanning, createAndOpenPlanning) => {
    if (createPlanning || createAndOpenPlanning) {
        actions.push(GENERIC_ITEM_ACTIONS.DIVIDER);

        if (createPlanning) {
            actions.push({
                ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                callback: createPlanning.bind(null, item, null, false),
            });
        }

        if (createAndOpenPlanning) {
            actions.push({
                ...EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING,
                callback: createAndOpenPlanning.bind(null, item, null, true),
            });
        }
    }
};

const generateMultiDayPlanningActions = (item, subActions, createPlanning, createAndOpenPlanning) => {
    let eventDate = moment(item.dates.start);
    const currentDate = moment();

    for (; isDateInRange(eventDate, item.dates.start, item.dates.end); eventDate.add(1, 'days')) {
        const label = '@ ' + eventDate.format('DD/MM/YYYY ') + item.dates.start.format('HH:mm');
        const eventCallBack = createPlanning.bind(null, item, moment(eventDate), false);
        const openCallBack = createAndOpenPlanning &&
            createAndOpenPlanning.bind(null, item, moment(eventDate), true);

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
};

const getMultiDayPlanningActions = (item, actions, createPlanning, createAndOpenPlanning) => {
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

    self.generateMultiDayPlanningActions(item, subActions, createPlanning, createAndOpenPlanning);

    if (createPlanning || createAndOpenPlanning) {
        actions.push(GENERIC_ITEM_ACTIONS.DIVIDER);
    }

    if (createPlanning) {
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

    if (createAndOpenPlanning) {
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
};

const getEventActions = ({
    item,
    session,
    privileges,
    lockedItems,
    callBacks,
    withMultiPlanningDate,
    calendars,
}) => {
    if (!isExistingItem(item)) {
        return [];
    }

    let actions = [];
    const isExpired = isItemExpired(item);
    let alllowedCallBacks = [
        EVENTS.ITEM_ACTIONS.PREVIEW.actionName,
        EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName,
        EVENTS.ITEM_ACTIONS.DUPLICATE.actionName,
        EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.SPIKE.actionName,
        EVENTS.ITEM_ACTIONS.UNSPIKE.actionName,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName,
        EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName,
    ];

    if (appConfig.event_templates_enabled === true) {
        alllowedCallBacks.push(EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName);
    }

    if (isExpired && !privileges[PRIVILEGES.EDIT_EXPIRED]) {
        alllowedCallBacks = [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName];
    }

    if (isItemSpiked(item)) {
        alllowedCallBacks = [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName];
    }

    alllowedCallBacks.forEach((callbackName) => {
        const action = find(EVENTS.ITEM_ACTIONS, (action) => action.actionName === callbackName);

        if (callBacks[action.actionName]) {
            actions.push({
                ...action,
                callback: callBacks[action.actionName],
            });
        }
    });

    if (get(calendars, 'length', 0) > 0 && callBacks[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]) {
        let calendarCallBacks = [];

        calendars.forEach((cal) => {
            calendarCallBacks.push({
                label: cal.name,
                inactive: !!get(item, 'calendars', []).find((c) => c.qcode === cal.qcode),
                callback: callBacks[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName].bind(null, item, cal),
            });
        });

        let assignToCalendarAction = actions.find((a) =>
            a.actionName === EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName);

        if (assignToCalendarAction) {
            assignToCalendarAction.callback = calendarCallBacks;
        }
    } else {
        actions = actions.filter((a) => a.actionName !== EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName);
    }

    if (!isExpired || privileges[PRIVILEGES.EDIT_EXPIRED]) {
        const CREATE_PLANNING = callBacks[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName];
        const CREATE_AND_OPEN_PLANNING = callBacks[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName];

        (!withMultiPlanningDate || self.isEventSameDay(item)) ?
            self.getSingleDayPlanningActions(item, actions, CREATE_PLANNING, CREATE_AND_OPEN_PLANNING) :
            self.getMultiDayPlanningActions(item, actions, CREATE_PLANNING, CREATE_AND_OPEN_PLANNING);
    }

    return getEventItemActions(
        item,
        session,
        privileges,
        actions,
        lockedItems
    );
};

function getEventActionsForUiFrameworkMenu(data): Array<IMenuItem> {
    return toUIFrameworkInterface(getEventActions(data));
}

/*
 * Groups the events by date
 */
const getFlattenedEventsByDate = (events, startDate, endDate) => {
    const eventsList = getEventsByDate(events, startDate, endDate);

    return flatten(sortBy(eventsList, [(e) => (e.date)]).map((e) => e.events.map((k) => [e.date, k._id])));
};

/*
 * Groups the events by date
 */
const getEventsByDate = (events, startDate, endDate) => {
    if (!get(events, 'length', 0)) return [];
    // check if search exists
    // order by date
    let sortedEvents = events.sort((a, b) => a.dates.start - b.dates.start);
    let maxStartDate = sortedEvents[sortedEvents.length - 1].dates.start;

    if (startDate.isAfter(maxStartDate, 'day')) {
        maxStartDate = startDate;
    }

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
        let ending = event.actioned_date ? event.actioned_date : event.dates.end;

        if (!event.dates.start.isSame(ending, 'day')) {
            let deltaDays = Math.max(Math.ceil(ending.diff(event.dates.start, 'days', true)), 1);
            // if the event happens during more that one day, add it to every day
            // add the event to the other days

            for (let i = 1; i <= deltaDays; i++) {
                //  clone the date
                const newDate = moment(event.dates.start.format('YYYY-MM-DD'), 'YYYY-MM-DD', true);

                newDate.add(i, 'days');

                if (maxStartDate.isSameOrAfter(newDate, 'day') && newDate.isSameOrBefore(ending, 'day')) {
                    addEventToDate(event, newDate);
                }
            }
        }

        // add event to its initial starting date
        // add an event only if it's not actioned or actioned after this event's start date
        if (!event.actioned_date || event.actioned_date.isSameOrAfter(event.dates.start, 'date')) {
            addEventToDate(event);
        }
    });

    return sortBasedOnTBC(days);
};

const modifyForClient = (event) => {
    sanitizeItemFields(event);

    // The `_status` field is available when the item comes from a POST/PATCH request
    if (event._status != null) {
        delete event._status;
    }

    if (get(event, 'dates.start')) {
        event.dates.start = timeUtils.getDateInRemoteTimeZone(event.dates.start, timeUtils.localTimeZone());
        event._startTime = timeUtils.getDateInRemoteTimeZone(event.dates.start, timeUtils.localTimeZone());
    }

    if (get(event, 'dates.end')) {
        event.dates.end = timeUtils.getDateInRemoteTimeZone(event.dates.end, timeUtils.localTimeZone());
        event._endTime = timeUtils.getDateInRemoteTimeZone(event.dates.end, timeUtils.localTimeZone());
    }

    if (get(event, 'dates.recurring_rule.until')) {
        event.dates.recurring_rule.until = timeUtils.getDateInRemoteTimeZone(
            event.dates.recurring_rule.until,
            timeUtils.localTimeZone()
        );
    }

    if (get(event, 'location[0]')) {
        event.location = event.location[0];
    }

    if (get(event, 'unique_id') && typeof event.unique_id === 'string') {
        event.unique_id = parseInt(event.unique_id, 10);
    }

    if (get(event, 'actioned_date')) {
        event.actioned_date = moment(event.actioned_date);
    }

    return event;
};

function modifyEventsForClient(events: Array<IEventItem>): Array<IEventItem> {
    events.forEach(modifyForClient);
    return events;
}

const modifyLocationForServer = (event) => {
    if (!('location' in event) || Array.isArray(event.location)) {
        return;
    }

    event.location = event.location ?
        [event.location] :
        null;
};


const modifyForServer = (event, removeNullLinks = false) => {
    modifyLocationForServer(event);

    // remove links if it contains only null values
    if (removeNullLinks && get(event, 'links.length', 0) > 0) {
        event.links = event.links.filter(
            (link) => link && get(link, 'length', 0) > 0
        );
    }

    if (timeUtils.isEventInDifferentTimeZone(event)) {
        if (get(event, 'dates.start') && moment.isMoment(event.dates.start)) {
            event.dates.start = timeUtils.getDateInRemoteTimeZone(event.dates.start, event.dates.tz);
        }

        if (get(event, 'dates.end') && moment.isMoment(event.dates.end)) {
            event.dates.end = timeUtils.getDateInRemoteTimeZone(event.dates.end, event.dates.tz);
        }

        if (get(event, 'dates.recurring_rule.until') && moment.isMoment(event.dates.recurring_rule.until)) {
            event.dates.recurring_rule.until = timeUtils.getDateInRemoteTimeZone(
                event.dates.recurring_rule.until,
                event.dates.tz
            );
        }
    }

    return event;
};

const duplicateEvent = (event, occurStatus) => {
    let duplicatedEvent = cloneDeep(omitBy(event, (v, k) => (
        k.startsWith('_')) ||
        ['guid', 'unique_name', 'unique_id', 'lock_user', 'lock_time', 'lock_session', 'lock_action',
            'pubstatus', 'recurrence_id', 'previous_recurrence_id', 'reschedule_from', 'reschedule_to',
            'planning_ids', 'reason', 'expired', 'state_reason', 'actioned_date', 'completed'].indexOf(k) > -1));

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

    duplicatedEvent.duplicate_from = getItemId(event);
    duplicatedEvent.occur_status = occurStatus;
    duplicatedEvent.state = WORKFLOW_STATE.DRAFT;

    // duplicated event should get the browser timezone
    duplicatedEvent.dates.tz = moment.tz.guess();

    return duplicatedEvent;
};

export const shouldLockEventForEdit = (item, privileges) => (
    !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        (!isItemPublic(item) || !!privileges[PRIVILEGES.POST_EVENT])
);

const defaultEventValues = (occurStatuses, defaultCalendars, defaultPlaceList) => {
    const occurStatus = getItemInArrayById(occurStatuses, 'eocstat:eos5', 'qcode') || {
        label: 'Confirmed',
        qcode: 'eocstat:eos5',
        name: 'Planned, occurs certainly',
    };

    let newEvent = {
        type: ITEM_TYPE.EVENT,
        occur_status: occurStatus,
        dates: {
            start: null,
            end: null,
            tz: timeUtils.localTimeZone(),
        },
        calendars: defaultCalendars,
        state: 'draft',
        _startTime: null,
        _endTime: null,
        language: getUsersDefaultLanguage(true),
    };

    if (defaultPlaceList) {
        newEvent.place = defaultPlaceList;
    }
    return newEvent;
};

function shouldFetchFilesForEvent(event?: IEventItem) {
    return (event?.files || [])
        .filter((file) => typeof file === 'string')
        .length > 0;
}

const getRepeatSummaryForEvent = (schedule) => {
    const frequency = get(schedule, 'recurring_rule.frequency');
    const endRepeatMode = get(schedule, 'recurring_rule.endRepeatMode');
    const until = get(schedule, 'recurring_rule.until');
    const count = get(schedule, 'recurring_rule.count');
    const byDay = get(schedule, 'recurring_rule.byday');
    const startDate = get(schedule, 'start');
    const interval = get(schedule, 'recurring_rule.interval');
    const weekdays = byDay === 'MO TU WE TH FR';
    const allWeek = byDay === 'MO TU WE TH FR SA SU';

    const getFrequency = () => {
        switch (frequency) {
        case 'YEARLY':
            return gettext('Every {{interval}} year(s) on {{date}} ',
                {
                    interval: interval,
                    date: startDate.format('MMM D'),
                });

        case 'MONTHLY':
            return gettext('Every {{interval}} month(s) on day {{day}} ',
                {
                    interval: interval,
                    day: startDate.format('D'),
                });

        case 'DAILY':
            return gettext('Every {{interval}} day(s) ', {interval: interval});

        case 'WEEKLY':
            return gettext('Every {{interval}} week(s) ', {interval: interval});
        }
    };

    const getEnds = () => {
        if (endRepeatMode === 'until' && moment.isMoment(until)) {
            const localUntil = timeUtils.getDateInRemoteTimeZone(until, timeUtils.localTimeZone());
            let timezoneString = timeUtils.getTimeZoneAbbreviation(localUntil.format('z'));
            let untilText = gettext(
                'until {{until}} ',
                {until: localUntil ? `${timezoneString} ${localUntil.format('D MMM YYYY')}` : ' '}
            );

            if (timeUtils.isEventInDifferentTimeZone({dates: schedule})) {
                const remoteUntil = timeUtils.getDateInRemoteTimeZone(until, schedule.tz);

                timezoneString = timeUtils.getTimeZoneAbbreviation(remoteUntil.format('z'));
                untilText = untilText + `(${timezoneString} ${remoteUntil.format('D MMM YYYY')})`;
            }
            return untilText;
        }

        if (endRepeatMode === 'count') {
            return count ? gettext('for {{ repeatCount }} repeats ', {repeatCount: count}) : gettext('for ');
        }

        return '';
    };

    const getDays = () => {
        if (frequency !== 'WEEKLY') {
            return '';
        }

        if (weekdays) {
            return gettext('on week days');
        }
        if (allWeek) {
            return gettext('on all week (including weekends)');
        }
        let byDays = '';

        if (byDay && byDay.length > 0) {
            byDays = byDay;
        } else if (startDate) {
            byDays = startDate.format('dd').toUpperCase();
        }
        if (byDays) {
            const days = {
                MO: gettext('Monday'),
                TU: gettext('Tuesday'),
                WE: gettext('Wednesday'),
                TH: gettext('Thursday'),
                FR: gettext('Friday'),
                SA: gettext('Saturday'),
                SU: gettext('Sunday'),
            };
            let dayNames = [];

            byDays.split(' ').forEach((day) => {
                dayNames.push(days[day]);
            });
            return (gettext('on') + ' ' + dayNames.join(', '));
        }

        return '';
    };

    return getFrequency() + getEnds() + getDays();
};

const eventsDatesSame = (event1, event2, granularity = TIME_COMPARISON_GRANULARITY.MILLISECOND) => {
    const pickField = (value, key) => (key !== 'until');
    const nonMomentFieldsEqual = isEqual(
        pickBy(get(event1, 'dates.recurring_rule'), pickField),
        pickBy(get(event2, 'dates.recurring_rule'), pickField));
    const eventsDateFieldsEqual = (path) => {
        const val1 = get(event1, path);
        const val2 = get(event2, path);

        if (moment.isMoment(val1) || moment.isMoment(val2)) {
            return moment.isMoment(val1) ? val1.isSame(val2, granularity) : val2.isSame(val1, granularity);
        }

        return isEqual(val1, val2);
    };

    if (!eventsDateFieldsEqual('dates.start')) {
        return false;
    }

    if (!eventsDateFieldsEqual('dates.end')) {
        return false;
    }

    if (!eventsDateFieldsEqual('dates.recurring_rule.until')) {
        return false;
    }

    return nonMomentFieldsEqual;
};

const eventHasPostedPlannings = (event) => {
    let hasPosteditem = false;

    get(event, '_relatedPlannings', []).forEach((p) => {
        if (POST_STATE.USABLE === p.pubstatus) {
            hasPosteditem = true;
        }
    });

    return hasPosteditem;
};

const fillEventTime = (event) => {
    if (!get(event, TO_BE_CONFIRMED_FIELD) && get(event, 'dates')) {
        event._startTime = event.dates.start;
        event._endTime = event.dates.end;
    } else {
        event._startTime = null;
        event._endTime = null;
    }
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
    canCancelEvent,
    eventHasPlanning,
    isEventInUse,
    canRescheduleEvent,
    canPostponeEvent,
    canUpdateEventTime,
    canConvertToRecurringEvent,
    canUpdateEventRepetitions,
    isEventLocked,
    isEventLockRestricted,
    isEventSameDay,
    isEventRecurring,
    getDateStringForEvent,
    getEventActions,
    getEventActionsForUiFrameworkMenu,
    getEventsByDate,
    duplicateEvent,
    shouldLockEventForEdit,
    getSingleDayPlanningActions,
    getMultiDayPlanningActions,
    generateMultiDayPlanningActions,
    modifyForClient,
    modifyEventsForClient,
    modifyForServer,
    defaultEventValues,
    shouldFetchFilesForEvent,
    getRepeatSummaryForEvent,
    eventsDatesSame,
    eventHasPostedPlannings,
    getFlattenedEventsByDate,
    isEventCompleted,
    fillEventTime,
};

export default self;
