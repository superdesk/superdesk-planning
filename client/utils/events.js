import { PRIVILEGES, WORKFLOW_STATE, PUBLISHED_STATE, EVENTS,
    GENERIC_ITEM_ACTIONS } from '../constants'
import {
    isItemLockRestricted,
    getItemState,
    isItemSpiked,
    isItemPublic,
    getPublishedState,
    isItemCancelled,
} from './index'
import moment from 'moment'
import RRule from 'rrule'
import { get } from 'lodash'

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
    !isItemSpiked(event) && !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemLockRestricted(event, session)
)

const canCreatePlanningFromEvent = (event, session, privileges) => (
    !isItemSpiked(event) && !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemLockRestricted(event, session) && !isItemCancelled(event)
)

const canPublishEvent = (event, session, privileges) => (
    !isItemSpiked(event) && getPublishedState(event) !== PUBLISHED_STATE.USABLE &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemLockRestricted(event, session) &&
        !isItemCancelled(event)
)

const canUnpublishEvent = (event, privileges) => (
    getItemState(event) === WORKFLOW_STATE.PUBLISHED && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

const canCancelEvent = (event, session, privileges) => (
    event && !isItemSpiked(event) && !isItemCancelled(event) && isEventInUse(event) &&
        !isItemLockRestricted(event, session) && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

const isEventInUse = (event) => (
    event && eventHasPlanning(event) || isItemPublic(event)
)

const canEditEvent = (event, session, privileges) => (
    !isItemSpiked(event) && !isItemCancelled(event) && !isItemLockRestricted(event, session) &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

/*eslint-disable complexity*/
const getEventItemActions = (event, session, privileges, actions) => {
    let itemActions = []
    let key = 1

    actions.forEach((action) => {
        switch (action.label) {
            case GENERIC_ITEM_ACTIONS.SPIKE.label:
                if (!canSpikeEvent(event, session, privileges))
                    return

                break

            case GENERIC_ITEM_ACTIONS.UNSPIKE.label:
                if (!canUnspikeEvent(event, privileges))
                    return

                break

            case GENERIC_ITEM_ACTIONS.DUPLICATE.label:
                if (!canDuplicateEvent(event, session, privileges))
                    return

                break

            case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label:
                if (!canCancelEvent(event, session, privileges))
                    return

                break

            case EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label:
                if (!canCreatePlanningFromEvent(event, session, privileges))
                    return

                break
        }

        itemActions.push({
            ...action,
            key: `${action.label}-${key}`,
        })

        key++
    })

    return itemActions
}
/*eslint-enable complexity*/

const isEventAssociatedWithPlannings = (eventId, allPlannings) => (
    Object.keys(allPlannings)
        .filter((pid) => get(allPlannings[pid], 'event_item', null) === eventId).length > 0
)

const self = {
    isEventAllDay,
    doesRecurringEventsOverlap,
    canSpikeEvent,
    canUnspikeEvent,
    canCreatePlanningFromEvent,
    canPublishEvent,
    canUnpublishEvent,
    canDuplicateEvent,
    getEventItemActions,
    isEventAssociatedWithPlannings,
    canCancelEvent,
    eventHasPlanning,
    isEventInUse,
    canEditEvent,
}

export default self
