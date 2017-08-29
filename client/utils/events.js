import { PRIVILEGES, WORKFLOW_STATE, PUBLISHED_STATE, EVENTS,
    GENERIC_ITEM_ACTIONS } from '../constants'
import {
    isItemLockRestricted,
    getItemState,
    isItemSpiked,
    isItemPublic,
    getPublishedState,
    isItemCancelled,
    isItemRescheduled,
} from './index'
import moment from 'moment'
import RRule from 'rrule'
import { get } from 'lodash'
import { actionTypes } from 'redux-form'
import { EventUpdateMethods } from '../components/fields'

/**
 * Helper function to determine if the starting and ending dates
 * occupy entire day(s)
 * @param {moment} startingDate - A moment instance for the starting date/time
 * @param {moment} endingDate - A moment instance for the starting date/time
 * @return {boolean} If the date/times occupy entire day(s)
 */
const isEventAllDay = (startingDate, endingDate) => {
    startingDate = moment(startingDate).clone()
    endingDate = moment(endingDate).clone()

    return startingDate.isSame(startingDate.clone().startOf('day')) &&
        endingDate.isSame(endingDate.clone().endOf('day').seconds(0).milliseconds(0))
}

const eventHasPlanning = (event) => get(event, 'has_planning')

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
        !('frequency' in recurringRule) || !('interval' in recurringRule)) return false

    const freqMap = {
        YEARLY: RRule.YEARLY,
        MONTHLY: RRule.MONTHLY,
        WEEKLY: RRule.WEEKLY,
        DAILY: RRule.DAILY,
    }

    const dayMap = {
        MO: RRule.MO,
        TU: RRule.TU,
        WE: RRule.WE,
        TH: RRule.TH,
        FR: RRule.FR,
        SA: RRule.SA,
        SU: RRule.SU,
    }

    const rules = {
        freq: freqMap[recurringRule.frequency],
        interval: parseInt(recurringRule.interval) || 1,
        dtstart: startingDate.toDate(),
        count: 2,
    }

    if ('byday' in recurringRule) {
        rules.byweekday = recurringRule.byday.split(' ').map((day) => dayMap[day])
    }

    const rule = new RRule(rules)

    let nextEvent = moment(rule.after(startingDate.toDate()))
    return nextEvent.isBetween(startingDate, endingDate) || nextEvent.isSame(endingDate)
}

const getRelatedEventsForRecurringEvent = (state={}, action) => {
    if (action.type !== actionTypes.CHANGE ||
        (get(action, 'meta.form', '') !== 'updateEventConfirmation' &&
        get(action, 'meta.form', '') !== 'updateTime')) {
        return state
    }

    let event = state.values
    let eventsInSeries = get(event, '_recurring', [])
    let events = []

    switch (action.payload.value) {
        case EventUpdateMethods[1].value: // Selected & Future Events
            events = eventsInSeries.filter((e) => (
                moment(e.dates.start).isSameOrAfter(moment(event.dates.start)) &&
                e._id !== event._id
            ))
            break
        case EventUpdateMethods[2].value: // All Events
            events = eventsInSeries.filter((e) => e._id !== event._id)
            break
        case EventUpdateMethods[0].value: // Selected Event Only
        default:
            break
    }

    return {
        ...state,
        values: {
            ...state.values,
            _events: events,
        },
    }
}

const canSpikeEvent = (event, session, privileges) => (
    !isItemPublic(event) && getItemState(event) === WORKFLOW_STATE.IN_PROGRESS &&
        !!privileges[PRIVILEGES.SPIKE_EVENT] && !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemLockRestricted(event, session)
)

const canUnspikeEvent = (event, privileges) => (
    isItemSpiked(event) && !!privileges[PRIVILEGES.UNSPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

const canDuplicateEvent = (event, session, privileges) => (
    canEditEvent(event, session, privileges)
)

const canCreatePlanningFromEvent = (event, session, privileges) => (
    !isItemSpiked(event) && !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemLockRestricted(event, session) && !isItemCancelled(event) &&
        !isItemRescheduled(event)
)

const canPublishEvent = (event, session, privileges) => (
    !isItemSpiked(event) && getPublishedState(event) !== PUBLISHED_STATE.USABLE &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemLockRestricted(event, session) &&
        !isItemCancelled(event) && !isItemRescheduled(event)
)

const canUnpublishEvent = (event, privileges) => (
    getItemState(event) === WORKFLOW_STATE.PUBLISHED && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

const canCancelEvent = (event, session, privileges) => (
    event && !isItemSpiked(event) && !isItemCancelled(event) && isEventInUse(event) &&
        !isItemLockRestricted(event, session) && !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
         !isItemRescheduled(event)
)

const isEventInUse = (event) => (
    event && eventHasPlanning(event) || isItemPublic(event)
)

const canConvertToRecurringEvent = (event, session, privileges) => (
    !event.recurrence_id && canEditEvent(event, session, privileges)
)

const canEditEvent = (event, session, privileges) => (
    !isItemSpiked(event) && !isItemCancelled(event) && !isItemLockRestricted(event, session) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemRescheduled(event)
)

const canRescheduleEvent = (event, session, privileges) => (
    !isItemSpiked(event) && !isItemCancelled(event) && !isItemLockRestricted(event, session) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemRescheduled(event)
)

const getEventItemActions = (event, session, privileges, actions) => {
    let itemActions = []
    let key = 1

    const actionsValidator = {
        [GENERIC_ITEM_ACTIONS.SPIKE.label]: (event, session=null, privileges=null) =>
            canSpikeEvent(event, session, privileges),
        [GENERIC_ITEM_ACTIONS.UNSPIKE.label]: (event, session=null, privileges=null) =>
            canUnspikeEvent(event, privileges),
        [GENERIC_ITEM_ACTIONS.DUPLICATE.label]: (event, session=null, privileges=null) =>
            canDuplicateEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: (event, session=null, privileges=null) =>
            canCancelEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label]: (event, session=null, privileges=null) =>
            canCreatePlanningFromEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: (event, session=null, privileges=null) =>
            canEditEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: (event, session=null, privileges=null) =>
            canRescheduleEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: (event, session=null, privileges=null) =>
            canConvertToRecurringEvent(event, session, privileges),
    }

    actions.forEach((action) => {
        if (actionsValidator[action.label] &&
                !actionsValidator[action.label](event, session, privileges)) {
            return
        }

        itemActions.push({
            ...action,
            key: `${action.label}-${key}`,
        })

        key++
    })

    return itemActions
}

const isEventAssociatedWithPlannings = (eventId, allPlannings) => (
    Object.keys(allPlannings)
        .filter((pid) => get(allPlannings[pid], 'event_item', null) === eventId).length > 0
)

const self = {
    isEventAllDay,
    doesRecurringEventsOverlap,
    getRelatedEventsForRecurringEvent,
    canSpikeEvent,
    canUnspikeEvent,
    canCreatePlanningFromEvent,
    canPublishEvent,
    canUnpublishEvent,
    canEditEvent,
    getEventItemActions,
    isEventAssociatedWithPlannings,
    canCancelEvent,
    eventHasPlanning,
    isEventInUse,
    canRescheduleEvent,
}

export default self
