import moment from 'moment-timezone'
import { WORKFLOW_STATE, GENERIC_ITEM_ACTIONS, PRIVILEGES } from '../constants/index'
import { get } from 'lodash'
import {
    getItemState,
    isItemLockRestricted,
    isItemPublic,
    isItemSpiked,
} from './index'

const canSavePlanning = (planning, event) => (
    getItemState(planning) !== WORKFLOW_STATE.SPIKED &&
        getItemState(event) !== WORKFLOW_STATE.SPIKED
)

const canPublishPlanning = (planning, event) => {
    const planState = getItemState(planning)
    const eventState = getItemState(event)
    return (planState === WORKFLOW_STATE.IN_PROGRESS || planState === WORKFLOW_STATE.KILLED) &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canUnpublishPlanning = (planning, event) => {
    const planState = getItemState(planning)
    const eventState = getItemState(event)
    return planState === WORKFLOW_STATE.PUBLISHED &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canEditPlanning = (
    planning,
    event,
    planningManagementPrivilege,
    lockedInThisSession,
    lockedUser
) => (
    getItemState(planning) !== WORKFLOW_STATE.SPIKED &&
        getItemState(event) !== WORKFLOW_STATE.SPIKED &&
        planningManagementPrivilege &&
        !lockedInThisSession &&
        !lockedUser
)

const canSpikePlanning = ({ plan, session, privileges }) => (
    !isItemPublic(plan) && getItemState(plan) === WORKFLOW_STATE.IN_PROGRESS &&
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
        }

        if (get(c, 'planning.scheduled')) {
            const isAfter = moment(get(c, 'planning.scheduled')).isAfter(moment())
            coverage.iconColor = isAfter ? 'icon--green' : 'icon--red'
        }

        return coverage
    })
)

export const getPlanningItemActions = ({ plan, event=null, session, privileges, callBacks }) => {
    let itemActions = []
    Object.keys(GENERIC_ITEM_ACTIONS).forEach((a) => {
        const action = GENERIC_ITEM_ACTIONS[a]
        switch (action.label) {
            case GENERIC_ITEM_ACTIONS.SPIKE.label:
                if (callBacks[GENERIC_ITEM_ACTIONS.SPIKE.label] &&
                        canSpikePlanning({
                            plan,
                            session,
                            privileges,
                        })) {
                    itemActions.push({
                        ...action,
                        callback: callBacks[GENERIC_ITEM_ACTIONS.SPIKE.label],
                    })
                }

                break

            case GENERIC_ITEM_ACTIONS.UNSPIKE.label:
                if (callBacks[GENERIC_ITEM_ACTIONS.UNSPIKE.label] &&
                        canUnspikePlanning({
                            plan,
                            event,
                            privileges,
                        })) {
                    itemActions.push({
                        ...action,
                        callback: callBacks[GENERIC_ITEM_ACTIONS.UNSPIKE.label],
                    })
                }

                break

            case GENERIC_ITEM_ACTIONS.DUPLICATE.label:
                if (callBacks[GENERIC_ITEM_ACTIONS.DUPLICATE.label] &&
                        canDuplicatePlanning({
                            plan,
                            event,
                            session,
                            privileges,
                        })) {
                    itemActions.push({
                        ...action,
                        callback: callBacks[GENERIC_ITEM_ACTIONS.DUPLICATE.label],
                    })
                }

                break

            case GENERIC_ITEM_ACTIONS.HISTORY.label:
                if (callBacks[GENERIC_ITEM_ACTIONS.HISTORY.label]) {
                    itemActions.push({
                        ...action,
                        callback: callBacks[GENERIC_ITEM_ACTIONS.HISTORY.label],
                    })
                }

                break
        }
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
