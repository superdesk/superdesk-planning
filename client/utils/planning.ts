import moment from 'moment-timezone';
import {get, set, isNil, uniq, sortBy, isEmpty, cloneDeep, isArray, find, flatten} from 'lodash';

import {appConfig} from 'appConfig';
import {IDesk, IArticle, IUser} from 'superdesk-api';
import {superdeskApi, planningApi} from '../superdeskApi';
import {
    IPlanningItem,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
    IG2ContentType,
} from '../interfaces';
import {stripHtmlRaw} from 'superdesk-core/scripts/apps/authoring/authoring/helpers';

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
} from '../constants';
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
    isItemPosted,
    getDateTimeString,
    sortBasedOnTBC,
    sanitizeItemFields,
} from './index';
import {getUsersDefaultLanguage} from './users';
import * as selectors from '../selectors';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';

const isCoverageAssigned = (coverage) => !!get(coverage, 'assigned_to.desk');

const canPostPlanning = (planning, event, session, privileges, locks) => (
    isExistingItem(planning) &&
        !!privileges[PRIVILEGES.POST_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        getPostedState(planning) !== POST_STATE.USABLE &&
        (isNil(event) || getItemWorkflowState(event) !== WORKFLOW_STATE.KILLED) &&
        !isItemSpiked(planning) &&
        !isItemSpiked(event) &&
        (!isItemCancelled(planning) || getItemWorkflowState(planning) === WORKFLOW_STATE.KILLED) &&
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
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING]) &&
        !isItemRescheduled(planning) &&
        (!isItemExpired(planning) || privileges[PRIVILEGES.EDIT_EXPIRED]) &&
        (isNil(event) || getItemWorkflowState(event) !== WORKFLOW_STATE.KILLED)
);

const canModifyPlanning = (planning, event, privileges, locks) => (
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
        !!privileges[PRIVILEGES.FEATURED_STORIES] && !isItemKilled(planning) &&
        !isItemCancelled(planning)
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
    !isItemPosted(plan) &&
        getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(plan, session, locks) &&
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
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING]) &&
        !isItemExpired(planning)
);

const canCancelAllCoverage = (planning, event = null, session, privileges, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(planning) && !isPlanningLockRestricted(planning, session, locks) &&
        getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED &&
        canCancelAllCoverageForPlanning(planning) &&
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING]) &&
        !isItemExpired(planning)
);

const canAddAsEvent = (planning, event = null, session, privileges, locks) => (
    !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        isPlanAdHoc(planning) &&
        !isPlanningLocked(planning, locks) &&
        !isItemSpiked(planning) &&
        getItemWorkflowState(planning) !== WORKFLOW_STATE.KILLED &&
        !isItemExpired(planning)
);

const isCoverageCancelled = (coverage) =>
    (get(coverage, 'workflow_status') === WORKFLOW_STATE.CANCELLED);

const canCancelCoverage = (coverage, planning, field = 'coverage_id') =>
    (!isCoverageCancelled(coverage) && isExistingItem(coverage, field) && (!get(coverage, 'assigned_to.state')
        || get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED)) && !isItemExpired(planning);

const canAddCoverageToWorkflow = (coverage, planning) =>
    isExistingItem(coverage, 'coverage_id') &&
    isCoverageDraft(coverage) &&
    isCoverageAssigned(coverage) &&
    !appConfig.planning_auto_assign_to_workflow &&
    !isItemExpired(planning);

const canRemoveCoverage = (coverage, planning) => !isItemCancelled(planning) &&
    ([WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.CANCELLED].includes(get(coverage, 'workflow_status')) ||
        get(coverage, 'previous_status') === WORKFLOW_STATE.DRAFT) && !isItemExpired(planning);

const canCancelAllCoverageForPlanning = (planning) => (
    get(planning, 'coverages.length') > 0 && get(planning, 'coverages')
        .filter((c) => canCancelCoverage(c)).length > 0
);

const canAddCoverages = (planning, event, privileges, session, locks) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        isPlanningLocked(planning, locks) &&
        lockUtils.isItemLockedInThisSession(planning, session, locks) &&
        (isNil(event) || !isItemCancelled(event)) &&
        (!isItemCancelled(planning) || isItemKilled(planning)) && !isItemRescheduled(planning) &&
        !isItemExpired(planning)
);

const isPlanningLocked = (plan, locks) =>
    !isNil(plan) && (
        plan._id in locks.planning ||
        get(plan, 'event_item') in locks.event ||
        get(plan, 'recurrence_id') in locks.recurring
    );

const isPlanningLockRestricted = (plan, session, locks) =>
    isPlanningLocked(plan, locks) &&
        !lockUtils.isItemLockedInThisSession(plan, session, locks);

/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
export const mapCoverageByDate = (coverages = []) => (
    coverages.map((c) => ({
        ...c,
        g2_content_type: c.planning.g2_content_type || '',
        assigned_to: get(c, 'assigned_to'),
    }))
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
        [PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName]: () =>
            canAddCoverages(plan, event, privileges, session, locks),
        [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: () =>
            canSpikePlanning(plan, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: () =>
            canUnspikePlanning(plan, event, privileges),
        [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: () =>
            canDuplicatePlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: () =>
            canCancelPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: () =>
            canCancelAllCoverage(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]: () =>
            canAddAsEvent(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName]: () =>
            canEditPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName]: () =>
            canEditPlanning(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName]: () =>
            canModifyPlanning(plan, event, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]: () =>
            canAddFeatured(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]: () =>
            canRemovedFeatured(plan, event, session, privileges, locks),
        [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]: () =>
            canModifyPlanning(plan, event, privileges, locks) && !isItemExpired(plan),
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: () =>
            !isPlanAdHoc(plan) && eventUtils.canCancelEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: () =>
            !isPlanAdHoc(plan) && eventUtils.canUpdateEventTime(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: () =>
            !isPlanAdHoc(plan) && eventUtils.canRescheduleEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: () =>
            !isPlanAdHoc(plan) && eventUtils.canPostponeEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: () =>
            !isPlanAdHoc(plan) &&
            eventUtils.canConvertToRecurringEvent(event, session, privileges, locks),
        [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: () =>
            !isPlanAdHoc(plan) &&
            eventUtils.canUpdateEventRepetitions(event, session, privileges, locks),

    };

    actions.forEach((action) => {
        if (actionsValidator[action.actionName] && !actionsValidator[action.actionName]()) {
            return;
        }

        switch (action.actionName) {
        case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName:
            action.label = gettext('Cancel Event');
            break;

        case EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName:
            action.label = gettext('Update Event Time');
            break;

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName:
            action.label = gettext('Reschedule Event');
            break;
        case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName:
            action.label = gettext('Mark Event as Postponed');
            break;
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
        PLANNING.ITEM_ACTIONS.PREVIEW.actionName,
        PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName,
        PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName,
        PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName,
        PLANNING.ITEM_ACTIONS.DUPLICATE.actionName,
        PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName,
        PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName,
        PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName,
        PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName,
        PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName,
        PLANNING.ITEM_ACTIONS.SPIKE.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName,
        EVENTS.ITEM_ACTIONS.PREVIEW.actionName,
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

        if ([PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName, PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]
            .includes(callBackName)) {
            addCoverageCallBacks = contentTypes.map((c) => (
                {
                    label: c.name,
                    icon: self.getCoverageIcon(c.qcode),
                    callback: callBacks[callBackName].bind(null, c.qcode, item),
                }
            ));

            if (addCoverageCallBacks.length <= 0) {
                return;
            }

            if (callBackName === PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName) {
                actions.push({
                    ...PLANNING.ITEM_ACTIONS.ADD_COVERAGE,
                    callback: addCoverageCallBacks,
                });
            } else if (callBackName === PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName) {
                actions.push({
                    ...PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST,
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
                if (callBackName === PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName) {
                    actions.push({
                        ...action,
                        callback: callBacks[callBackName].bind(null, item, false, true),
                    });
                } else if (callBackName === PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName) {
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

/**
 * Converts output from `getPlanningActions` to `Array<IMenuItem>`
 */
export function toUIFrameworkInterface(actions: any): Array<IMenuItem> {
    return actions
        .filter((item, index) => {
            // Trim dividers. Menu should not start or end with a divider.
            if (
                (index === 0 && item.label === 'Divider')
                || (index === actions.length - 1 && item.label === 'Divider')
            ) {
                return false;
            } else {
                return true;
            }
        })
        .map((p) => {
            const {label, icon, callback} = p;

            if (Array.isArray(callback)) {
                var menuBranch: IMenuItem = {
                    label: label,
                    icon: icon,
                    children: toUIFrameworkInterface(callback),
                };

                return menuBranch;
            } else if (label === 'Divider') {
                var menuSeparator: IMenuItem = {
                    separator: true,
                };

                return menuSeparator;
            } else {
                var menuLeaf: IMenuItem = {
                    label: label,
                    icon: icon,
                    onClick: callback,
                };

                return menuLeaf;
            }
        });
}

function getPlanningActionsForUiFrameworkMenu(data): Array<IMenuItem> {
    return toUIFrameworkInterface(getPlanningActions(data));
}

export const modifyForClient = (plan) => {
    sanitizeItemFields(plan);

    // The `_status` field is available when the item comes from a POST/PATCH request
    if (plan._status != null) {
        delete plan._status;
    }

    if (get(plan, 'planning_date')) {
        plan.planning_date = moment(plan.planning_date);
    }

    const defaults = {
        'flags.marked_for_not_publication': false,
        'flags.overide_auto_assign_to_workflow': false,
        agendas: [],
        coverages: [],
    };

    Object.keys(defaults).forEach(
        (field) => {
            if (get(plan, field) === undefined) {
                set(plan, field, defaults[field]);
            }
        }
    );

    plan.coverages.forEach((coverage) => self.modifyCoverageForClient(coverage));

    return plan;
};

function modifyForServer(plan: Partial<IPlanningItem>): Partial<IPlanningItem> {
    const modifyGenre = (coverage) => {
        if (!get(coverage, 'planning.genre', null)) {
            coverage.planning.genre = null;
        } else if (!isArray(coverage.planning.genre)) {
            coverage.planning.genre = [coverage.planning.genre];
        }
    };

    delete plan._agendas;

    get(plan, 'coverages', []).forEach((coverage) => {
        coverage.planning = coverage.planning || {};
        modifyGenre(coverage);

        delete coverage.planning._scheduledTime;

        get(coverage, 'scheduled_updates', []).forEach((s) => {
            delete s.planning._scheduledTime;
            modifyGenre(s);
        });
    });

    return plan;
}

/**
 * Utility to convert genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
const modifyCoverageForClient = (coverage) => {
    const modifyGenre = (coverage) => {
        // Convert genre from an Array to an Object
        if (get(coverage, 'planning.genre[0]')) {
            coverage.planning.genre = coverage.planning.genre[0];
        } else if (!get(coverage, 'planning.genre.qcode')) {
            // only delete when genre not object
            delete coverage.planning.genre;
        }
    };

    // Make sure the coverage has a planning field
    if (!get(coverage, 'planning')) {
        coverage.planning = {};
    }

    modifyGenre(coverage);
    // Convert scheduled into a moment instance
    if (get(coverage, 'planning.scheduled')) {
        coverage.planning.scheduled = moment(coverage.planning.scheduled);
        coverage.planning._scheduledTime = moment(coverage.planning.scheduled);
    } else {
        delete coverage.planning.scheduled;
    }

    get(coverage, 'scheduled_updates', []).forEach((s) => {
        if (s.planning.scheduled) {
            s.planning.scheduled = moment(s.planning.scheduled);
            s.planning._scheduledTime = moment(s.planning.scheduled);
            modifyGenre(s);
        }
    });

    return coverage;
};

const createNewPlanningFromNewsItem = (
    addNewsItemToPlanning: IArticle,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    desk: IDesk['_id'],
    user: IUser['_id'],
    contentTypes: Array<IG2ContentType>
) => {
    const newCoverage = self.createCoverageFromNewsItem(
        addNewsItemToPlanning,
        newsCoverageStatus,
        desk,
        user,
        contentTypes
    );

    let newPlanning: Partial<IPlanningItem> = {
        type: ITEM_TYPE.PLANNING,
        slugline: addNewsItemToPlanning.slugline,
        headline: get(addNewsItemToPlanning, 'headline'),
        planning_date: moment(),
        ednote: get(addNewsItemToPlanning, 'ednote'),
        subject: get(addNewsItemToPlanning, 'subject'),
        anpa_category: get(addNewsItemToPlanning, 'anpa_category'),
        urgency: get(addNewsItemToPlanning, 'urgency'),
        description_text: stripHtmlRaw(get(addNewsItemToPlanning, 'abstract', '')),
        coverages: [newCoverage],
        language: addNewsItemToPlanning.language,
    };

    if (get(addNewsItemToPlanning, 'flags.marked_for_not_publication')) {
        newPlanning.flags = {marked_for_not_publication: true};
    }

    if (get(addNewsItemToPlanning, 'place.length', 0) > 0) {
        newPlanning.place = addNewsItemToPlanning.place;
    }

    return newPlanning;
};

const createCoverageFromNewsItem = (
    addNewsItemToPlanning: IArticle,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    desk: IDesk['_id'],
    user: IUser['_id'],
    contentTypes: Array<IG2ContentType>
): Partial<IPlanningCoverageItem> => {
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
        scheduled: moment().add(1, 'hour')
            .startOf('hour'),
    };

    if (addNewsItemToPlanning.language != null) {
        newCoverage.planning.language = addNewsItemToPlanning.language;
    }

    if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(addNewsItemToPlanning.state)) {
        newCoverage.planning.scheduled = get(addNewsItemToPlanning, 'schedule_settings.utc_publish_schedule') ?
            moment(addNewsItemToPlanning.schedule_settings.utc_publish_schedule).add(1, 'hour')
                .startOf('hour') :
            moment(addNewsItemToPlanning.firstpublished).add(1, 'hour')
                .startOf('hour');
    }

    if (get(addNewsItemToPlanning, 'genre')) {
        newCoverage.planning.genre = addNewsItemToPlanning.genre;
    }

    if (get(addNewsItemToPlanning, 'keywords.length', 0) > 0) {
        newCoverage.planning.keyword = addNewsItemToPlanning.keywords;
    }

    // Add assignment to coverage
    newCoverage.assigned_to = {
        desk: get(addNewsItemToPlanning, 'task.desk', desk),
        user: get(addNewsItemToPlanning, 'version_creator'),
    };

    self.modifyCoverageForClient(newCoverage);

    newCoverage.assigned_to.priority = ASSIGNMENTS.DEFAULT_PRIORITY;
    return newCoverage;
};

const getCoverageReadOnlyFields = (
    coverage,
    readOnly,
    newsCoverageStatus,
    addNewsItemToPlanning
) => {
    const scheduledUpdatesExist = get(coverage, 'scheduled_updates.length', 0) > 0;

    if (addNewsItemToPlanning) {
        // if newsItem is published, schedule is readOnly
        return {
            slugline: true,
            ednote: false,
            keyword: true,
            internal_note: readOnly || false,
            g2_content_type: true,
            genre: true,
            newsCoverageStatus: true,
            scheduled: readOnly || get(addNewsItemToPlanning, 'state') === 'published',
            flags: scheduledUpdatesExist,
            files: true,
            xmp_file: true,
        };
    }

    // State is either derived from the Assignment state or if the coverage is cancelled
    let state = null;

    if (get(coverage, 'assigned_to.assignment_id')) {
        state = get(coverage, 'assigned_to.state');
    } else if (get(coverage, 'workflow_status') === WORKFLOW_STATE.CANCELLED) {
        state = WORKFLOW_STATE.CANCELLED;
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
            flags: true,
            files: readOnly,
            xmp_file: readOnly,
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
            flags: true,
            files: readOnly,
            xmp_file: readOnly,
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
            flags: true,
            files: readOnly,
            xmp_file: readOnly,
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
            flags: true,
            files: readOnly,
            xmp_file: readOnly,
        };
    case null:
    default:
        return {
            slugline: readOnly,
            ednote: readOnly,
            keyword: readOnly,
            internal_note: readOnly,
            g2_content_type: (get(coverage, 'scheduled_updates.length', 0) > 0 ? true : readOnly),
            genre: readOnly,
            newsCoverageStatus: readOnly,
            scheduled: readOnly,
            flags: scheduledUpdatesExist,
            files: readOnly,
            xmp_file: readOnly,
        };
    }
};

const getFlattenedPlanningByDate = (plansInList, events, startDate, endDate, timezone = null) => {
    const planning = getPlanningByDate(plansInList, events, startDate, endDate, timezone);

    return flatten(sortBy(planning, [(e) => (e.date)]).map((e) => e.events.map((k) => [e.date, k._id])));
};

const getPlanningByDate = (
    plansInList,
    events,
    startDate,
    endDate,
    timezone = null,
    includeScheduledUpdates = false) => {
    if (!plansInList) return [];

    const days = {};
    const getGroupDate = (date) => {
        const groupDate = date.clone();

        if (timezone) {
            groupDate.tz(timezone);
        }
        return groupDate;
    };

    plansInList.forEach((plan) => {
        let dates = {};
        let groupDate = null;

        const setCoverageToDate = (coverage) => {
            groupDate = getGroupDate(moment(get(coverage, 'planning.scheduled', plan.planning_date)).clone());
            if (!isDateInRange(groupDate, startDate, endDate)) {
                return;
            }

            if (!get(dates, groupDate.format('YYYY-MM-DD'))) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
        };

        plan.event = get(events, get(plan, 'event_item'));
        plan.coverages.forEach((coverage) => {
            setCoverageToDate(coverage);

            if (includeScheduledUpdates) {
                (get(coverage, 'scheduled_updates') || []).forEach((s) => {
                    setCoverageToDate(s);
                });
            }
        });

        if (isEmpty(dates)) {
            groupDate = getGroupDate(moment(plan.planning_date).clone());
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

    return sortBasedOnTBC(days);
};

const isLockedForAddToPlanning = (item) => get(item, 'lock_action') ===
    PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action;

const isCoverageDraft = (coverage) => get(coverage, 'workflow_status') === WORKFLOW_STATE.DRAFT;
const isCoverageInWorkflow = (coverage) => !isEmpty(coverage.assigned_to) &&
    get(coverage, 'assigned_to.state') !== WORKFLOW_STATE.DRAFT;
const formatAgendaName = (agenda) => agenda.is_enabled ? agenda.name : agenda.name + ` - [${gettext('Disabled')}]`;

function getCoverageDateTimeText(coverage: IPlanningCoverageItem) {
    const {gettext} = superdeskApi.localization;
    const coverage_date = moment.isMoment(coverage.planning?.scheduled) ?
        coverage.planning.scheduled :
        moment(coverage.planning.scheduled);

    return coverage._time_to_be_confirmed ? (
        coverage_date.format(appConfig.planning.dateformat) +
        ' @ ' +
        gettext('TBC')
    ) :
        getDateTimeString(
            coverage_date,
            appConfig.planning.dateformat,
            appConfig.planning.timeformat,
            ' @ ',
            false
        );
}

/**
 * Get the name of associated icon for different coverage types
 * @param {type} coverage types
 * @returns {string} icon name
 */
function getCoverageIcon(
    type: IG2ContentType['qcode'] | IG2ContentType['content item type'],
    coverage?: DeepPartial<IPlanningCoverageItem>
): string {
    if (get(coverage, 'scheduled_updates.length', 0) > 0 ||
            (get(coverage, 'scheduled_update_id') && get(coverage, 'assignment_id'))) {
        return 'icon-copy';
    }

    const coverageIcons = {
        [PLANNING.G2_CONTENT_TYPE.TEXT]: 'icon-text',
        [PLANNING.G2_CONTENT_TYPE.VIDEO]: 'icon-video',
        [PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO]: 'icon-video',
        [PLANNING.G2_CONTENT_TYPE.AUDIO]: 'icon-audio',
        [PLANNING.G2_CONTENT_TYPE.PICTURE]: 'icon-photo',
        [PLANNING.G2_CONTENT_TYPE.GRAPHIC]: 'icon-graphic',
        [PLANNING.G2_CONTENT_TYPE.LIVE_BLOG]: 'icon-post',
        [PLANNING.G2_CONTENT_TYPE.VIDEO_EXPLAINER]: 'icon-play',
    };

    return get(coverageIcons, type, 'icon-file');
}

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

const getCoverageContentType = (coverage, contentTypes = []) => get(contentTypes.find(
    (c) => get(c, 'qcode') === get(coverage, 'planning.g2_content_type')), 'content item type');

const shouldLockPlanningForEdit = (item, privileges) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        (!isItemPublic(item) || !!privileges[PRIVILEGES.POST_PLANNING])
);

const defaultPlanningValues = (currentAgenda, defaultPlaceList) => {
    const newPlanning = {
        type: ITEM_TYPE.PLANNING,
        planning_date: moment(),
        agendas: get(currentAgenda, 'is_enabled') ?
            [getItemId(currentAgenda)] : [],
        state: 'draft',
        item_class: 'plinat:newscoverage',
        language: getUsersDefaultLanguage(true),
    };

    if (defaultPlaceList) {
        newPlanning.place = defaultPlaceList;
    }

    return self.modifyForClient(newPlanning);
};

const getDefaultCoverageStatus = (newsCoverageStatus) => newsCoverageStatus[0];

const defaultCoverageValues = (
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    planningItem?: DeepPartial<IPlanningItem>,
    eventItem?: IEventItem,
    g2contentType?: IG2ContentType['qcode'],
    defaultDesk?: IDesk,
    preferredCoverageDesks?: {[key: string]: IDesk['_id']},
): DeepPartial<IPlanningCoverageItem> => {
    let newCoverage: DeepPartial<IPlanningCoverageItem> = {
        coverage_id: generateTempId(),
        planning: {
            slugline: planningItem?.slugline,
            internal_note: planningItem?.internal_note,
            ednote: planningItem?.ednote,
            scheduled: planningItem?.planning_date || moment(),
            g2_content_type: g2contentType,
            language: planningItem?.language ?? eventItem?.language,
        },
        news_coverage_status: getDefaultCoverageStatus(newsCoverageStatus),
        workflow_status: 'draft',
    };

    if (planningItem?._time_to_be_confirmed) {
        newCoverage._time_to_be_confirmed = planningItem._time_to_be_confirmed;
    }

    if (planningItem) {
        let coverageTime: moment.Moment = null;

        if (planningItem?.event_item == null) {
            coverageTime = moment(planningItem?.planning_date || moment());
        } else if (eventItem) {
            coverageTime = moment(eventItem?.dates?.end || moment());
        }

        if (coverageTime) {
            coverageTime.add(1, 'hour');

            // Only round up to the hour if we didn't derive coverage time from an Event
            if (!eventItem) {
                coverageTime.minute() ?
                    coverageTime
                        .add(1, 'hour')
                        .startOf('hour') :
                    coverageTime.startOf('hour');
            }

            if (moment().isAfter(coverageTime)) {
                coverageTime = moment();
                coverageTime.minute() ?
                    coverageTime
                        .add(1, 'hour')
                        .startOf('hour') :
                    coverageTime.startOf('hour');
            }
            newCoverage.planning.scheduled = coverageTime;
        }

        if (eventItem && appConfig.long_event_duration_threshold > -1) {
            if (appConfig.long_event_duration_threshold === 0) {
                newCoverage.planning.scheduled = moment(eventItem?.dates?.end || moment());
            } else {
                const duration = moment.duration({
                    from: eventItem?.dates?.start,
                    to: eventItem?.dates?.end
                });

                if (duration > appConfig.long_event_duration_threshold) {
                    delete newCoverage.planning.scheduled;
                    delete newCoverage.planning._scheduledTime;
                }
            }
        }
        newCoverage.planning._scheduledTime = newCoverage.planning.scheduled;
    }

    self.setDefaultAssignment(newCoverage, preferredCoverageDesks, g2contentType, defaultDesk);
    return newCoverage;
};

const setDefaultAssignment = (coverage, preferredCoverageDesks, g2contentType, defaultDesk) => {
    if (get(preferredCoverageDesks, g2contentType)) {
        coverage.assigned_to = {desk: preferredCoverageDesks[g2contentType]};
    } else if (g2contentType === 'text' && defaultDesk) {
        coverage.assigned_to = {desk: defaultDesk._id};
    } else {
        delete coverage.assigned_to;
    }
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
    self.getPlanningFiles(planning).filter((f) => typeof (f) === 'string'
            || f instanceof String).length > 0
);

const getAgendaNames = (item = {}, agendas = [], onlyEnabled = false, field = 'agendas') => (
    get(item, field, [])
        .map((agendaId) => agendas.find((agenda) => agenda._id === get(agendaId, '_id', agendaId)))
        .filter((agenda) => agenda && (!onlyEnabled || agenda.is_enabled))
);

function getDateStringForPlanning(planning: IPlanningItem): string {
    const {gettext} = superdeskApi.localization;
    const planning_date = moment.isMoment(planning.planning_date) ?
        planning.planning_date :
        moment(planning.planning_date);

    return planning._time_to_be_confirmed ? (
        planning_date.format(appConfig.planning.dateformat) +
        ' @ ' +
        gettext('TBC')
    ) :
        getDateTimeString(
            planning_date,
            appConfig.planning.dateformat,
            appConfig.planning.timeformat,
            ' @ ',
            false
        );
}

const getCoverageDateText = (coverage) => {
    const coverageDate = get(coverage, 'planning.scheduled');

    return !coverageDate ?
        gettext('Not scheduled yet') :
        getDateTimeString(
            coverageDate,
            appConfig.planning.dateformat,
            appConfig.planning.timeformat,
            ' @ ',
            false
        );
};

const canAddScheduledUpdateToWorkflow = (scheduledUpdate, autoAssignToWorkflow, planning, coverage) =>
    isExistingItem(scheduledUpdate, 'scheduled_update_id') && isCoverageInWorkflow(coverage) &&
    isCoverageDraft(scheduledUpdate) && isCoverageAssigned(scheduledUpdate) && !autoAssignToWorkflow &&
    !isItemExpired(planning);

const setCoverageActiveValues = (coverage, newsCoverageStatus) => {
    set(coverage, 'news_coverage_status', newsCoverageStatus.find((s) => s.qcode === 'ncostat:int'));
    set(coverage, 'workflow_status', COVERAGES.WORKFLOW_STATE.ACTIVE);
    set(coverage, 'assigned_to.state', ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED);
};

const getActiveCoverage = (updatedCoverage, newsCoverageStatus) => {
    const coverage = cloneDeep(updatedCoverage);

    setCoverageActiveValues(coverage, newsCoverageStatus);
    (get(coverage, 'scheduled_updates') || []).forEach((s) => {
        // Add the scheduled_update to workflow if they have an assignment
        if (get(s, 'assigned_to')) {
            setCoverageActiveValues(s, newsCoverageStatus);
        }
    });

    return coverage;
};

const getPlanningFiles = (planning) => {
    let filesToFetch = get(planning, 'files') || [];

    (get(planning, 'coverages') || []).forEach((c) => {
        if ((c.planning.files || []).length) {
            filesToFetch = [
                ...filesToFetch,
                ...c.planning.files,
            ];
        }

        if (c.planning.xmp_file) {
            filesToFetch.push(c.planning.xmp_file);
        }
    });

    return filesToFetch;
};

const showXMPFileUIControl = (coverage) => (
    get(coverage, 'planning.g2_content_type') === 'picture' && (
        appConfig.planning_use_xmp_for_pic_assignments ||
        appConfig.planning_use_xmp_for_pic_slugline
    )
);

function duplicateCoverage(
    item: DeepPartial<IPlanningItem>,
    coverage: DeepPartial<IPlanningCoverageItem>,
    duplicateAs?: IG2ContentType['qcode'],
    event?: IEventItem
): DeepPartial<IPlanningItem['coverages']> {
    const coveragePlanning: Partial<IPlanningItem> = {
        slugline: coverage.planning.slugline,
        internal_note: coverage.planning.internal_note,
        ednote: coverage.planning.ednote,
        planning_date: coverage.planning.scheduled,
        language: coverage.planning.language,
    };
    const state = planningApi.redux.store.getState();
    const newsCoverageStatus = selectors.general.newsCoverageStatus(state);
    const defaultDesk = selectors.general.defaultDesk(state);
    const preferredCoverageDesks = get(selectors.general.preferredCoverageDesks(state), 'desks');

    let newCoverage = defaultCoverageValues(
        [newsCoverageStatus.find((s) => s.qcode === 'ncostat:int')],
        coveragePlanning,
        event,
        duplicateAs || coverage.planning?.g2_content_type,
        defaultDesk,
        preferredCoverageDesks
    );

    newCoverage.coverage_id = newCoverage.coverage_id + '-duplicate';
    if (['picture', 'Picture'].includes(newCoverage.planning.g2_content_type) && coverage.planning.xmp_file) {
        newCoverage.planning.xmp_file = coverage.planning.xmp_file;
    }

    if (coverage.workflow_status === 'cancelled') {
        newCoverage.planning.workflow_status_reason = null;
    }

    if (duplicateAs) {
        newCoverage.planning.genre = null;
    }

    let diffCoverages: Array<DeepPartial<IPlanningCoverageItem>> = cloneDeep(item.coverages);

    diffCoverages.push(newCoverage);

    return diffCoverages;
}

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
    getPlanningActionsForUiFrameworkMenu,
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
    getCoverageContentType,
    getAgendaNames,
    getFlattenedPlanningByDate,
    canAddCoverageToWorkflow,
    getCoverageDateTimeText,
    getDateStringForPlanning,
    setDefaultAssignment,
    getCoverageDateText,
    getActiveCoverage,
    canAddScheduledUpdateToWorkflow,
    getDefaultCoverageStatus,
    getPlanningFiles,
    showXMPFileUIControl,
    duplicateCoverage,
    toUIFrameworkInterface,
};

export default self;
