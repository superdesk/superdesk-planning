import { isItemLockRestricted, getItemState } from './index'
import { ITEM_STATE, PRIVILEGES, EVENTS } from '../constants'
import moment from 'moment'
import RRule from 'rrule'

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
    getItemState(event) === ITEM_STATE.ACTIVE && !!privileges[PRIVILEGES.SPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemLockRestricted(event, session)
)

const canUnspikeEvent = (event, privileges) => (
    getItemState(event) === ITEM_STATE.SPIKED && !!privileges[PRIVILEGES.UNSPIKE_EVENT] &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
)

const canDuplicateEvent = (event, session, privileges) => (
    getItemState(event) !== ITEM_STATE.SPIKED && !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !isItemLockRestricted(event, session)
)

const canCreatePlanningFromEvent = (event, session, privileges) => (
    getItemState(event) !== ITEM_STATE.SPIKED && !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemLockRestricted(event, session)
)

const canPublishEvent = (event, session, privileges) => {
    const eventState = getItemState(event)
    return eventState !== ITEM_STATE.SPIKED && eventState !== EVENTS.STATE.PUBLISHED &&
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] && !isItemLockRestricted(event, session)
}

const canUnpublishEvent = (event, privileges) => (
    getItemState(event) === EVENTS.STATE.PUBLISHED && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]
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
}

export default self
