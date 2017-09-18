import moment from 'moment-timezone'
import { WORKFLOW_STATE, GENERIC_ITEM_ACTIONS, PRIVILEGES, EVENTS } from '../constants/index'
import { get } from 'lodash'
import {
    getItemWorkflowState,
    isItemLockRestricted,
    isItemPublic,
    isItemSpiked,
    eventUtils,
    isItemCancelled,
} from './index'

const canSavePlanning = (planning, event, privileges) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
    getItemWorkflowState(planning) !== WORKFLOW_STATE.SPIKED &&
    getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED
)

const canPublishPlanning = (planning, event, privileges, session) => {
    const planState = getItemWorkflowState(planning)
    const eventState = getItemWorkflowState(event)
    return !!privileges[PRIVILEGES.PUBLISH_PLANNING] && !isItemLockRestricted(planning, session) &&
        (planState === WORKFLOW_STATE.DRAFT || planState === WORKFLOW_STATE.KILLED) &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canUnpublishPlanning = (planning, event, privileges, session) => {
    const planState = getItemWorkflowState(planning)
    const eventState = getItemWorkflowState(event)
    return !!privileges[PRIVILEGES.PUBLISH_PLANNING] &&
        !isItemLockRestricted(planning, session) && planState === WORKFLOW_STATE.SCHEDULED &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canEditPlanning = (
    planning,
    event,
    privileges,
    lockedInThisSession,
    lockedUser
) => (
    getItemWorkflowState(planning) !== WORKFLOW_STATE.SPIKED &&
        getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockedInThisSession &&
        !lockedUser &&
        !isItemCancelled(planning)
)

const canSpikePlanning = ({ plan, session, privileges }) => (
    !isItemPublic(plan) && getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] && !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemLockRestricted(plan, session)
)

const canUnspikePlanning = ({ plan, event=null, privileges }) => (
    isItemSpiked(plan) && !!privileges[PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] && !isItemSpiked(event)
)

const canDuplicatePlanning = ({ plan, event=null, session, privileges }) => (
    !isItemSpiked(plan) && !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemLockRestricted(plan, session) && !isItemSpiked(event)
)

/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
export const mapCoverageByDate = (coverages) => (
    coverages.map((c) => {
        let coverage = {
            g2_content_type: c.planning.g2_content_type || '',
            iconColor: '',
            planning: {
                assigned_to: {
                    user: get(c, 'planning.assigned_to.user'),
                    desk: get(c, 'planning.assigned_to.desk'),
                },
            },
        }

        if (get(c, 'planning.scheduled')) {
            const isAfter = moment(get(c, 'planning.scheduled')).isAfter(moment())
            coverage.iconColor = isAfter ? 'icon--green' : 'icon--red'
        }

        return coverage
    })
)

export const getPlanningItemActions = ({ plan, event=null, session, privileges, actions }) => {
    let itemActions = []
    let key = 1

    // ad hoc plan created directly from planning list and not from an event
    const isPlanAdHoc = !_.get(plan, 'event_item')

    const actionsValidator = {
        [GENERIC_ITEM_ACTIONS.SPIKE.label]: () => canSpikePlanning({
            plan,
            session,
            privileges,
        }),
        [GENERIC_ITEM_ACTIONS.UNSPIKE.label]: () => canUnspikePlanning({
            plan,
            event,
            privileges,
        }),
        [GENERIC_ITEM_ACTIONS.DUPLICATE.label]: () => canDuplicatePlanning({
            plan,
            event,
            session,
            privileges,
        }),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: () =>
            !isPlanAdHoc && eventUtils.canCancelEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: () =>
            !isPlanAdHoc && eventUtils.canUpdateEventTime(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: () =>
            !isPlanAdHoc && eventUtils.canRescheduleEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: () =>
            !isPlanAdHoc && eventUtils.canPostponeEvent(event, session, privileges),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: () =>
            !isPlanAdHoc && eventUtils.canConvertToRecurringEvent(event, session, privileges),
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

const self = {
    canSavePlanning,
    canPublishPlanning,
    canUnpublishPlanning,
    canEditPlanning,
    mapCoverageByDate,
    getPlanningItemActions,
}

export default self
