import moment from 'moment-timezone';
import {
    WORKFLOW_STATE,
    GENERIC_ITEM_ACTIONS,
    PRIVILEGES,
    EVENTS,
    PLANNING,
    ASSIGNMENTS,
    POST_STATE,
    COVERAGES,
    ITEM_TYPE,
} from '../constants/index';
import {get, isNil, uniq, sortBy, isEmpty, cloneDeep, isArray, find} from 'lodash';
import {
    getItemWorkflowState,
    lockUtils,
    isItemPublic,
    isItemKilled,
    isItemSpiked,
    isItemRescheduled,
    eventUtils,
    isItemCancelled,
    getPostedState,
    isEmptyActions,
    isDateInRange,
    gettext,
    getEnabledAgendas,
    isExistingItem,
    isItemExpired,
    getItemId,
    generateTempId,
} from './index';
import {stripHtmlRaw} from 'superdesk-core/scripts/apps/authoring/authoring/helpers';

const isCoverageAssigned = (coverage) => !!get(coverage, 'assigned_to.desk');

const canPostPlanning = (planning, event, session, privileges, locks) => (
    isExistingItem(planning) &&
        !!privileges[PRIVILEGES.POST_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPostedState(planning) !== POST_STATE.USABLE &&
        (isNil(event) || getPostedState(event) === POST_STATE.USABLE) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !isItemCancelled(event) &&
        !isItemRescheduled(planning) &&
        !isItemRescheduled(event) &&
        !isNotForPublication(planning)
);

const canUnpostPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.UNPOST_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(planning) &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPostedState(planning) === POST_STATE.USABLE
);

const canEditPlanning = (planning, event, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING]) &&
        !isItemRescheduled(planning) &&
        (!isItemExpired(planning) || privileges[PRIVILEGES.EDIT_EXPIRED])
);

const canAssignAgenda = (planning, event, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLocked(planning, locks) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        !isItemCancelled(planning) &&
        !isItemRescheduled(planning)
);

const canAddFeatured = (planning, event, session, privileges, locks) => (
    !get(planning, 'featured', false) &&
        canEditPlanning(planning, event, session, privileges, locks) &&
        !!privileges[PRIVILEGES.FEATURED_STORIES]
);

const canRemovedFeatured = (planning, event, session, privileges, locks) => (
    get(planning, 'featured', false) === true &&
        canEditPlanning(planning, event, session, privileges, locks) &&
        !!privileges[PRIVILEGES.FEATURED_STORIES]
);

const canUpdatePlanning = (planning, event, session, privileges, locks) => (
    canEditPlanning(planning, event, session, privileges, locks) &&
        isItemPublic(planning) &&
        !isItemKilled(planning) &&
        !!privileges[PRIVILEGES.POST_PLANNING]
);

const canSpikePlanning = (plan, session, privileges, locks) => (
    !isItemPublic(plan) &&
        getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(plan, session, locks) &&
        !get(plan, 'coverages', []).find((c) => isCoverageInWorkflow(c)) &&
        (!isItemExpired(plan) || privileges[PRIVILEGES.EDIT_EXPIRED])
);

const canUnspikePlanning = (plan, event = null, privileges) => (
    isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(event) &&
        (!isItemExpired(plan) || privileges[PRIVILEGES.EDIT_EXPIRED])
);

const canDuplicatePlanning = (plan, event = null, session, privileges, locks) => (
    !isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !self.isPlanningLockRestricted(plan, session, locks) &&
        !isItemSpiked(event)
);

const canCancelPlanning = (planning, event = null, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getItemWorkflowState(planning) === WORKFLOW_STATE.SCHEDULED &&
        getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED &&
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING])
);

const canCancelAllCoverage = (planning, event = null, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(planning) && !isPlanningLockRestricted(planning, session, locks) &&
        getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED &&
        canCancelAllCoverageForPlanning(planning) &&
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING])
);

const canAddAsEvent = (planning, event = null, session, privileges, locks) => (
    !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        isPlanAdHoc(planning) &&
        !isPlanningLocked(planning, locks) &&
        !isItemSpiked(planning)
);

const isCoverageCancelled = (coverage) =>
    (get(coverage, 'workflow_status') === WORKFLOW_STATE.CANCELLED);

const canCancelCoverage = (coverage) =>
    (!isCoverageCancelled(coverage) && (!get(coverage, 'assigned_to.state') ||
        get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED));

const canRemoveCoverage = (coverage) => (get(coverage, 'workflow_status') === WORKFLOW_STATE.DRAFT ||
    get(coverage, 'previous_status') === WORKFLOW_STATE.DRAFT);

const canCancelAllCoverageForPlanning = (planning) => (
    get(planning, 'coverages.length') > 0 && get(planning, 'coverages')
        .filter((c) => canCancelCoverage(c)).length > 0
);

const canAddCoverages = (planning, privileges) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemCancelled(planning) && !isItemRescheduled(planning)
);

const isPlanningLocked = (plan, locks) =>
    !isNil(plan) && (
        plan._id in locks.planning ||
        get(plan, 'event_item') in locks.event ||
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
            assigned_to: get(c, 'assigned_to'),
        };

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
        [PLANNING.ITEM_ACTIONS.ADD_COVERAGE.label]: () =>
            canAddCoverages(plan, privileges),
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
        [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.label]: () =>
            canAddAsEvent(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING.label]: () =>
            canEditPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.label]: () =>
            canEditPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.label]: () =>
            canAssignAgenda(plan, event, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.label]: () =>
            canAddFeatured(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.label]: () =>
            canRemovedFeatured(plan, event, session, privileges, locks),
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
        [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label]: () =>
            !isPlanAdHoc(plan) &&
            eventUtils.canUpdateEventRepetitions(event, session, privileges, locks),
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

const getPlanningActions = ({
    item,
    event,
    session,
    privileges,
    lockedItems,
    agendas,
    callBacks,
    contentTypes}) => {
    if (!isExistingItem(item)) {
        return [];
    }

    let enabledAgendas;
    let agendaCallBacks = [];
    let actions = [];
    let addCoverageCallBacks = [];
    let eventActions = [GENERIC_ITEM_ACTIONS.DIVIDER];
    const isExpired = isItemExpired(item);
    let alllowedCallBacks = [
        PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName,
        PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName,
        PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName,
        PLANNING.ITEM_ACTIONS.DUPLICATE.actionName,
        PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName,
        PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName,
        PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName,
        PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName,
        PLANNING.ITEM_ACTIONS.SPIKE.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName,
        EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName,
    ];


    if (isExpired && !privileges[PRIVILEGES.EDIT_EXPIRED]) {
        alllowedCallBacks = [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName];
    }

    if (isItemSpiked(item)) {
        alllowedCallBacks = [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName];
    }

    alllowedCallBacks.forEach((callBackName) => {
        if (!callBacks[callBackName]) {
            return;
        }

        if (callBackName === PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName) {
            addCoverageCallBacks = contentTypes.map((c) => (
                {
                    label: c.name,
                    icon: self.getCoverageIcon(c.qcode),
                    callback: callBacks[callBackName].bind(null, c.qcode),
                }
            ));

            if (addCoverageCallBacks.length > 0) {
                actions.push({
                    ...PLANNING.ITEM_ACTIONS.ADD_COVERAGE,
                    callback: addCoverageCallBacks,
                });
            }
        } else if (callBackName === PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName) {
            enabledAgendas = getEnabledAgendas(agendas);
            enabledAgendas.forEach((agenda) => {
                agendaCallBacks.push({
                    label: agenda.name,
                    inactive: get(item, 'agendas', []).includes(agenda._id),
                    callback: callBacks[callBackName].bind(null, item, agenda),
                });
            });

            if (agendaCallBacks.length > 0) {
                actions.push({
                    ...PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA,
                    callback: agendaCallBacks,
                });
            }
        } else {
            let action = find(PLANNING.ITEM_ACTIONS, (action) => action.actionName === callBackName);

            if (action) {
                if ([PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName,
                    PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName].includes(callBackName)) {
                    actions.push({
                        ...action,
                        callback: callBacks[callBackName].bind(null, item, true),
                    });
                } else {
                    actions.push({
                        ...action,
                        callback: callBacks[callBackName].bind(null, item),
                    });
                }
            } else {
                action = find(EVENTS.ITEM_ACTIONS, (action) => action.actionName === callBackName);
                if (action) {
                    eventActions.push({
                        ...action,
                        callback: callBacks[callBackName].bind(null, event),
                    });
                }
            }
        }
    });

    // Don't include event actions if planning is spiked or expired
    if (eventActions.length > 1 && !isItemSpiked(item) && (!isExpired || privileges[PRIVILEGES.EDIT_EXPIRED])) {
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

const modifyForClient = (plan) => {
    if (get(plan, 'planning_date')) {
        plan.planning_date = moment(plan.planning_date);
    }

    plan.coverages = plan.coverages || [];

    plan.coverages.forEach((coverage) => self.modifyCoverageForClient(coverage));

    return plan;
};

const modifyForServer = (plan) => {
    get(plan, 'coverages', []).forEach((coverage) => {
        coverage.planning = coverage.planning || {};

        if (!get(coverage, 'planning.genre', null)) {
            coverage.planning.genre = null;
        } else if (!isArray(coverage.planning.genre)) {
            coverage.planning.genre = [coverage.planning.genre];
        }
    });

    return plan;
};

/**
 * Utility to convert genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
const modifyCoverageForClient = (coverage) => {
    // Make sure the coverage has a planning field
    if (!get(coverage, 'planning')) {
        coverage.planning = {};
    }

    // Convert genre from an Array to an Object
    if (get(coverage, 'planning.genre[0]')) {
        coverage.planning.genre = coverage.planning.genre[0];
    } else if (!get(coverage, 'planning.genre.qcode')) {
        // only delete when genre not object
        delete coverage.planning.genre;
    }

    // Convert scheduled into a moment instance
    if (get(coverage, 'planning.scheduled')) {
        coverage.planning.scheduled = moment(coverage.planning.scheduled);
    } else {
        delete coverage.planning.scheduled;
    }

    return coverage;
};

const createNewPlanningFromNewsItem = (addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes) => {
    const newCoverage = self.createCoverageFromNewsItem(addNewsItemToPlanning, newsCoverageStatus,
        desk, user, contentTypes);

    let newPlanning = {
        type: ITEM_TYPE.PLANNING,
        slugline: addNewsItemToPlanning.slugline,
        planning_date: moment(),
        ednote: get(addNewsItemToPlanning, 'ednote'),
        subject: get(addNewsItemToPlanning, 'subject'),
        anpa_category: get(addNewsItemToPlanning, 'anpa_category'),
        urgency: get(addNewsItemToPlanning, 'urgency'),
        description_text: stripHtmlRaw(
            get(addNewsItemToPlanning, 'abstract', get(addNewsItemToPlanning, 'headline', ''))
        ),
        coverages: [newCoverage],
    };

    if (get(addNewsItemToPlanning, 'flags.marked_for_not_publication')) {
        newPlanning.flags = {marked_for_not_publication: true};
    }

    if (get(addNewsItemToPlanning, 'place.length', 0) > 0) {
        newPlanning.place = addNewsItemToPlanning.place;
    }

    return newPlanning;
};

const createCoverageFromNewsItem = (addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes) => {
    let newCoverage = self.defaultCoverageValues(newsCoverageStatus);

    newCoverage.workflow_status = COVERAGES.WORKFLOW_STATE.ACTIVE;

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
        self.modifyCoverageForClient(newCoverage);
    }

    if (get(addNewsItemToPlanning, 'keywords.length', 0) > 0) {
        newCoverage.planning.keyword = addNewsItemToPlanning.keywords;
    }

    // Add assignment to coverage
    if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(addNewsItemToPlanning.state)) {
        newCoverage.planning.scheduled = addNewsItemToPlanning.state === 'published' ?
            moment(addNewsItemToPlanning.versioncreated) :
            moment(get(addNewsItemToPlanning, 'schedule_settings.utc_publish_schedule'));

        newCoverage.assigned_to = {
            desk: addNewsItemToPlanning.task.desk,
            user: get(addNewsItemToPlanning, 'version_creator'),
        };
    } else {
        newCoverage.planning.scheduled = moment().endOf('day');
        newCoverage.assigned_to = {
            desk: desk,
            user: get(addNewsItemToPlanning, 'version_creator'),
        };
    }

    newCoverage.assigned_to.priority = ASSIGNMENTS.DEFAULT_PRIORITY;
    return newCoverage;
};

const getCoverageReadOnlyFields = (
    coverage,
    readOnly,
    newsCoverageStatus,
    addNewsItemToPlanning
) => {
    if (addNewsItemToPlanning) {
        // if newsItem is published, schedule is readOnly
        return {
            slugline: true,
            ednote: true,
            keyword: true,
            internal_note: readOnly || false,
            g2_content_type: true,
            genre: true,
            newsCoverageStatus: true,
            scheduled: readOnly || get(addNewsItemToPlanning, 'state') === 'published',
        };
    }

    const hasAssignment = !!get(coverage, 'assigned_to.assignment_id');
    const isCancelled = get(newsCoverageStatus, 'qcode') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode;

    // State is either derived from the Assignment state or if the coverage is cancelled
    let state = null;

    if (hasAssignment) {
        state = get(coverage, 'assigned_to.state');
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

const getPlanningByDate = (plansInList, events, startDate, endDate) => {
    if (!plansInList) return [];

    const days = {};

    plansInList.forEach((plan) => {
        const dates = {};
        let groupDate = null;

        plan.event = get(events, get(plan, 'event_item'));
        plan.coverages.forEach((coverage) => {
            groupDate = moment(get(coverage, 'planning.scheduled', plan.planning_date));

            if (!isDateInRange(groupDate, startDate, endDate)) {
                return;
            }

            if (!get(dates, groupDate.format('YYYY-MM-DD'))) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
        });

        if (isEmpty(dates)) {
            groupDate = moment(plan.planning_date);
            if (isDateInRange(groupDate, startDate, endDate)) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
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

const isCoverageDraft = (coverage) => get(coverage, 'workflow_status') === WORKFLOW_STATE.DRAFT;
const isCoverageInWorkflow = (coverage) => !isEmpty(coverage.assigned_to) &&
    get(coverage, 'assigned_to.state') !== WORKFLOW_STATE.DRAFT;
const formatAgendaName = (agenda) => agenda.is_enabled ? agenda.name : agenda.name + ` - [${gettext('Disabled')}]`;

/**
 * Get the name of associated icon for different coverage types
 * @param {type} coverage types
 * @returns {string} icon name
 */
const getCoverageIcon = (type) => {
    const coverageIcons = {
        [PLANNING.G2_CONTENT_TYPE.TEXT]: 'icon-text',
        [PLANNING.G2_CONTENT_TYPE.VIDEO]: 'icon-video',
        [PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO]: 'icon-video',
        [PLANNING.G2_CONTENT_TYPE.AUDIO]: 'icon-audio',
        [PLANNING.G2_CONTENT_TYPE.PICTURE]: 'icon-photo',
    };

    return get(coverageIcons, type, 'icon-file');
};

const getCoverageIconColor = (coverage) => {
    if (get(coverage, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
        return 'icon--green';
    } else if (isCoverageDraft(coverage) || get(coverage, 'workflow_status') === COVERAGES.WORKFLOW_STATE.ACTIVE) {
        return 'icon--red';
    } else if (isCoverageCancelled(coverage)) {
        // Cancelled
        return 'icon--yellow';
    }
};

const getCoverageWorkflowIcon = (coverage) => {
    if (!get(coverage, 'assigned_to.desk')) {
        return;
    }

    if (get(coverage, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
        return 'icon-ok';
    }

    switch (coverage.workflow_status) {
    case WORKFLOW_STATE.CANCELLED:
        return 'icon-close-small';

    case WORKFLOW_STATE.DRAFT:
        return 'icon-assign';

    case COVERAGES.WORKFLOW_STATE.ACTIVE:
        return 'icon-user';
    }
};

const shouldLockPlanningForEdit = (item, privileges) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        (!isItemPublic(item) || !!privileges[PRIVILEGES.POST_PLANNING])
);

const defaultPlanningValues = (currentAgenda, defaultPlaceList) => {
    const newPlanning = {
        _id: generateTempId(),
        type: ITEM_TYPE.PLANNING,
        planning_date: moment(),
        agendas: get(currentAgenda, 'is_enabled') ?
            [getItemId(currentAgenda)] : [],
    };

    if (defaultPlaceList) {
        newPlanning.place = defaultPlaceList;
    }
    return newPlanning;
};

const defaultCoverageValues = (
    newsCoverageStatus,
    planningItem,
    g2contentType,
    defaultDesk,
    preferredCoverageDesks) => {
    let newCoverage = {
        coverage_id: generateTempId(),
        planning: {
            slugline: get(planningItem, 'slugline'),
            internal_note: get(planningItem, 'internal_note'),
            ednote: get(planningItem, 'ednote'),
            scheduled: get(planningItem, 'planning_date', moment()),
            g2_content_type: g2contentType,
        },
        news_coverage_status: newsCoverageStatus[0],
        workflow_status: WORKFLOW_STATE.DRAFT,
    };

    if (get(preferredCoverageDesks, g2contentType)) {
        newCoverage.assigned_to = {desk: preferredCoverageDesks[g2contentType]};
    } else if (g2contentType === PLANNING.G2_CONTENT_TYPE.TEXT && defaultDesk) {
        newCoverage.assigned_to = {desk: defaultDesk._id};
    }

    return newCoverage;
};


const modifyPlanningsBeingAdded = (state, payload) => {
    // payload must be an array. If not, we transform
    const plans = Array.isArray(payload) ? payload : [payload];

    // clone plannings
    const plannings = cloneDeep(get(state, 'plannings'));

    plans.forEach((planning) => {
        self.modifyForClient(planning);
        plannings[getItemId(planning)] = planning;
    });

    return plannings;
};

const isFeaturedPlanningUpdatedAfterPosting = (item) => {
    if (!item || !get(item, '_updated')) {
        return;
    }

    const updatedDate = moment(item._updated);
    const postedDate = moment(get(item, 'last_posted_time'));

    return updatedDate.isAfter(postedDate);
};

const shouldFetchFilesForPlanning = (planning) => (
    get(planning, 'files', []).filter((f) => typeof (f) === 'string'
            || f instanceof String).length > 0
);

// eslint-disable-next-line consistent-this
const self = {
    canSpikePlanning,
    canUnspikePlanning,
    canPostPlanning,
    canUnpostPlanning,
    canEditPlanning,
    canUpdatePlanning,
    mapCoverageByDate,
    getPlanningItemActions,
    isPlanningLocked,
    isPlanningLockRestricted,
    isPlanAdHoc,
    modifyCoverageForClient,
    isCoverageCancelled,
    canCancelCoverage,
    canRemoveCoverage,
    getCoverageReadOnlyFields,
    isPlanMultiDay,
    getPlanningActions,
    isNotForPublication,
    getPlanningByDate,
    createNewPlanningFromNewsItem,
    createCoverageFromNewsItem,
    isLockedForAddToPlanning,
    isCoverageAssigned,
    isCoverageDraft,
    isCoverageInWorkflow,
    formatAgendaName,
    getCoverageIcon,
    getCoverageIconColor,
    getCoverageWorkflowIcon,
    shouldLockPlanningForEdit,
    modifyForClient,
    modifyForServer,
    defaultPlanningValues,
    defaultCoverageValues,
    modifyPlanningsBeingAdded,
    isFeaturedPlanningUpdatedAfterPosting,
    shouldFetchFilesForPlanning,
};

export default self;
