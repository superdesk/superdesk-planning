import moment from 'moment-timezone';
import RRule from 'rrule';
import {get, map, isNil, sortBy, cloneDeep, omitBy, find, isEqual, pickBy, flatten} from 'lodash';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';

import {IVocabularyItem} from 'superdesk-api';
import {
    IEventItem,
    ISession,
    ILockedItems,
    IDateTime,
    IPlanningItem,
    IPrivileges,
    IItemAction,
    IPlanningConfig,
    IItemSubActions,
    IEventOccurStatus,
} from '../interfaces';
import {planningApi} from '../superdeskApi';
import {appConfig as config} from 'appConfig';

const appConfig = config as IPlanningConfig;

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
function isEventAllDay(startingDate: IDateTime, endingDate: IDateTime, checkMultiDay: boolean = false): boolean {
    const start = moment(startingDate).clone();
    const end = moment(endingDate).clone();

    return (checkMultiDay || start.isSame(end, 'day')) &&
        start.isSame(start.clone().startOf('day'), 'minute') &&
        end.isSame(end.clone().endOf('day'), 'minute');
}

function isEventSameDay(startingDate: IDateTime, endingDate: IDateTime): boolean {
    return moment(startingDate).format('DD/MM/YYYY') === moment(endingDate).format('DD/MM/YYYY');
}

function eventHasPlanning(event: IEventItem): boolean {
    return get(event, 'planning_ids', []).length > 0;
}

function isEventCompleted(event: IEventItem): boolean {
    return get(event, 'completed');
}

/**
 * Helper function to determine if a recurring event instances overlap
 * Using the RRule library (similar to that the server uses), it coverts the
 * recurring_rule to an RRule instance and determines if instances overlap
 * @param {moment} startingDate - The starting date/time of the selected event
 * @param {moment} endingDate - The ending date/time of the selected event
 * @param {object} recurringRule - The list of recurring rules
 * @returns {boolean} True if the instances overlap, false otherwise
 */
function doesRecurringEventsOverlap(
    startingDate: IDateTime,
    endingDate: IDateTime,
    recurringRule: IEventItem['dates']['recurring_rule']
): boolean {
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
}

function getRelatedEventsForRecurringEvent(
    recurringEvent: IEventItem,
    filter: {name: string, value: string},
    postedPlanningOnly: boolean
): IEventItem & {_events: Array<IEventItem>, _relatedPlannings: Array<IPlanningItem>} {
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
}

function isEventIngested(event: IEventItem): boolean {
    return get(event, 'state', WORKFLOW_STATE.DRAFT) === WORKFLOW_STATE.INGESTED;
}

function canSpikeEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        !isNil(event) &&
        !isItemPosted(event) &&
        (
            getItemWorkflowState(event) === WORKFLOW_STATE.DRAFT ||
            isEventIngested(event) ||
            isItemPostponed(event)
        ) &&
        !!privileges[PRIVILEGES.SPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !get(event, 'reschedule_from') &&
        (
            !isItemExpired(event) ||
            !!privileges[PRIVILEGES.EDIT_EXPIRED]
        )
    );
}

function canUnspikeEvent(event: IEventItem, privileges: IPrivileges): boolean {
    return (
        !isNil(event) &&
        isItemSpiked(event) &&
        !!privileges[PRIVILEGES.UNSPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        (
            !isItemExpired(event) ||
            !!privileges[PRIVILEGES.EDIT_EXPIRED]
        )
    );
}

function canDuplicateEvent(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
    );
}

function canCreatePlanningFromEvent(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(event) &&
        !isItemPostponed(event) &&
        !isItemExpired(event) &&
        !isItemKilled(event)
    );
}

function canPostEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        isExistingItem(event) &&
        !isItemSpiked(event) &&
        getPostedState(event) !== POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.POST_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        (!isItemCancelled(event) || getItemWorkflowState(event) === WORKFLOW_STATE.KILLED) &&
        !isItemRescheduled(event)
    );
}

function canUnpostEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        getPostedState(event) === POST_STATE.USABLE &&
        !!privileges[PRIVILEGES.UNPOST_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemRescheduled(event)
    );
}

function canCancelEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function isEventInUse(event: IEventItem): boolean {
    return !isNil(event) && (
        eventHasPlanning(event) ||
        isItemPublic(event)
    );
}

function canConvertToRecurringEvent(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        !event.recurrence_id &&
        canEditEvent(event, session, privileges, locks) &&
        !isItemPostponed(event) &&
        lockUtils.getLockAction(event, locks) !== 'edit' &&
        !isItemCancelled(event) && !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function canEditEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isItemRescheduled(event) &&
        (
            !isItemExpired(event) ||
            !!privileges[PRIVILEGES.EDIT_EXPIRED]
        )
    );
}

function canUpdateEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        canEditEvent(event, session, privileges, locks) &&
        isItemPublic(event) &&
        !isItemKilled(event) &&
        !!privileges[PRIVILEGES.POST_EVENT]
    );
}

function canUpdateEventTime(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        canEditEvent(event, session, privileges, locks) &&
        !isItemPostponed(event) && !isItemCancelled(event) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function canRescheduleEvent(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemRescheduled(event) &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function canPostponeEvent(event: IEventItem, session: ISession, privileges: IPrivileges, locks: ILockedItems): boolean {
    return (
        !isNil(event) &&
        !isItemSpiked(event) &&
        !isItemCancelled(event) &&
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemPostponed(event) &&
        !isItemRescheduled(event) &&
        !(getPostedState(event) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_EVENT]) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function canUpdateEventRepetitions(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isNil(event) &&
        isEventRecurring(event) &&
        canRescheduleEvent(event, session, privileges, locks) &&
        !isEventCompleted(event) &&
        !isItemExpired(event)
    );
}

function canAssignEventToCalendar(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        canEditEvent(event, session, privileges, locks) &&
        !lockUtils.isItemLocked(event, locks)
    );
}

function canSaveEventAsTemplate(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !lockUtils.isLockRestricted(event, session, locks) &&
        !!privileges[PRIVILEGES.EVENT_TEMPLATES]
    );
}

function canMarkEventAsComplete(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    const currentDate = moment();
    const precondition = [
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.SCHEDULED,
    ].includes(event.state) && canEditEvent(event, session, privileges, locks) &&
    !isEventCompleted(event);

    if (get(event, 'recurrence_id')) {
        // can action on any recurring event from present to future
        return (
            precondition &&
            event.dates.end.isSameOrAfter(currentDate, 'date')
        );
    } else {
        // can action only if event is of current day or current day passes through a multi day event
        return (
            precondition &&
            event.dates.start.isSameOrBefore(currentDate, 'date') &&
            event.dates.end.isSameOrAfter(currentDate, 'date')
        );
    }
}

function getEventItemActions(
    event: IEventItem,
    session: ISession,
    privileges: IPrivileges,
    actions: Array<IItemAction>,
    locks: ILockedItems
): Array<IItemAction> {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: () =>
            canSpikeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: () =>
            canUnspikeEvent(event, privileges),
        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: () =>
            canDuplicateEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: () =>
            canCancelEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: () =>
            canCreatePlanningFromEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]: () =>
            canCreatePlanningFromEvent(event, session, privileges, locks),
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
                !actionsValidator[action.actionName]()) {
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
}

function isEventRecurring(item: IEventItem): boolean {
    return item.recurrence_id != null;
}

function getDateStringForEvent(
    event: IEventItem,
    dateOnly: boolean = false,
    useLocal: boolean = true,
    withTimezone: boolean = true
): string {
    // !! Note - expects event dates as instance of moment() !! //
    const dateFormat = appConfig.planning.dateformat;
    const timeFormat = appConfig.planning.timeformat;
    const start = getStartDate(event);
    const end = getEndDate(event);
    const tz = get(event.dates, 'tz');
    const localStart = timeUtils.getLocalDate(start, tz);
    const isFullDay = event?.dates?.all_day;
    const noEndTime = event?.dates?.no_end_time;
    const multiDay = !start.isSame(end, 'day');

    let dateString, timezoneString = '';

    if (!start || !end) {
        return;
    }

    dateString = getTBCDateString(event, ' @ ', dateOnly);
    if (!dateString) {
        if (!multiDay) {
            if (dateOnly || isFullDay) {
                dateString = start.format(dateFormat);
            } else if (noEndTime) {
                dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false);
            } else {
                dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false) + ' - ' +
                    end.format(timeFormat);
            }
        } else if (dateOnly || isFullDay) {
            dateString = start.format(dateFormat) + ' - ' + end.format(dateFormat);
        } else if (noEndTime) {
            dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false) + ' - ' +
                end.format(dateFormat);
        } else {
            dateString = getDateTimeString(start, dateFormat, timeFormat, ' @ ', false) + ' - ' +
                getDateTimeString(end, dateFormat, timeFormat, ' @ ', false);
        }
    }

    // no timezone info needed
    if (isFullDay || dateOnly) {
        return multiDay ? start.format(dateFormat) + ' - ' + end.format(dateFormat) : start.format(dateFormat);
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
}

function getSingleDayPlanningActions(
    item: IEventItem,
    actions: Array<IItemAction>,
    createPlanning: (event: IEventItem, a2: null, a3: false) => void,
    createAndOpenPlanning: (event: IEventItem, a2: null, a3: true) => void
) {
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
}

function generateMultiDayPlanningActions(
    item: IEventItem,
    subActions: IItemSubActions,
    createPlanning: (event: IEventItem, date: moment.Moment, a3: boolean) => void,
    createAndOpenPlanning: (event: IEventItem, date: moment.Moment, a3: boolean) => void
) {
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
}

function getMultiDayPlanningActions(
    item: IEventItem,
    actions: Array<IItemAction>,
    createPlanning: (event: IEventItem, date: moment.Moment, a3: boolean) => void,
    createAndOpenPlanning: (event: IEventItem, date: moment.Moment, a3: boolean) => void
) {
    // Multi-day event with a requirement of a submenu
    let subActions: IItemSubActions = {
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
}

interface IGetEventActionArgs {
    item: IEventItem;
    session: ISession;
    privileges: IPrivileges;
    lockedItems: ILockedItems;
    callBacks: {[key: string]: (...args: Array<any>) => any};
    withMultiPlanningDate: boolean;
    calendars: Array<IVocabularyItem>;
}

function getEventActions(
    {
        item,
        session,
        privileges,
        lockedItems,
        callBacks,
        withMultiPlanningDate,
        calendars,
    }: IGetEventActionArgs
): Array<IItemAction> {
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
}

function getEventActionsForUiFrameworkMenu(data: IGetEventActionArgs): Array<IMenuItem> {
    return toUIFrameworkInterface(getEventActions(data));
}

/*
 * Groups the events by date
 */
function getFlattenedEventsByDate(events: Array<IEventItem>, startDate: moment.Moment, endDate: moment.Moment) {
    const eventsList = getEventsByDate(events, startDate, endDate);

    return flatten(sortBy(eventsList, [(e) => (e.date)]).map((e) => e.events.map((k) => [e.date, k._id])));
}


const getStartDate = (event: IEventItem) => (
    event.dates?.all_day ? moment.utc(event.dates.start) : moment(event.dates?.start)
);

const getEndDate = (event: IEventItem) => (
    (event.dates?.all_day || event.dates?.no_end_time) ? moment.utc(event.dates.end) : moment(event.dates?.end)
);

const isEventInRange = (
    event: IEventItem,
    eventStart: moment.Moment,
    eventEnd: moment.Moment,
    start: moment.Moment,
    end?: moment.Moment,
) => {
    let localStart = eventStart;
    let localEnd = eventEnd;
    let startUnit : moment.unitOfTime.StartOf = 'second';
    let endUnit : moment.unitOfTime.StartOf = 'second';

    if (event.dates?.all_day) {
        // we have only dates in utc
        localStart = moment(eventStart.format('YYYY-MM-DD'));
        localEnd = moment(eventEnd.format('YYYY-MM-DD'));
        startUnit = 'day';
        endUnit = 'day';
    }

    if (event.dates?.no_end_time) {
        // we have time for start, but only date for end
        localStart = moment(eventStart);
        localEnd = moment(eventEnd.format('YYYY-MM-DD'));
        endUnit = 'day';
    }

    return localEnd.isSameOrAfter(start, endUnit) && (end == null || localStart.isSameOrBefore(end, startUnit));
};


const getStartDate = (event: IEventItem) => (
    event.dates?.all_day ? moment.utc(event.dates.start) : moment(event.dates?.start)
);

const getEndDate = (event: IEventItem) => (
    (event.dates?.all_day || event.dates?.no_end_time) ? moment.utc(event.dates.end) : moment(event.dates?.end)
);

const isEventInRange = (
    event: IEventItem,
    eventStart: moment.Moment,
    eventEnd: moment.Moment,
    start: moment.Moment,
    end?: moment.Moment,
) => {
    let localStart = eventStart;
    let localEnd = eventEnd;
    let startUnit : moment.unitOfTime.StartOf = 'second';
    let endUnit : moment.unitOfTime.StartOf = 'second';

    if (event.dates?.all_day) {
        // we have only dates in utc
        localStart = moment(eventStart.format('YYYY-MM-DD'));
        localEnd = moment(eventEnd.format('YYYY-MM-DD'));
        startUnit = 'day';
        endUnit = 'day';
    }

    if (event.dates?.no_end_time) {
        // we have time for start, but only date for end
        localStart = moment(eventStart);
        localEnd = moment(eventEnd.format('YYYY-MM-DD'));
        endUnit = 'day';
    }

    return localEnd.isSameOrAfter(start, endUnit) && (end == null || localStart.isSameOrBefore(end, startUnit));
};

/*
 * Groups the events by date
 */
function getEventsByDate(
    events: Array<IEventItem>,
    startDate: moment.Moment,
    endDate: moment.Moment
): Array<IEventItem> {
    if ((events?.length ?? 0) === 0) {
        return [];
    }

    // check if search exists
    // order by date
    let sortedEvents = events.sort((a, b) => {
        const startA = getStartDate(a);
        const startB = getStartDate(b);

        return startA.diff(startB);
    });

    const days: {[date: string]: Array<IEventItem>} = {};

    function addEventToDate(event: IEventItem, date?: moment.Moment) {
        let eventDate = date || getStartDate(event);
        let eventStart = getStartDate(event);
        let eventEnd = getEndDate(event);

        if (!eventStart.isSame(eventEnd, 'day') && !event.dates.all_day && !event.dates.no_end_time) {
            eventStart = eventDate;
            eventEnd = eventEnd.isSame(eventDate, 'day') ?
                eventEnd :
                moment(eventDate.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(86399, 'seconds');
        }

        if (!isEventInRange(event, eventDate, eventEnd, startDate, endDate)) {
            return;
        }

        let eventDateFormatted = eventDate.format('YYYY-MM-DD');

        if (!days[eventDateFormatted]) {
            days[eventDateFormatted] = [];
        }

        let evt = cloneDeep(event);

        evt._sortDate = eventStart;
        days[eventDateFormatted].push(evt);
    }

    sortedEvents.forEach((event) => {
        // compute the number of days of the event
        const eventEndDate = event.actioned_date ? moment(event.actioned_date) : getEndDate(event);
        const eventStartDate = getStartDate(event);

        if (!eventStartDate.isSame(eventEndDate, 'day')) {
            let deltaDays = Math.max(Math.ceil(eventEndDate.diff(eventStartDate, 'days', true)), 1);
            // if the event happens during more than one day, add it to every day
            // add the event to the other days

            for (let i = 1; i < deltaDays; i++) {
                // clone the date
                const newDate = moment(eventStartDate.format('YYYY-MM-DD'), 'YYYY-MM-DD', true);

                newDate.add(i, 'days');

                if (newDate.isSameOrBefore(eventEndDate, 'day')) {
                    addEventToDate(event, newDate);
                }
            }
        }

        // add event to its initial starting date
        // add an event only if it's not actioned or actioned after this event's start date
        if (!event.actioned_date || moment(event.actioned_date).isSameOrAfter(eventStartDate, 'date')) {
            addEventToDate(event);
        }
    });

    return sortBasedOnTBC(days);
}

function modifyForClient(event: Partial<IEventItem>): Partial<IEventItem> {
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
}

function modifyEventsForClient(events: Array<IEventItem>): Array<IEventItem> {
    events.forEach(modifyForClient);
    return events;
}

function modifyLocationForServer(event: IEventItem) {
    if (!('location' in event) || Array.isArray(event.location)) {
        return;
    }

    event.location = event.location ?
        [event.location] :
        null;
}

function removeFieldsStartingWith(updates: {[key: string]: Array<any> | any}, prefix: string) {
    Object.keys(updates).forEach((field) => {
        if (!Array.isArray(updates[field])) {
            if (field.startsWith(prefix)) {
                delete updates[field];
            }
        } else {
            updates[field].forEach((arrayEntry) => {
                Object.keys(arrayEntry).forEach((arrayEntryField) => {
                    if (arrayEntryField.startsWith(prefix)) {
                        delete arrayEntry[arrayEntryField];
                    }
                });
            });
        }
    });
}

function modifyForServer(event: IEventItem, removeNullLinks: boolean = false) {
    modifyLocationForServer(event);

    // remove links if it contains only null values
    if (removeNullLinks && get(event, 'links.length', 0) > 0) {
        event.links = event.links.filter(
            (link) => link && get(link, 'length', 0) > 0
        );
    }

    // clean up angular artifacts
    removeFieldsStartingWith(event, '$$');

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
}

function duplicateEvent(event: IEventItem, occurStatus: IEventOccurStatus) {
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
}

export function shouldLockEventForEdit(item: IEventItem, privileges: IPrivileges): boolean {
    return (
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        (
            !isItemPublic(item) ||
            !!privileges[PRIVILEGES.POST_EVENT]
        )
    );
}

function defaultEventValues(
    occurStatuses: IEventOccurStatus,
    defaultCalendars: IEventItem['calendars'],
    defaultPlaceList: IEventItem['place']
): Partial<IEventItem> {
    const {contentProfiles} = planningApi;
    const eventProfile = contentProfiles.get('event');
    const defaultValues = contentProfiles.getDefaultValues(eventProfile) as Partial<IEventItem>;
    const occurStatus = getItemInArrayById(occurStatuses, 'eocstat:eos5', 'qcode') || {
        label: 'Confirmed',
        qcode: 'eocstat:eos5',
        name: 'Planned, occurs certainly',
    };
    const language = contentProfiles.getDefaultLanguage(eventProfile);

    let newEvent: Partial<IEventItem> = Object.assign(
        {
            type: 'event',
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
            language: language,
            languages: [language],
        },
        defaultValues
    );

    if (defaultPlaceList) {
        newEvent.place = defaultPlaceList;
    }

    return newEvent;
}

function shouldFetchFilesForEvent(event?: IEventItem) {
    return (event?.files || [])
        .filter((file) => typeof file === 'string')
        .length > 0;
}

function getRepeatSummaryForEvent(schedule: IEventItem['dates']): string {
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
}

function eventsDatesSame(
    event1: IEventItem,
    event2: IEventItem,
    granularity: string = TIME_COMPARISON_GRANULARITY.MILLISECOND
): boolean {
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
}

function eventHasPostedPlannings(event: IEventItem): boolean {
    let hasPosteditem = false;

    get(event, '_relatedPlannings', []).forEach((p) => {
        if (POST_STATE.USABLE === p.pubstatus) {
            hasPosteditem = true;
        }
    });

    return hasPosteditem;
}

function fillEventTime(event: IEventItem) {
    if (!get(event, TO_BE_CONFIRMED_FIELD) && get(event, 'dates')) {
        event._startTime = event.dates.start;
        event._endTime = event.dates.end;
    } else {
        event._startTime = null;
        event._endTime = null;
    }
}


// eslint-disable-next-line consistent-this
const self = {
    isEventAllDay,
    doesRecurringEventsOverlap,
    getRelatedEventsForRecurringEvent,
    canSpikeEvent,
    canUnspikeEvent,
    canCreatePlanningFromEvent,
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
    getStartDate,
    getEndDate,
};

export default self;
