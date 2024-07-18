import moment from 'moment-timezone';
import {get, set, isNil, uniq, sortBy, isEmpty, cloneDeep, isArray, find, flatten} from 'lodash';

import {appConfig as config} from 'appConfig';
import {IDesk, IArticle, IUser} from 'superdesk-api';
import {superdeskApi, planningApi} from '../superdeskApi';
import {
    IPlanningItem,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
    IG2ContentType,
    ISession,
    ILockedItems,
    IPrivileges,
    IPlanningConfig,
    IAgenda,
    IPlace,
    IPlanningAppState,
    IFeaturedPlanningItem,
    ICoverageScheduledUpdate,
    IDateTime,
    IItemAction, IPlanningRelatedEventLink, IPlanningRelatedEventLinkType,
} from '../interfaces';
const appConfig = config as IPlanningConfig;

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
    TIME_COMPARISON_GRANULARITY,
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
    stringUtils,
    planningUtils,
} from './index';
import * as selectors from '../selectors';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {planningConfig} from '../config';
import {isItemAction, isMenuDivider} from '../helpers';

const isCoverageAssigned = (coverage) => !!get(coverage, 'assigned_to.desk');

function canPostPlanning(
    planning: IPlanningItem,
    events_: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    const events = events_ ?? [];

    return (
        isExistingItem(planning) &&
        !!privileges[PRIVILEGES.POST_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(planning, session, locks) &&
        getPostedState(planning) !== POST_STATE.USABLE &&
        events.every((event) => getItemWorkflowState(event) !== WORKFLOW_STATE.KILLED) &&
        !isItemSpiked(planning) &&
        events.every((event) => !isItemSpiked(event)) &&
        (!isItemCancelled(planning) || getItemWorkflowState(planning) === WORKFLOW_STATE.KILLED) &&
        events.every((event) => !isItemCancelled(event)) &&
        !isItemRescheduled(planning) &&
        events.every((event) => !isItemRescheduled(event)) &&
        !isNotForPublication(planning)
    );
}

function canUnpostPlanning(
    planning: IPlanningItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.UNPOST_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(planning) &&
        !lockUtils.isLockRestricted(planning, session, locks) &&
        getPostedState(planning) === POST_STATE.USABLE
    );
}

function canEditPlanning(
    planning: IPlanningItem,
    _events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    const events = _events ?? [];

    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(planning, session, locks) &&
        !isItemSpiked(planning) &&
        events.every((event) => !isItemSpiked(event)) &&
        !(getPostedState(planning) === POST_STATE.USABLE && !privileges[PRIVILEGES.POST_PLANNING]) &&
        !isItemRescheduled(planning) &&
        (!isItemExpired(planning) || privileges[PRIVILEGES.EDIT_EXPIRED]) &&
        events.every((event) => getItemWorkflowState(event) !== WORKFLOW_STATE.KILLED)
    );
}

function canModifyPlanning(
    planning: IPlanningItem,
    events: Array<IEventItem> | null,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isItemLocked(planning, locks) &&
        !isItemSpiked(planning) &&
        (events ?? []).every((event) => !isItemSpiked(event)) &&
        !isItemCancelled(planning) &&
        !isItemRescheduled(planning)
    );
}

function canAddFeatured(
    planning: IPlanningItem,
    events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !get(planning, 'featured', false) &&
        canEditPlanning(planning, events, session, privileges, locks) &&
        !!privileges[PRIVILEGES.FEATURED_STORIES] && !isItemKilled(planning) &&
        !isItemCancelled(planning)
    );
}

function canRemovedFeatured(
    planning: IPlanningItem,
    events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        get(planning, 'featured', false) === true &&
        canEditPlanning(planning, events, session, privileges, locks) &&
        !!privileges[PRIVILEGES.FEATURED_STORIES]
    );
}

function canUpdatePlanning(
    planning: IPlanningItem,
    events: Array<IEventItem>,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        canEditPlanning(planning, events, session, privileges, locks) &&
        isItemPublic(planning) &&
        !isItemKilled(planning) &&
        !!privileges[PRIVILEGES.POST_PLANNING]
    );
}

function canSpikePlanning(
    plan: IPlanningItem,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isItemPosted(plan) &&
        getItemWorkflowState(plan) === WORKFLOW_STATE.DRAFT &&
        !!privileges[PRIVILEGES.SPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(plan, session, locks) &&
        (
            !isItemExpired(plan) ||
            !!privileges[PRIVILEGES.EDIT_EXPIRED]
        )
    );
}

function canUnspikePlanning(
    plan: IPlanningItem,
    events: Array<IEventItem> | null,
    privileges: IPrivileges
): boolean {
    return (
        isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        (events ?? []).every((event) => !isItemSpiked(event)) &&
        (
            !isItemExpired(plan) ||
            !!privileges[PRIVILEGES.EDIT_EXPIRED]
        )
    );
}

function canDuplicatePlanning(
    plan: IPlanningItem,
    events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !isItemSpiked(plan) &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(plan, session, locks) &&
        (events ?? []).every((event) => !isItemSpiked(event))
    );
}

function canCancelPlanning(
    planning: IPlanningItem,
    events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !lockUtils.isLockRestricted(planning, session, locks) &&
        getItemWorkflowState(planning) === WORKFLOW_STATE.SCHEDULED &&
        (events ?? []).every((event) => getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED) &&
        !(
            getPostedState(planning) === POST_STATE.USABLE &&
            !privileges[PRIVILEGES.POST_PLANNING]
        ) &&
        !isItemExpired(planning)
    );
}

function canCancelAllCoverage(
    planning: IPlanningItem,
    events: Array<IEventItem> | null,
    session: ISession,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isItemSpiked(planning) &&
        !lockUtils.isLockRestricted(planning, session, locks) &&
        (events ?? []).every((event) => getItemWorkflowState(event) !== WORKFLOW_STATE.SPIKED) &&
        canCancelAllCoverageForPlanning(planning) &&
        !(
            getPostedState(planning) === POST_STATE.USABLE &&
            !privileges[PRIVILEGES.POST_PLANNING]
        ) &&
        !isItemExpired(planning)
    );
}

function canAddAsEvent(
    planning: IPlanningItem,
    privileges: IPrivileges,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.EVENT_MANAGEMENT] &&
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        // TODO: Add check for config option, if multiple events are allowed or not,
        // if not, disallow after there's a primary link
        !lockUtils.isItemLocked(planning, locks) &&
        !isItemSpiked(planning) &&
        getItemWorkflowState(planning) !== WORKFLOW_STATE.KILLED &&
        !isItemExpired(planning)
    );
}

function isCoverageCancelled(coverage: IPlanningCoverageItem): boolean {
    return get(coverage, 'workflow_status') === WORKFLOW_STATE.CANCELLED;
}

function canCancelCoverage(
    coverage: IPlanningCoverageItem,
    planning: IPlanningItem,
    field: string = 'coverage_id'
): boolean {
    return (
        !isItemExpired(planning) &&
        (
            !isCoverageCancelled(coverage) &&
            isExistingItem(coverage, field) &&
            (
                !get(coverage, 'assigned_to.state')
                || get(coverage, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED
            )
        )
    );
}

function canAddCoverageToWorkflow(coverage: IPlanningCoverageItem, planning: IPlanningItem): boolean {
    return (
        isExistingItem(coverage, 'coverage_id') &&
        isCoverageDraft(coverage) &&
        isCoverageAssigned(coverage) &&
        !appConfig.planning_auto_assign_to_workflow &&
        !isItemExpired(planning)
    );
}

function canRemoveCoverage(coverage: IPlanningCoverageItem, planning: IPlanningItem): boolean {
    return (
        !isItemCancelled(planning) &&
        !isItemExpired(planning) &&
        (
            [WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.CANCELLED].includes(get(coverage, 'workflow_status')) ||
            get(coverage, 'previous_status') === WORKFLOW_STATE.DRAFT
        )
    );
}

function canCancelAllCoverageForPlanning(planning: IPlanningItem): boolean {
    return (
        get(planning, 'coverages.length') > 0 &&
        get(planning, 'coverages').filter((c) => canCancelCoverage(c, planning)).length > 0
    );
}

function canAddCoverages(
    planning: IPlanningItem,
    events: Array<IEventItem>,
    privileges: IPrivileges,
    session: ISession,
    locks: ILockedItems
): boolean {
    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        lockUtils.isItemLocked(planning, locks) &&
        lockUtils.isItemLockedInThisSession(planning, session, locks) &&
        (events ?? []).every((event) => !isItemCancelled(event)) &&
        (!isItemCancelled(planning) || isItemKilled(planning)) && !isItemRescheduled(planning) &&
        !isItemExpired(planning)
    );
}

/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
export function mapCoverageByDate(coverages: Array<IPlanningCoverageItem> = []): Array<IPlanningCoverageItem> {
    return coverages.map((c) => ({
        ...c,
        g2_content_type: c.planning.g2_content_type || '',
        assigned_to: get(c, 'assigned_to'),
    }));
}

// ad hoc plan created directly from planning list and not from an event
function isPlanAdHoc(plan: IPlanningItem): boolean {
    return getRelatedEventLinksForPlanning(plan, 'primary').length === 0;
}

function isPlanMultiDay(plan: IPlanningItem): boolean {
    const coverages = get(plan, 'coverages', []);

    if (coverages.length > 0) {
        const days = uniq(coverages
            .map((coverage) => get(coverage, 'planning.scheduled'))
            .filter((schedule) => schedule)
            .map((schedule) => moment(schedule).format('YYYY-MM-DD')));

        return days.length > 1;
    }

    return false;
}

export function isNotForPublication(plan: IPlanningItem): boolean {
    return plan.flags?.marked_for_not_publication === true;
}

interface IGetPlanningActionArgs {
    item: IPlanningItem;
    events: Array<IEventItem> | null;
    session: ISession;
    privileges: IPrivileges;
    lockedItems: ILockedItems;
    agendas?: Array<IAgenda>
    callBacks: {[key: string]: (...args: Array<any>) => any};
    contentTypes: Array<IG2ContentType>;
}

function getPlanningActions(
    {
        item,
        events,
        session,
        privileges,
        lockedItems,
        agendas,
        callBacks,
        contentTypes,
    }: IGetPlanningActionArgs
): Array<IItemAction | typeof GENERIC_ITEM_ACTIONS.DIVIDER | typeof GENERIC_ITEM_ACTIONS.LABEL> {
    if (!isExistingItem(item)) {
        return [];
    }

    function getPlanningItemAction(
        action: keyof typeof PLANNING.ITEM_ACTIONS,
        condition: () => boolean,
        callback?: IItemAction['callback'],
    ): IItemAction | null {
        if (callBacks[PLANNING.ITEM_ACTIONS[action].actionName] != null && condition() === true) {
            const getDefaultCallback = () => callBacks[PLANNING.ITEM_ACTIONS[action].actionName].bind(null, item);

            return {
                ...PLANNING.ITEM_ACTIONS[action],
                callback: callback ?? getDefaultCallback(),
            };
        } else {
            return null;
        }
    }

    const isExpired = isItemExpired(item);

    const duplicateAction: IItemAction = getPlanningItemAction(
        'DUPLICATE',
        () => canDuplicatePlanning(item, events, session, privileges, lockedItems),
    );

    if (isExpired && !privileges[PRIVILEGES.EDIT_EXPIRED]) {
        return duplicateAction == null ? [] : [duplicateAction];
    }

    const isSpiked = isItemSpiked(item);

    const unspikeAction: IItemAction = getPlanningItemAction(
        'UNSPIKE',
        () => canUnspikePlanning(item, events, privileges),
    );

    if (isSpiked) {
        return unspikeAction == null ? [] : [unspikeAction];
    }


    function addPlanningItemAction(
        actionKey: keyof typeof PLANNING.ITEM_ACTIONS,
        condition: () => boolean,
        callback?: IItemAction['callback'],
    ) {
        const action: IItemAction | null = getPlanningItemAction(actionKey, condition, callback);

        if (action != null) {
            actions.push(action);
        }
    }

    const actions: ReturnType<typeof getPlanningActions> = [];

    if (contentTypes.length > 0) {
        const getAddCoverageCallbacks = (callback) => contentTypes.map((contentType) => (
            {
                label: contentType.name,
                icon: self.getCoverageIcon(contentType.qcode),
                callback: callback.bind(null, contentType.qcode, item),
            }
        ));

        if (callBacks[PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName] != null) {
            addPlanningItemAction(
                'ADD_COVERAGE',
                () => canAddCoverages(item, events, privileges, session, lockedItems),
                getAddCoverageCallbacks(callBacks[PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName]),
            );
        }

        if (callBacks[PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName] != null) {
            addPlanningItemAction(
                'ADD_COVERAGE_FROM_LIST',
                () => canModifyPlanning(item, events, privileges, lockedItems) && !isItemExpired(item),
                getAddCoverageCallbacks(callBacks[PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]),
            );
        }
    }

    const enabledAgendas: Array<any> = getEnabledAgendas(agendas);

    addPlanningItemAction(
        'ASSIGN_TO_AGENDA',
        () => enabledAgendas.length > 0 && canModifyPlanning(item, events, privileges, lockedItems),
        (() => {
            const _actions: Array<IItemAction> = enabledAgendas.map((agenda) => ({
                label: agenda.name,
                inactive: (item.agendas ?? []).includes(agenda._id),
                callback: callBacks[PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName].bind(null, item, agenda),
            }));

            return _actions;
        })(),
    );

    addPlanningItemAction(
        'EDIT_PLANNING_MODAL',
        () => canEditPlanning(item, events, session, privileges, lockedItems),
        () => {
            callBacks[PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName].bind(null, item, false, true)();
        },
    );

    addPlanningItemAction(
        'SPIKE',
        () => canSpikePlanning(item, session, privileges, lockedItems),
    );

    if (unspikeAction != null) {
        actions.push(unspikeAction);
    }

    if (duplicateAction != null) {
        actions.push(duplicateAction);
    }

    addPlanningItemAction(
        'CANCEL_PLANNING',
        () => canCancelPlanning(item, events, session, privileges, lockedItems),
    );

    addPlanningItemAction(
        'CANCEL_ALL_COVERAGE',
        () => canCancelAllCoverage(item, events, session, privileges, lockedItems),
    );

    addPlanningItemAction(
        'ADD_AS_EVENT',
        () => canAddAsEvent(item, privileges, lockedItems),
    );

    addPlanningItemAction(
        'EDIT_PLANNING',
        () => canEditPlanning(item, events, session, privileges, lockedItems),
    );

    addPlanningItemAction(
        'ADD_TO_FEATURED',
        () => canAddFeatured(item, events, session, privileges, lockedItems),
    );

    addPlanningItemAction(
        'REMOVE_FROM_FEATURED',
        () => canRemovedFeatured(item, events, session, privileges, lockedItems),
        () => callBacks[PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName].bind(null, item, true)(),
    );

    if (isEmptyActions(actions)) {
        return [];
    }

    actions.forEach((action, i) => {
        if (isItemAction(action)) {
            action.key = `${action.actionName}-${i}`;
        }
    });

    return actions;
}

/**
 * Converts output from `getPlanningActions` to `Array<IMenuItem>`
 */
export function toUIFrameworkInterface(
    actions: Array<IItemAction | typeof GENERIC_ITEM_ACTIONS.DIVIDER | typeof GENERIC_ITEM_ACTIONS.LABEL>
): Array<IMenuItem> {
    return actions
        .filter((item, index) => {
            // Trim dividers. Menu should not start or end with a divider.
            if (
                isMenuDivider(item) && (index === 0 || (index === actions.length - 1))
            ) {
                return false;
            } else {
                return true;
            }
        })
        .map((menuItemOrGroup) => {
            if (isMenuDivider(menuItemOrGroup)) {
                const menuSeparator: IMenuItem = {
                    separator: true,
                };

                return menuSeparator;
            } else if (!isItemAction(menuItemOrGroup)) {
                const menuSeparator: IMenuItem = {
                    separator: true,
                };

                return menuSeparator;
            } else if (Array.isArray(menuItemOrGroup.callback)) {
                const {label, icon, callback} = menuItemOrGroup;

                var menuBranch: IMenuItem = {
                    label: label,
                    icon: icon,
                    children: toUIFrameworkInterface(callback),
                };

                return menuBranch;
            } else {
                const {label, icon, callback, inactive} = menuItemOrGroup;

                var menuLeaf: IMenuItem = {
                    label: label,
                    icon: icon,
                    onClick: callback,
                    disabled: inactive,
                };

                return menuLeaf;
            }
        });
}

function getPlanningActionsForUiFrameworkMenu(data: IGetPlanningActionArgs): Array<IMenuItem> {
    return toUIFrameworkInterface(planningUtils.getPlanningActions(data));
}

export function modifyForClient(plan: Partial<IPlanningItem>): Partial<IPlanningItem> {
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
}

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
function modifyCoverageForClient(coverage: IPlanningCoverageItem): IPlanningCoverageItem {
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
        }
        modifyGenre(s);
    });

    return coverage;
}

function createNewPlanningFromNewsItem(
    addNewsItemToPlanning: IArticle,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    desk: IDesk['_id'],
    user: IUser['_id'],
    contentTypes: Array<IG2ContentType>
) {
    const newCoverage = self.createCoverageFromNewsItem(
        addNewsItemToPlanning,
        newsCoverageStatus,
        desk,
        user,
        contentTypes
    );
    const {contentProfiles} = planningApi;
    let newPlanning: Partial<IPlanningItem> = {
        ...contentProfiles.getDefaultValues(contentProfiles.get('planning')),
        type: 'planning',
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

    if (addNewsItemToPlanning.priority != null) {
        newPlanning.priority = addNewsItemToPlanning.priority;
    }

    if (get(addNewsItemToPlanning, 'flags.marked_for_not_publication')) {
        newPlanning.flags = {marked_for_not_publication: true};
    }

    if (get(addNewsItemToPlanning, 'place.length', 0) > 0) {
        newPlanning.place = addNewsItemToPlanning.place;
    }

    return newPlanning;
}

function createCoverageFromNewsItem(
    addNewsItemToPlanning: IArticle,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    desk: IDesk['_id'],
    user: IUser['_id'],
    contentTypes: Array<IG2ContentType>
): Partial<IPlanningCoverageItem> {
    let newCoverage = self.defaultCoverageValues(newsCoverageStatus);

    newCoverage.workflow_status = COVERAGES.WORKFLOW_STATE.ACTIVE;

    // Add fields from news item to the coverage
    const contentType = contentTypes.find(
        (ctype) => get(ctype, 'content item type') === addNewsItemToPlanning.type
    );

    newCoverage.planning = {
        ...newCoverage.planning,
        g2_content_type: get(contentType, 'qcode', PLANNING.G2_CONTENT_TYPE.TEXT),
        slugline: get(addNewsItemToPlanning, 'slugline', ''),
        ednote: get(addNewsItemToPlanning, 'ednote', ''),
        scheduled: moment().add(1, 'hour')
            .startOf('hour'),
    };

    if (addNewsItemToPlanning.priority != null) {
        newCoverage.planning.priority = addNewsItemToPlanning.priority;
    }

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
}

function getCoverageReadOnlyFields(
    coverage,
    readOnly,
    newsCoverageStatus,
    addNewsItemToPlanning
): {[key: string]: boolean} {
    const scheduledUpdatesExist = get(coverage, 'scheduled_updates.length', 0) > 0;

    if (addNewsItemToPlanning) {
        // if newsItem is published, schedule is readOnly
        return {
            slugline: true,
            headline: true,
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
            headline: readOnly,
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
            headline: readOnly,
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
            headline: readOnly,
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
            headline: true,
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
            headline: readOnly,
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
}

function getFlattenedPlanningByDate(
    plansInList: Array<IPlanningItem>,
    events: {[key: string]: IEventItem},
    startDate: IDateTime,
    endDate: IDateTime,
    timezone?: string
) {
    const planning = getPlanningByDate(plansInList, events, startDate, endDate, timezone);

    return flatten(
        sortBy(planning, [(e) => (e.date)])
            .map((e) => e.events.map((k) => [e.date, k._id]))
    );
}

function getPlanningByDate(
    plansInList: Array<IPlanningItem>,
    events: {[key: string]: IEventItem},
    startDate: IDateTime,
    endDate: IDateTime,
    timezone?: string,
    includeScheduledUpdates?: boolean
): Array<{[date: string]: Array<IPlanningItem>}> {
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
        const primaryEventIds = getRelatedEventIdsForPlanning(plan, 'primary');

        plan.event = primaryEventIds.length > 0 ?
            events[primaryEventIds[0]] :
            undefined;
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
}

function getFeaturedPlanningItemsForDate(items: Array<IPlanningItem>, date: moment.Moment): Array<IPlanningItem> {
    const startDate = moment.tz(moment(date.format('YYYY-MM-DD')), appConfig.default_timezone);
    const endDate = moment.tz(moment(date), appConfig.default_timezone).set({
        [TIME_COMPARISON_GRANULARITY.HOUR]: 23,
        [TIME_COMPARISON_GRANULARITY.MINUTE]: 59,
        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
    });
    const group = getPlanningByDate(
        items,
        null,
        startDate,
        endDate,
        appConfig.default_timezone,
        true
    );

    if (group.length > 0) {
        const featuredPlansForDate = group.find((group) => group.date === date.format('YYYY-MM-DD'));

        return featuredPlansForDate?.events ?? [];
    }

    return [];
}

function isCoverageDraft(coverage: IPlanningCoverageItem | ICoverageScheduledUpdate): boolean {
    return get(coverage, 'workflow_status') === WORKFLOW_STATE.DRAFT;
}
function isCoverageInWorkflow(coverage: IPlanningCoverageItem): boolean {
    return (
        !isEmpty(coverage.assigned_to) &&
        get(coverage, 'assigned_to.state') !== WORKFLOW_STATE.DRAFT
    );
}
function formatAgendaName(agenda: IAgenda): string {
    return agenda.is_enabled ?
        agenda.name :
        agenda.name + ` - [${gettext('Disabled')}]`;
}

function getCoverageDateTimeText(coverage: IPlanningCoverageItem): string {
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

    const cancelled = coverage?.assigned_to == null
        ? false
        : getItemWorkflowState(coverage.assigned_to) === WORKFLOW_STATE.CANCELLED;
    const iconType: 'normal' | 'cancelled' = cancelled ? 'cancelled' : 'normal';
    const iconForUnknownType = cancelled ? 'icon-file-cancel' : 'icon-file';

    const coverageIcons = {
        [PLANNING.G2_CONTENT_TYPE.TEXT]: {
            normal: 'icon-text',
            cancelled: 'icon-text-cancel',
        },
        [PLANNING.G2_CONTENT_TYPE.VIDEO]: {
            normal: 'icon-video',
            cancelled: 'icon-video-cancel',
        },
        [PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO]: {
            normal: 'icon-video',
            cancelled: 'icon-video-cancel',
        },
        [PLANNING.G2_CONTENT_TYPE.AUDIO]: {
            normal: 'icon-audio',
            cancelled: 'icon-audio-cancel'
        },
        [PLANNING.G2_CONTENT_TYPE.PICTURE]: {
            normal: 'icon-photo',
            cancelled: 'icon-photo-cancel'
        },
        [PLANNING.G2_CONTENT_TYPE.GRAPHIC]: {
            normal: 'icon-graphic',
            cancelled: 'icon-graphic-cancel',
        },
        [PLANNING.G2_CONTENT_TYPE.LIVE_BLOG]: {
            normal: 'icon-post',
            cancelled: 'icon-post-cancel',
        },
        [PLANNING.G2_CONTENT_TYPE.VIDEO_EXPLAINER]: {
            normal: 'icon-play',
            cancelled: 'icon-play-cancel',
        },
    };

    return coverageIcons[type]?.[iconType] ?? iconForUnknownType;
}

function getCoverageIconColor(coverage: IPlanningCoverageItem): string {
    if (coverage.workflow_status === COVERAGES.WORKFLOW_STATE.ACTIVE) {
        return 'var(--sd-colour-success)';
    } else if (get(coverage, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
        return 'var(--sd-colour-success)';
    } else if (isCoverageDraft(coverage) || get(coverage, 'workflow_status') === COVERAGES.WORKFLOW_STATE.ACTIVE) {
        return 'var(--sd-colour-highlight)';
    } else {
        return 'var(--color-text-lighter)';
    }
}

function getCoverageWorkflowIcon(coverage: IPlanningCoverageItem): string | null {
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
}

function getCoverageContentType(
    coverage: IPlanningCoverageItem,
    contentTypes: Array<IG2ContentType> = []
): IG2ContentType['content item type'] {
    return get(
        contentTypes.find((c) => get(c, 'qcode') === get(coverage, 'planning.g2_content_type')),
        'content item type'
    );
}

function shouldLockPlanningForEdit(item: IPlanningItem, privileges: IPrivileges): boolean {
    return (
        !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
        (
            !isItemPublic(item) ||
            !!privileges[PRIVILEGES.POST_PLANNING]
        )
    );
}

function defaultPlanningValues(currentAgenda?: IAgenda, defaultPlaceList?: Array<IPlace>): Partial<IPlanningItem> {
    const {contentProfiles} = planningApi;
    const planningProfile = contentProfiles.get('planning');
    const defaultValues = contentProfiles.getDefaultValues(planningProfile) as Partial<IPlanningItem>;
    const language = contentProfiles.getDefaultLanguage(planningProfile);
    const newPlanning: Partial<IPlanningItem> = Object.assign(
        {
            type: 'planning',
            planning_date: moment(),
            agendas: get(currentAgenda, 'is_enabled') ?
                [getItemId(currentAgenda)] : [],
            state: 'draft',
            item_class: 'plinat:newscoverage',
            language: language,
            languages: [language],
        },
        defaultValues
    );

    if (defaultPlaceList) {
        newPlanning.place = defaultPlaceList;
    }

    return self.modifyForClient(newPlanning);
}

function getDefaultCoverageStatus(newsCoverageStatus: Array<IPlanningNewsCoverageStatus>): IPlanningNewsCoverageStatus {
    return newsCoverageStatus[0];
}

function defaultCoverageValues(
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    planningItem?: DeepPartial<IPlanningItem>,
    eventItem?: IEventItem, // TAG: MULTIPLE_PRIMARY_EVENTS
    g2contentType?: IG2ContentType['qcode'],
    defaultDesk?: IDesk,
    preferredCoverageDesks?: {[key: string]: IDesk['_id']},
): DeepPartial<IPlanningCoverageItem> {
    const {contentProfiles} = planningApi;
    const coverageProfile = contentProfiles.get('coverage');
    const defaultValues = (contentProfiles.getDefaultValues(coverageProfile)) as DeepPartial<IPlanningCoverageItem>;
    let newCoverage: DeepPartial<IPlanningCoverageItem> = {
        coverage_id: generateTempId(),
        planning: Object.assign(
            {
                slugline: stringUtils.convertStringFieldForProfileFieldType(
                    'planning',
                    'coverage',
                    'slugline',
                    'slugline',
                    planningItem?.slugline
                ),
                internal_note: stringUtils.convertStringFieldForProfileFieldType(
                    'planning',
                    'coverage',
                    'internal_note',
                    'internal_note',
                    planningItem?.internal_note
                ),
                ednote: stringUtils.convertStringFieldForProfileFieldType(
                    'planning',
                    'coverage',
                    'ednote',
                    'ednote',
                    planningItem?.ednote
                ),
                scheduled: planningItem?.planning_date || moment(),
                g2_content_type: g2contentType,
                language: planningItem?.language ?? eventItem?.language,
            },
            defaultValues
        ),
        news_coverage_status: getDefaultCoverageStatus(newsCoverageStatus),
        workflow_status: 'draft',
    };

    if (planningItem?.priority && newCoverage.planning.priority == null) {
        newCoverage.planning.priority = planningItem.priority;
    }

    if (planningItem?._time_to_be_confirmed) {
        newCoverage._time_to_be_confirmed = planningItem._time_to_be_confirmed;
    }

    if (planningItem) {
        const getCoverageDueDateStrategy = planningConfig.coverage?.getDueDateStrategy || getDefaultCoverageDueDate;
        const coverageTime = getCoverageDueDateStrategy(planningItem as IPlanningItem, eventItem);

        if (coverageTime) {
            newCoverage.planning.scheduled = coverageTime;
        }

        if (eventItem && appConfig.long_event_duration_threshold > -1) {
            const duration = moment.duration({
                from: eventItem?.dates?.start,
                to: eventItem?.dates?.end
            });

            if (appConfig.long_event_duration_threshold === 0) {
                newCoverage.planning.scheduled = moment(eventItem?.dates?.end || moment());
            } else if (duration.hours() > appConfig.long_event_duration_threshold) {
                delete newCoverage.planning.scheduled;
                delete newCoverage.planning._scheduledTime;
            }
        }

        newCoverage.planning._scheduledTime = newCoverage.planning.scheduled;
    }

    self.setDefaultAssignment(newCoverage, preferredCoverageDesks, g2contentType, defaultDesk);
    return newCoverage;
}

function getDefaultCoverageDueDate(
    planningItem: IPlanningItem,
    eventItem?: IEventItem,
): moment.Moment | null {
    let coverageTime: moment.Moment = null;
    const primaryEventIds = getRelatedEventIdsForPlanning(planningItem, 'primary');

    if (primaryEventIds.length === 0) {
        coverageTime = moment(planningItem?.planning_date || moment());
    } else if (eventItem) {
        coverageTime = moment(eventItem?.dates?.end || moment());
    }

    if (!coverageTime) {
        return coverageTime;
    }

    coverageTime.add(1, 'hour');

    // Only round up to the hour if we didn't derive coverage time from an Event
    if (!eventItem) {
        coverageTime.minute() ?
            coverageTime
                .add(1, 'hour')
                .startOf('hour') :
            coverageTime.startOf('hour');
    }

    // If the coverage time is in the past, set it to the current time
    if (moment().isAfter(coverageTime)) {
        coverageTime = moment();
        coverageTime.minute() ?
            coverageTime
                .add(1, 'hour')
                .startOf('hour') :
            coverageTime.startOf('hour');
    }

    return coverageTime;
}

function setDefaultAssignment(
    coverage: DeepPartial<IPlanningCoverageItem>,
    preferredCoverageDesks: {[key: string]: IDesk['_id']},
    g2contentType: IG2ContentType['qcode'],
    defaultDesk: IDesk
) {
    if (get(preferredCoverageDesks, g2contentType)) {
        coverage.assigned_to = {desk: preferredCoverageDesks[g2contentType]};
    } else if (g2contentType === 'text' && defaultDesk) {
        coverage.assigned_to = {desk: defaultDesk._id};
    } else {
        delete coverage.assigned_to;
    }
}

function modifyPlanningsBeingAdded(
    state: IPlanningAppState['planning'],
    payload: IPlanningItem | Array<IPlanningItem>
): IPlanningAppState['planning']['plannings'] {
    // payload must be an array. If not, we transform
    const plans = Array.isArray(payload) ? payload : [payload];

    // clone plannings
    const plannings = cloneDeep(get(state, 'plannings'));

    plans.forEach((planning) => {
        self.modifyForClient(planning);
        plannings[getItemId(planning)] = planning;
    });

    return plannings;
}

function isFeaturedPlanningUpdatedAfterPosting(item: IFeaturedPlanningItem): boolean {
    if (!item || !get(item, '_updated')) {
        return;
    }

    const updatedDate = moment(item._updated);
    const postedDate = moment(get(item, 'last_posted_time'));

    return updatedDate.isAfter(postedDate);
}

function shouldFetchFilesForPlanning(planning: IPlanningItem): boolean {
    return (
        self.getPlanningFiles(planning)
            .filter((f) => typeof (f) === 'string' || f instanceof String)
            .length > 0
    );
}

function getAgendaNames(
    item: DeepPartial<IPlanningItem> = {},
    agendas: Array<IAgenda> = [],
    onlyEnabled: boolean = false,
    field: string = 'agendas'
): Array<IAgenda> {
    return get(item, field, [])
        .map((agendaId) => agendas.find((agenda) => agenda._id === get(agendaId, '_id', agendaId)))
        .filter((agenda) => agenda && (!onlyEnabled || agenda.is_enabled));
}

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

function getCoverageDateText(coverage: IPlanningCoverageItem): string {
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
}

function canAddScheduledUpdateToWorkflow(
    scheduledUpdate: ICoverageScheduledUpdate,
    autoAssignToWorkflow: boolean,
    planning: IPlanningItem,
    coverage: IPlanningCoverageItem
): boolean {
    return (
        isExistingItem(scheduledUpdate, 'scheduled_update_id') &&
        isCoverageInWorkflow(coverage) &&
        isCoverageDraft(scheduledUpdate) &&
        isCoverageAssigned(scheduledUpdate) &&
        !autoAssignToWorkflow &&
        !isItemExpired(planning)
    );
}

function setCoverageActiveValues(
    coverage: IPlanningCoverageItem | ICoverageScheduledUpdate,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>
) {
    set(coverage, 'news_coverage_status', newsCoverageStatus.find((s) => s.qcode === 'ncostat:int'));
    set(coverage, 'workflow_status', COVERAGES.WORKFLOW_STATE.ACTIVE);
    set(coverage, 'assigned_to.state', ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED);
}

function getActiveCoverage(
    updatedCoverage: IPlanningCoverageItem,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>
): IPlanningCoverageItem {
    const coverage = cloneDeep(updatedCoverage);

    setCoverageActiveValues(coverage, newsCoverageStatus);
    (get(coverage, 'scheduled_updates') || []).forEach((s) => {
        // Add the scheduled_update to workflow if they have an assignment
        if (get(s, 'assigned_to')) {
            setCoverageActiveValues(s, newsCoverageStatus);
        }
    });

    return coverage;
}

function getPlanningFiles(planning: IPlanningItem): IPlanningItem['files'] {
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
}

function showXMPFileUIControl(coverage: IPlanningCoverageItem): boolean {
    return get(coverage, 'planning.g2_content_type') === 'picture' && (
        appConfig.planning_use_xmp_for_pic_assignments ||
        appConfig.planning_use_xmp_for_pic_slugline
    );
}

function duplicateCoverage(
    item: DeepPartial<IPlanningItem>,
    coverage: DeepPartial<IPlanningCoverageItem>,
    duplicateAs?: IG2ContentType['qcode'],
    event?: IEventItem, // TAG: MULTIPLE_PRIMARY_EVENTS
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

    if (coverage.planning.genre) {
        newCoverage.planning.genre = coverage.planning.genre;
    }

    let diffCoverages: Array<DeepPartial<IPlanningCoverageItem>> = cloneDeep(item.coverages);

    diffCoverages.push(newCoverage);

    return diffCoverages;
}

export function getRelatedEventLinksForPlanning(
    plan: Partial<IPlanningItem>,
    linkType: IPlanningRelatedEventLinkType
): Array<IPlanningRelatedEventLink> {
    return (plan?.related_events || []).filter((link) => link.link_type === linkType);
}

export function getRelatedEventIdsForPlanning(
    plan: Partial<IPlanningItem>,
    linkType: IPlanningRelatedEventLinkType
): Array<IEventItem['_id']> {
    return getRelatedEventLinksForPlanning(plan, linkType).map((event) => event._id);
}

export function pickRelatedEventsForPlanning(
    planning: IPlanningItem,
    events: Array<IEventItem>,
    purpose: 'display' | 'logic',
): Array<IEventItem> {
    const {assertNever} = superdeskApi.helpers;

    if (purpose === 'logic') {
        const allowedEventIds = new Set(getRelatedEventIdsForPlanning(planning, 'primary'));

        return events.filter((event) => allowedEventIds.has(event._id));
    } else if (purpose === 'display') {
        return events;
    } else {
        assertNever(purpose);
    }
}

export function pickRelatedEventIdsForPlanning(
    planning: IPlanningItem,
    purpose: 'display' | 'logic',
): Array<IEventItem['_id']> {
    const {assertNever} = superdeskApi.helpers;

    if (purpose === 'logic') {
        return getRelatedEventIdsForPlanning(planning, 'primary');
    } else if (purpose === 'display') {
        return (planning.related_events ?? []).map(({_id}) => _id);
    } else {
        assertNever(purpose);
    }
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
    getFeaturedPlanningItemsForDate,
    createNewPlanningFromNewsItem,
    createCoverageFromNewsItem,
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
