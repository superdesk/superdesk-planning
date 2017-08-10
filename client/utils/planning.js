import moment from 'moment-timezone'
import { getItemState } from './index'
import { WORKFLOW_STATE } from '../constants/index'
import { get } from 'lodash'

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

const self = {
    canSavePlanning,
    canPublishPlanning,
    canUnpublishPlanning,
    canEditPlanning,
    mapCoverageByDate,
}

export default self
