import moment from 'moment-timezone';
import {
    WORKFLOW_STATE,
    GENERIC_ITEM_ACTIONS,
    PRIVILEGES,
    EVENTS,
    PLANNING,
    ASSIGNMENTS,
    PUBLISHED_STATE,
    COVERAGES,
} from '../constants/index';
import {get, isNil, uniq, sortBy, isEmpty, cloneDeep} from 'lodash';
import {
    getItemWorkflowState,
    lockUtils,
    isItemPublic,
    isItemSpiked,
    isItemRescheduled,
    eventUtils,
    isItemCancelled,
    getPublishedState,
    isEmptyActions,
} from './index';

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
        !isItemRescheduled(event) &&
        !isNotForPublication(planning)
);

const canUnpublishPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PUBLISH_PLANNING] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPublishedState(planning) === PUBLISHED_STATE.USABLE
);

const canEditPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !isItemRescheduled(planning)
);

const canUpdatePlanning = (planning, event, session, privileges, locks) => (
    canEditPlanning(planning, event, session, privileges, locks) &&
        isItemPublic(planning) &&
        !!privileges[PRIVILEGES.PUBLISH_PLANNING]
);

const canSpikePlanning = (plan, session, privileges, locks) => (
    !isItemPublic(plan) &&
        getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(plan, session, locks)
);

const canUnspikePlanning = (plan, event = null, privileges) => (
    isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(event)
);

const canDuplicatePlanning = (plan, event = null, session, privileges, locks) => (
    !isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !self.isPlanningLockRestricted(plan, session, locks) &&
        !isItemSpiked(event)
);

const canCancelPlanning = (planning, event = null, session, privileges, locks) => {
    const planState = getItemWorkflowState(planning);
    const eventState = getItemWorkflowState(event);

    return !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        planState === WORKFLOW_STATE.SCHEDULED &&
        eventState !== WORKFLOW_STATE.SPIKED;
};

const canCancelAllCoverage = (planning, event = null, session, privileges, locks) => {
    const eventState = getItemWorkflowState(event);

    return !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        eventState !== WORKFLOW_STATE.SPIKED &&
        canCancelAllCoverageForPlanning(planning);
};

const isCoverageCancelled = (coverage) =>
    (get(coverage, 'news_coverage_status.qcode') === 'ncostat:notint');

const canCancelCoverage = (coverage) =>
    (!isCoverageCancelled(coverage) && (!get(coverage, 'assigned_to.state') ||
        get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED));

const canCancelAllCoverageForPlanning = (planning) => (
    get(planning, 'coverages.length') > 0 && get(planning, 'coverages')
        .filter((c) => canCancelCoverage(c)).length > 0
);

const isPlanningLocked = (plan, locks) =>
    !isNil(plan) && (
        plan._id in locks.planning ||
        get(plan, 'event_item') in locks.events ||
        get(plan, 'recurrence_id') in locks.recurring
    );

const isPlanningLockRestricted = (plan, session, locks) =>
    isPlanningLocked(plan, locks) &&
        !lockUtils.isItemLockedInThisSession(plan, session);

/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
export const mapCoverageByDate = (coverages = []) => (
    coverages.map((c) => {
        let coverage = {
            ...c,
            g2_content_type: c.planning.g2_content_type || '',
            iconColor: '',
            assigned_to: get(c, 'assigned_to'),
        };

        if (get(c, 'planning.scheduled')) {
            const isAfter = moment(get(c, 'planning.scheduled')).isAfter(moment());

            coverage.iconColor = isAfter ? 'icon--green' : 'icon--red';
        }

        return coverage;
    })
);

// ad hoc plan created directly from planning list and not from an event
const isPlanAdHoc = (plan) => !get(plan, 'event_item');

const isPlanMultiDay = (plan) => {
    const coverages = get(plan, 'coverages', []);

    if (coverages.length > 0) {
        const days = uniq(coverages
            .map((coverage) => get(coverage, 'planning.scheduled'))
            .filter((schedule) => schedule)
            .map((schedule) => moment(schedule).format('YYYY-MM-DD')));

        return days.length > 1;
    }

    return false;
};

export const isNotForPublication = (plan) => get(plan, 'flags.marked_for_not_publication', false);

export const getPlanningItemActions = (plan, event = null, session, privileges, actions, locks) => {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [PLANNING.ITEM_ACTIONS.SPIKE.label]: () =>
            canSpikePlanning(plan, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.UNSPIKE.label]: () =>
            canUnspikePlanning(plan, event, privileges),
        [PLANNING.ITEM_ACTIONS.DUPLICATE.label]: () =>
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
    };

    actions.forEach((action) => {
        if (actionsValidator[action.label] && !actionsValidator[action.label]()) {
            return;
        }

        switch (action.label) {
        case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label:
            action.label = 'Cancel Event';
            break;

        case EVENTS.ITEM_ACTIONS.UPDATE_TIME.label:
            action.label = 'Update Event Time';
            break;

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label:
            action.label = 'Reschedule Event';
            break;
        case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label:
            action.label = 'Mark Event as Postponed';
            break;
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

const getPlanningActions = (item, event, session, privileges, lockedItems, callBacks) => {
    if (!get(item, '_id')) {
        return [];
    }

    let actions = [];
    let eventActions = [GENERIC_ITEM_ACTIONS.DIVIDER];

    Object.keys(callBacks).forEach((callBackName) => {
        switch (callBackName) {
        case PLANNING.ITEM_ACTIONS.DUPLICATE.actionName:
            actions.push({
                ...PLANNING.ITEM_ACTIONS.DUPLICATE,
                callback: callBacks[callBackName].bind(null, item)
            });
            break;

        case PLANNING.ITEM_ACTIONS.SPIKE.actionName:
            actions.push({
                ...PLANNING.ITEM_ACTIONS.SPIKE,
                callback: callBacks[callBackName].bind(null, item)
            });
            break;

        case PLANNING.ITEM_ACTIONS.UNSPIKE.actionName:
            actions.push({
                ...PLANNING.ITEM_ACTIONS.UNSPIKE,
                callback: callBacks[callBackName].bind(null, item)
            });
            break;

        case PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName:
            actions.push({
                ...PLANNING.ITEM_ACTIONS.CANCEL_PLANNING,
                callback: callBacks[callBackName].bind(null, item)
            });
            break;

        case PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName:
            actions.push({
                ...PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE,
                callback: callBacks[callBackName].bind(null, item)
            });
            break;

        case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName:
            eventActions.push({
                ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                callback: callBacks[callBackName].bind(null, event)
            });
            break;

        case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName:
            eventActions.push({
                ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                callback: callBacks[callBackName].bind(null, event)
            });
            break;

        case EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName:
            eventActions.push({
                ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                callback: callBacks[callBackName].bind(null, event)
            });
            break;

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName:
            eventActions.push({
                ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                callback: callBacks[callBackName].bind(null, event)
            });
            break;

        case EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName:
            eventActions.push({
                ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                callback: callBacks[callBackName].bind(null, event)
            });
            break;
        }
    });

    if (eventActions.length > 1) {
        actions.push(...eventActions);
    }

    return getPlanningItemActions(
        item,
        event,
        session,
        privileges,
        actions,
        lockedItems
    );
};

/**
 * Utility to convert a genre from an Array to an Object
 * @param {object} plan - The planning item to modify it's coverages
 * @return {object} planning item provided
 */
export const convertCoveragesGenreToObject = (plan) => {
    get(plan, 'coverages', []).forEach(convertGenreToObject);
    return plan;
};

/**
 * Utility to convert genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
export const convertGenreToObject = (coverage) => {
    // Make sure the coverage has a planning field
    if (!('planning' in coverage)) coverage.planning = {};

    // Convert genre from an Array to an Object
    coverage.planning.genre = get(coverage, 'planning.genre[0]');

    return coverage;
};

const canEditCoverage = (coverage) => (
    !isCoverageCancelled(coverage) &&
    get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED
);

const createCoverageFromNewsItem = (addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes) => {
    let newCoverage = COVERAGES.DEFAULT_VALUE(newsCoverageStatus);

    // Add fields from news item to the coverage
    const contentType = contentTypes.find(
        (ctype) => get(ctype, 'content item type') === addNewsItemToPlanning.type
    );

    newCoverage.planning = {
        g2_content_type: get(contentType, 'qcode', PLANNING.G2_CONTENT_TYPE.TEXT),
        slugline: get(addNewsItemToPlanning, 'slugline', ''),
        ednote: get(addNewsItemToPlanning, 'ednote', ''),
    };

    if (get(addNewsItemToPlanning, 'genre')) {
        newCoverage.planning.genre = addNewsItemToPlanning.genre;
        self.convertGenreToObject(newCoverage);
    }

    // Add assignment to coverage
    if (get(addNewsItemToPlanning, 'state') === 'published') {
        newCoverage.planning.scheduled = addNewsItemToPlanning._updated;
        newCoverage.assigned_to = {
            desk: addNewsItemToPlanning.task.desk,
            user: addNewsItemToPlanning.task.user,
        };
    } else {
        newCoverage.planning.scheduled = moment().endOf('day');
        newCoverage.assigned_to = {
            desk: desk,
            user: user,
        };
    }

    newCoverage.assigned_to.priority = ASSIGNMENTS.DEFAULT_PRIORITY;
    return newCoverage;
};

const getCoverageReadOnlyFields = (
    readOnly,
    newsCoverageStatus,
    hasAssignment,
    existingCoverage,
    assignmentState
) => {
    const isCancelled = get(newsCoverageStatus, 'qcode') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode;

    // State is either derived from the Assignment state or if the coverage is cancelled
    let state = null;

    if (hasAssignment) {
        state = assignmentState;
    } else if (isCancelled) {
        state = ASSIGNMENTS.WORKFLOW_STATE.CANCELLED;
    }

    switch (state) {
    case ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED:
        return {
            slugline: readOnly,
            ednote: readOnly,
            keyword: readOnly,
            internal_note: readOnly,
            g2_content_type: true,
            genre: readOnly,
            newsCoverageStatus: true,
            scheduled: readOnly,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS:
    case ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED:
        return {
            slugline: readOnly,
            ednote: true,
            keyword: true,
            internal_note: readOnly,
            g2_content_type: true,
            genre: true,
            newsCoverageStatus: true,
            scheduled: readOnly,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.COMPLETED:
        return {
            slugline: readOnly,
            ednote: readOnly,
            keyword: readOnly,
            internal_note: readOnly,
            g2_content_type: true,
            genre: true,
            newsCoverageStatus: true,
            scheduled: readOnly,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.CANCELLED:
        return {
            slugline: true,
            ednote: true,
            keyword: true,
            internal_note: true,
            g2_content_type: true,
            genre: true,
            newsCoverageStatus: true,
            scheduled: true,
        };
    case null:
    default:
        return {
            slugline: readOnly,
            ednote: readOnly,
            keyword: readOnly,
            internal_note: readOnly,
            g2_content_type: readOnly,
            genre: readOnly,
            newsCoverageStatus: readOnly || hasAssignment,
            scheduled: readOnly,
        };
    }
};

const getPlanningByDate = (plansInList, events) => {
    if (!plansInList) return [];

    const days = {};

    plansInList.forEach((plan) => {
        const dates = {};
        let groupDate = null;

        plan.event = get(events, get(plan, 'event_item'));
        plan.coverages.forEach((coverage) => {
            groupDate = moment(get(coverage, 'planning.scheduled', plan._planning_date));

            if (!get(dates, groupDate.format('YYYY-MM-DD'))) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
        });

        if (isEmpty(dates)) {
            groupDate = moment(plan._planning_date);
            dates[groupDate.format('YYYY-MM-DD')] = groupDate;
        }

        for (let date in dates) {
            if (!days[date]) {
                days[date] = [];
            }

            const clonedPlan = cloneDeep(plan);

            clonedPlan._sortDate = dates[date];
            days[date].push(clonedPlan);
        }
    });

    let sortable = [];

    for (let day in days)
        sortable.push({
            date: day,
            events: sortBy(days[day], [(e) => e._sortDate]),
        });

    return sortBy(sortable, [(e) => e.date]);
};

const isLockedForAddToPlanning = (item) => get(item, 'lock_action') ===
    PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action;

// eslint-disable-next-line consistent-this
const self = {
    canSpikePlanning,
    canUnspikePlanning,
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
    canCancelCoverage,
    canEditCoverage,
    getCoverageReadOnlyFields,
    isPlanMultiDay,
    getPlanningActions,
    isNotForPublication,
    getPlanningByDate,
    createCoverageFromNewsItem,
    isLockedForAddToPlanning,
};

export default self;
