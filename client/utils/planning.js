import moment from 'moment-timezone'
import {
    WORKFLOW_STATE,
    GENERIC_ITEM_ACTIONS,
    PRIVILEGES,
    EVENTS,
    PLANNING,
    ASSIGNMENTS,
    PUBLISHED_STATE,
} from '../constants/index'
import { get, isNil } from 'lodash'
import {
    getItemWorkflowState,
    isItemLockedInThisSession,
    isItemPublic,
    isItemSpiked,
    isItemRescheduled,
    eventUtils,
    isItemCancelled,
    getPublishedState,
} from './index'

const canPublishPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PUBLISH_PLANNING] &&
        !!get(planning, '_id') &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPublishedState(planning) !== PUBLISHED_STATE.USABLE &&
        (isNil(event) || getPublishedState(event) === PUBLISHED_STATE.USABLE) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(planning) &&
        !isItemRescheduled(event)
)

const canUnpublishPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PUBLISH_PLANNING] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPublishedState(planning) === PUBLISHED_STATE.USABLE
)

const canEditPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !isItemRescheduled(planning)
)

const canUpdatePlanning = (planning, event, session, privileges, locks) => (
    canEditPlanning(planning, event, session, privileges, locks) &&
        isItemPublic(planning) &&
        !!privileges[PRIVILEGES.PUBLISH_PLANNING]
)

const canSpikePlanning = (plan, session, privileges, locks) => (
    !isItemPublic(plan) &&
        getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(plan, session, locks)
)

const canUnspikePlanning = (plan, event=null, privileges) => (
    isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(event)
)

const canDuplicatePlanning = (plan, event=null, session, privileges, locks) => (
    !isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !self.isPlanningLockRestricted(plan, session, locks) &&
        !isItemSpiked(event)
)

const canCancelPlanning = (planning, event=null, session, privileges, locks) => {
    const planState = getItemWorkflowState(planning)
    const eventState = getItemWorkflowState(event)
    return !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        planState === WORKFLOW_STATE.SCHEDULED &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canCancelAllCoverage = (planning, event=null, session, privileges, locks) => {
    const eventState = getItemWorkflowState(event)
    return !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        eventState !== WORKFLOW_STATE.SPIKED &&
        !isAllCoverageCancelled(planning)
}

const isCoverageCancelled = (coverage) =>
    (get(coverage, 'news_coverage_status.qcode') === 'ncostat:notint')

const isAllCoverageCancelled = (planning) => (
    get(planning, 'coverages', [])
        .filter((c) => !isCoverageCancelled(c))
        .length === 0
)

const isPlanningLocked = (plan, locks) =>
    !isNil(plan) && (
        plan._id in locks.planning ||
        get(plan, 'event_item') in locks.events ||
        get(plan, 'recurrence_id') in locks.recurring
    )

const isPlanningLockRestricted = (plan, session, locks) =>
    isPlanningLocked(plan, locks) &&
        !isItemLockedInThisSession(plan, session)

/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
export const mapCoverageByDate = (coverages=[]) => (
    coverages.map((c) => {
        let coverage = {
            g2_content_type: c.planning.g2_content_type || '',
            iconColor: '',
            assigned_to: get(c, 'assigned_to'),
        }

        if (get(c, 'planning.scheduled')) {
            const isAfter = moment(get(c, 'planning.scheduled')).isAfter(moment())
            coverage.iconColor = isAfter ? 'icon--green' : 'icon--red'
        }

        return coverage
    })
)

// ad hoc plan created directly from planning list and not from an event
const isPlanAdHoc = (plan) => !get(plan, 'event_item')

export const getPlanningItemActions = (plan, event=null, session, privileges, actions, locks) => {
    let itemActions = []
    let key = 1

    const actionsValidator = {
        [GENERIC_ITEM_ACTIONS.SPIKE.label]: () =>
            canSpikePlanning(plan, session, privileges, locks),
        [GENERIC_ITEM_ACTIONS.UNSPIKE.label]: () =>
            canUnspikePlanning(plan, event, privileges),
        [GENERIC_ITEM_ACTIONS.DUPLICATE.label]: () =>
            canDuplicatePlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label]: () =>
            canCancelPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label]: () =>
            canCancelAllCoverage(plan, event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: () =>
            !isPlanAdHoc(plan) && eventUtils.canCancelEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: () =>
            !isPlanAdHoc(plan) && eventUtils.canUpdateEventTime(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: () =>
            !isPlanAdHoc(plan) && eventUtils.canRescheduleEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: () =>
            !isPlanAdHoc(plan) && eventUtils.canPostponeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: () =>
            !isPlanAdHoc(plan) &&
            eventUtils.canConvertToRecurringEvent(event, session, privileges, locks),
    }

    actions.forEach((action) => {
        if (actionsValidator[action.label] && !actionsValidator[action.label]()) {
            return
        }

        switch (action.label) {
            case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label:
                action.label = 'Cancel Event'
                break

            case EVENTS.ITEM_ACTIONS.UPDATE_TIME.label:
                action.label = 'Update Event Time'
                break

            case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label:
                action.label = 'Reschedule Event'
                break
            case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label:
                action.label = 'Mark Event as Postponed'
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

/**
 * Utility to convert a genre from an Array to an Object
 * @param {object} plan - The planning item to modify it's coverages
 * @return {object} planning item provided
 */
export const convertCoveragesGenreToObject = (plan) => {
    get(plan, 'coverages', []).forEach(convertGenreToObject)
    return plan
}

/**
 * Utility to convert genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
export const convertGenreToObject = (coverage) => {
    // Make sure the coverage has a planning field
    if (!('planning' in coverage)) coverage.planning = {}

    // Convert genre from an Array to an Object
    coverage.planning.genre = get(coverage, 'planning.genre[0]')

    return coverage
}

const canEditCoverage = (coverage) => (
    !isCoverageCancelled(coverage) &&
    get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED
)

const self = {
    canPublishPlanning,
    canUnpublishPlanning,
    canEditPlanning,
    canUpdatePlanning,
    mapCoverageByDate,
    getPlanningItemActions,
    isPlanningLocked,
    isPlanningLockRestricted,
    isPlanAdHoc,
    convertCoveragesGenreToObject,
    convertGenreToObject,
    isCoverageCancelled,
    canEditCoverage,
}

export default self
