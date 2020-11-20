"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyForClient = exports.getPlanningItemActions = exports.isNotForPublication = exports.mapCoverageByDate = void 0;
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var lodash_1 = require("lodash");
var appConfig_1 = require("appConfig");
var helpers_1 = require("superdesk-core/scripts/apps/authoring/authoring/helpers");
var constants_1 = require("../constants");
var index_1 = require("./index");
var isCoverageAssigned = function (coverage) { return !!lodash_1.get(coverage, 'assigned_to.desk'); };
var canPostPlanning = function (planning, event, session, privileges, locks) { return (index_1.isExistingItem(planning) &&
    !!privileges[constants_1.PRIVILEGES.POST_PLANNING] &&
    !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    !isPlanningLockRestricted(planning, session, locks) &&
    index_1.getPostedState(planning) !== constants_1.POST_STATE.USABLE &&
    (lodash_1.isNil(event) || index_1.getItemWorkflowState(event) !== constants_1.WORKFLOW_STATE.KILLED) &&
    !index_1.isItemSpiked(planning) &&
    !index_1.isItemSpiked(event) &&
    (!index_1.isItemCancelled(planning) || index_1.getItemWorkflowState(planning) === constants_1.WORKFLOW_STATE.KILLED) &&
    !index_1.isItemCancelled(event) &&
    !index_1.isItemRescheduled(planning) &&
    !index_1.isItemRescheduled(event) &&
    !exports.isNotForPublication(planning)); };
var canUnpostPlanning = function (planning, event, session, privileges, locks) { return (!!privileges[constants_1.PRIVILEGES.UNPOST_PLANNING] &&
    !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    !index_1.isItemSpiked(planning) &&
    !isPlanningLockRestricted(planning, session, locks) &&
    index_1.getPostedState(planning) === constants_1.POST_STATE.USABLE); };
var canEditPlanning = function (planning, event, session, privileges, locks) { return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    !isPlanningLockRestricted(planning, session, locks) &&
    !index_1.isItemSpiked(planning) &&
    !index_1.isItemSpiked(event) &&
    !(index_1.getPostedState(planning) === constants_1.POST_STATE.USABLE && !privileges[constants_1.PRIVILEGES.POST_PLANNING]) &&
    !index_1.isItemRescheduled(planning) &&
    (!index_1.isItemExpired(planning) || privileges[constants_1.PRIVILEGES.EDIT_EXPIRED]) &&
    (lodash_1.isNil(event) || index_1.getItemWorkflowState(event) !== constants_1.WORKFLOW_STATE.KILLED)); };
var canModifyPlanning = function (planning, event, privileges, locks) { return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    !isPlanningLocked(planning, locks) &&
    !index_1.isItemSpiked(planning) &&
    !index_1.isItemSpiked(event) &&
    !index_1.isItemCancelled(planning) &&
    !index_1.isItemRescheduled(planning)); };
var canAddFeatured = function (planning, event, session, privileges, locks) { return (!lodash_1.get(planning, 'featured', false) &&
    canEditPlanning(planning, event, session, privileges, locks) &&
    !!privileges[constants_1.PRIVILEGES.FEATURED_STORIES] && !index_1.isItemKilled(planning) &&
    !index_1.isItemCancelled(planning)); };
var canRemovedFeatured = function (planning, event, session, privileges, locks) { return (lodash_1.get(planning, 'featured', false) === true &&
    canEditPlanning(planning, event, session, privileges, locks) &&
    !!privileges[constants_1.PRIVILEGES.FEATURED_STORIES]); };
var canUpdatePlanning = function (planning, event, session, privileges, locks) { return (canEditPlanning(planning, event, session, privileges, locks) &&
    index_1.isItemPublic(planning) &&
    !index_1.isItemKilled(planning) &&
    !!privileges[constants_1.PRIVILEGES.POST_PLANNING]); };
var canSpikePlanning = function (plan, session, privileges, locks) { return (!index_1.isItemPosted(plan) &&
    index_1.getItemWorkflowState(plan) === constants_1.WORKFLOW_STATE.DRAFT &&
    !!privileges[constants_1.PRIVILEGES.SPIKE_PLANNING] &&
    !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    !isPlanningLockRestricted(plan, session, locks) &&
    (!index_1.isItemExpired(plan) || privileges[constants_1.PRIVILEGES.EDIT_EXPIRED])); };
var canUnspikePlanning = function (plan, event, privileges) {
    if (event === void 0) { event = null; }
    return (index_1.isItemSpiked(plan) &&
        !!privileges[constants_1.PRIVILEGES.UNSPIKE_PLANNING] &&
        !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
        !index_1.isItemSpiked(event) &&
        (!index_1.isItemExpired(plan) || privileges[constants_1.PRIVILEGES.EDIT_EXPIRED]));
};
var canDuplicatePlanning = function (plan, event, session, privileges, locks) {
    if (event === void 0) { event = null; }
    return (!index_1.isItemSpiked(plan) &&
        !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
        !self.isPlanningLockRestricted(plan, session, locks) &&
        !index_1.isItemSpiked(event));
};
var canCancelPlanning = function (planning, event, session, privileges, locks) {
    if (event === void 0) { event = null; }
    return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
        !isPlanningLockRestricted(planning, session, locks) &&
        index_1.getItemWorkflowState(planning) === constants_1.WORKFLOW_STATE.SCHEDULED &&
        index_1.getItemWorkflowState(event) !== constants_1.WORKFLOW_STATE.SPIKED &&
        !(index_1.getPostedState(planning) === constants_1.POST_STATE.USABLE && !privileges[constants_1.PRIVILEGES.POST_PLANNING]) &&
        !index_1.isItemExpired(planning));
};
var canCancelAllCoverage = function (planning, event, session, privileges, locks) {
    if (event === void 0) { event = null; }
    return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
        !index_1.isItemSpiked(planning) && !isPlanningLockRestricted(planning, session, locks) &&
        index_1.getItemWorkflowState(event) !== constants_1.WORKFLOW_STATE.SPIKED &&
        canCancelAllCoverageForPlanning(planning) &&
        !(index_1.getPostedState(planning) === constants_1.POST_STATE.USABLE && !privileges[constants_1.PRIVILEGES.POST_PLANNING]) &&
        !index_1.isItemExpired(planning));
};
var canAddAsEvent = function (planning, event, session, privileges, locks) {
    if (event === void 0) { event = null; }
    return (!!privileges[constants_1.PRIVILEGES.EVENT_MANAGEMENT] &&
        !!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
        isPlanAdHoc(planning) &&
        !isPlanningLocked(planning, locks) &&
        !index_1.isItemSpiked(planning) &&
        index_1.getItemWorkflowState(planning) !== constants_1.WORKFLOW_STATE.KILLED &&
        !index_1.isItemExpired(planning));
};
var isCoverageCancelled = function (coverage) {
    return (lodash_1.get(coverage, 'workflow_status') === constants_1.WORKFLOW_STATE.CANCELLED);
};
var canCancelCoverage = function (coverage, planning, field) {
    if (field === void 0) { field = 'coverage_id'; }
    return (!isCoverageCancelled(coverage) && index_1.isExistingItem(coverage, field) && (!lodash_1.get(coverage, 'assigned_to.state')
        || lodash_1.get(coverage, 'assigned_to.state') !== constants_1.ASSIGNMENTS.WORKFLOW_STATE.COMPLETED)) && !index_1.isItemExpired(planning);
};
var canAddCoverageToWorkflow = function (coverage, planning) {
    return index_1.isExistingItem(coverage, 'coverage_id') &&
        isCoverageDraft(coverage) &&
        isCoverageAssigned(coverage) &&
        !appConfig_1.appConfig.planning_auto_assign_to_workflow &&
        !index_1.isItemExpired(planning);
};
var canRemoveCoverage = function (coverage, planning) { return !index_1.isItemCancelled(planning) &&
    ([constants_1.WORKFLOW_STATE.DRAFT, constants_1.WORKFLOW_STATE.CANCELLED].includes(lodash_1.get(coverage, 'workflow_status')) ||
        lodash_1.get(coverage, 'previous_status') === constants_1.WORKFLOW_STATE.DRAFT) && !index_1.isItemExpired(planning); };
var canCancelAllCoverageForPlanning = function (planning) { return (lodash_1.get(planning, 'coverages.length') > 0 && lodash_1.get(planning, 'coverages')
    .filter(function (c) { return canCancelCoverage(c); }).length > 0); };
var canAddCoverages = function (planning, event, privileges, session, locks) { return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    isPlanningLocked(planning, locks) &&
    index_1.lockUtils.isItemLockedInThisSession(planning, session, locks) &&
    (lodash_1.isNil(event) || !index_1.isItemCancelled(event)) &&
    (!index_1.isItemCancelled(planning) || index_1.isItemKilled(planning)) && !index_1.isItemRescheduled(planning) &&
    !index_1.isItemExpired(planning)); };
var isPlanningLocked = function (plan, locks) {
    return !lodash_1.isNil(plan) && (plan._id in locks.planning ||
        lodash_1.get(plan, 'event_item') in locks.event ||
        lodash_1.get(plan, 'recurrence_id') in locks.recurring);
};
var isPlanningLockRestricted = function (plan, session, locks) {
    return isPlanningLocked(plan, locks) &&
        !index_1.lockUtils.isItemLockedInThisSession(plan, session, locks);
};
/**
 * Get the array of coverage content type and color base on the scheduled date
 * @param {Array} coverages
 * @returns {Array}
 */
exports.mapCoverageByDate = function (coverages) {
    if (coverages === void 0) { coverages = []; }
    return (coverages.map(function (c) { return (__assign(__assign({}, c), { g2_content_type: c.planning.g2_content_type || '', assigned_to: lodash_1.get(c, 'assigned_to') })); }));
};
// ad hoc plan created directly from planning list and not from an event
var isPlanAdHoc = function (plan) { return !lodash_1.get(plan, 'event_item'); };
var isPlanMultiDay = function (plan) {
    var coverages = lodash_1.get(plan, 'coverages', []);
    if (coverages.length > 0) {
        var days = lodash_1.uniq(coverages
            .map(function (coverage) { return lodash_1.get(coverage, 'planning.scheduled'); })
            .filter(function (schedule) { return schedule; })
            .map(function (schedule) { return moment_timezone_1.default(schedule).format('YYYY-MM-DD'); }));
        return days.length > 1;
    }
    return false;
};
exports.isNotForPublication = function (plan) { return lodash_1.get(plan, 'flags.marked_for_not_publication', false); };
exports.getPlanningItemActions = function (plan, event, session, privileges, actions, locks) {
    var _a;
    if (event === void 0) { event = null; }
    var itemActions = [];
    var key = 1;
    var actionsValidator = (_a = {},
        _a[constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName] = function () {
            return canAddCoverages(plan, event, privileges, session, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.SPIKE.actionName] = function () {
            return canSpikePlanning(plan, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.UNSPIKE.actionName] = function () {
            return canUnspikePlanning(plan, event, privileges);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.DUPLICATE.actionName] = function () {
            return canDuplicatePlanning(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName] = function () {
            return canCancelPlanning(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName] = function () {
            return canCancelAllCoverage(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName] = function () {
            return canAddAsEvent(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName] = function () {
            return canEditPlanning(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName] = function () {
            return canEditPlanning(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName] = function () {
            return canModifyPlanning(plan, event, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName] = function () {
            return canAddFeatured(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName] = function () {
            return canRemovedFeatured(plan, event, session, privileges, locks);
        },
        _a[constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName] = function () {
            return canModifyPlanning(plan, event, privileges, locks) && !index_1.isItemExpired(plan);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName] = function () {
            return !isPlanAdHoc(plan) && index_1.eventUtils.canCancelEvent(event, session, privileges, locks);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName] = function () {
            return !isPlanAdHoc(plan) && index_1.eventUtils.canUpdateEventTime(event, session, privileges, locks);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName] = function () {
            return !isPlanAdHoc(plan) && index_1.eventUtils.canRescheduleEvent(event, session, privileges, locks);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName] = function () {
            return !isPlanAdHoc(plan) && index_1.eventUtils.canPostponeEvent(event, session, privileges, locks);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName] = function () {
            return !isPlanAdHoc(plan) &&
                index_1.eventUtils.canConvertToRecurringEvent(event, session, privileges, locks);
        },
        _a[constants_1.EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName] = function () {
            return !isPlanAdHoc(plan) &&
                index_1.eventUtils.canUpdateEventRepetitions(event, session, privileges, locks);
        },
        _a);
    actions.forEach(function (action) {
        if (actionsValidator[action.actionName] && !actionsValidator[action.actionName]()) {
            return;
        }
        switch (action.actionName) {
            case constants_1.EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName:
                action.label = index_1.gettext('Cancel Event');
                break;
            case constants_1.EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName:
                action.label = index_1.gettext('Update Event Time');
                break;
            case constants_1.EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName:
                action.label = index_1.gettext('Reschedule Event');
                break;
            case constants_1.EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName:
                action.label = index_1.gettext('Mark Event as Postponed');
                break;
        }
        itemActions.push(__assign(__assign({}, action), { key: action.label + "-" + key }));
        key++;
    });
    if (index_1.isEmptyActions(itemActions)) {
        return [];
    }
    return itemActions;
};
var getPlanningActions = function (_a) {
    var item = _a.item, event = _a.event, session = _a.session, privileges = _a.privileges, lockedItems = _a.lockedItems, agendas = _a.agendas, callBacks = _a.callBacks, contentTypes = _a.contentTypes;
    if (!index_1.isExistingItem(item)) {
        return [];
    }
    var enabledAgendas;
    var agendaCallBacks = [];
    var actions = [];
    var addCoverageCallBacks = [];
    var eventActions = [constants_1.GENERIC_ITEM_ACTIONS.DIVIDER];
    var isExpired = index_1.isItemExpired(item);
    var alllowedCallBacks = [
        constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.DUPLICATE.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.SPIKE.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName,
        constants_1.PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName,
        constants_1.EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName,
        constants_1.EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName,
        constants_1.EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName,
        constants_1.EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName,
        constants_1.EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName,
    ];
    if (isExpired && !privileges[constants_1.PRIVILEGES.EDIT_EXPIRED]) {
        alllowedCallBacks = [constants_1.PLANNING.ITEM_ACTIONS.DUPLICATE.actionName];
    }
    if (index_1.isItemSpiked(item)) {
        alllowedCallBacks = [constants_1.PLANNING.ITEM_ACTIONS.UNSPIKE.actionName];
    }
    alllowedCallBacks.forEach(function (callBackName) {
        if (!callBacks[callBackName]) {
            return;
        }
        if ([constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName, constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]
            .includes(callBackName)) {
            addCoverageCallBacks = contentTypes.map(function (c) { return ({
                label: c.name,
                icon: self.getCoverageIcon(c.qcode),
                callback: callBacks[callBackName].bind(null, c.qcode, item),
            }); });
            if (addCoverageCallBacks.length <= 0) {
                return;
            }
            if (callBackName === constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName) {
                actions.push(__assign(__assign({}, constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE), { callback: addCoverageCallBacks }));
            }
            else if (callBackName === constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName) {
                actions.push(__assign(__assign({}, constants_1.PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST), { callback: addCoverageCallBacks }));
            }
        }
        else if (callBackName === constants_1.PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName) {
            enabledAgendas = index_1.getEnabledAgendas(agendas);
            enabledAgendas.forEach(function (agenda) {
                agendaCallBacks.push({
                    label: agenda.name,
                    inactive: lodash_1.get(item, 'agendas', []).includes(agenda._id),
                    callback: callBacks[callBackName].bind(null, item, agenda),
                });
            });
            if (agendaCallBacks.length > 0) {
                actions.push(__assign(__assign({}, constants_1.PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA), { callback: agendaCallBacks }));
            }
        }
        else {
            var action = lodash_1.find(constants_1.PLANNING.ITEM_ACTIONS, function (action) { return action.actionName === callBackName; });
            if (action) {
                if (callBackName === constants_1.PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName) {
                    actions.push(__assign(__assign({}, action), { callback: callBacks[callBackName].bind(null, item, false, true) }));
                }
                else if (callBackName === constants_1.PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName) {
                    actions.push(__assign(__assign({}, action), { callback: callBacks[callBackName].bind(null, item, true) }));
                }
                else {
                    actions.push(__assign(__assign({}, action), { callback: callBacks[callBackName].bind(null, item) }));
                }
            }
            else {
                action = lodash_1.find(constants_1.EVENTS.ITEM_ACTIONS, function (action) { return action.actionName === callBackName; });
                if (action) {
                    eventActions.push(__assign(__assign({}, action), { callback: callBacks[callBackName].bind(null, event) }));
                }
            }
        }
    });
    // Don't include event actions if planning is spiked or expired
    if (eventActions.length > 1 && !index_1.isItemSpiked(item) && (!isExpired || privileges[constants_1.PRIVILEGES.EDIT_EXPIRED])) {
        actions.push.apply(actions, eventActions);
    }
    return exports.getPlanningItemActions(item, event, session, privileges, actions, lockedItems);
};
exports.modifyForClient = function (plan) {
    index_1.sanitizeItemFields(plan);
    if (lodash_1.get(plan, 'planning_date')) {
        plan.planning_date = moment_timezone_1.default(plan.planning_date);
    }
    var defaults = {
        'flags.marked_for_not_publication': false,
        'flags.overide_auto_assign_to_workflow': false,
        agendas: [],
        coverages: [],
    };
    Object.keys(defaults).forEach(function (field) {
        if (lodash_1.get(plan, field) === undefined) {
            lodash_1.set(plan, field, defaults[field]);
        }
    });
    plan.coverages.forEach(function (coverage) { return self.modifyCoverageForClient(coverage); });
    return plan;
};
var modifyForServer = function (plan) {
    var modifyGenre = function (coverage) {
        if (!lodash_1.get(coverage, 'planning.genre', null)) {
            coverage.planning.genre = null;
        }
        else if (!lodash_1.isArray(coverage.planning.genre)) {
            coverage.planning.genre = [coverage.planning.genre];
        }
    };
    lodash_1.get(plan, 'coverages', []).forEach(function (coverage) {
        coverage.planning = coverage.planning || {};
        modifyGenre(coverage);
        delete coverage.planning._scheduledTime;
        lodash_1.get(coverage, 'scheduled_updates', []).forEach(function (s) {
            delete s.planning._scheduledTime;
            modifyGenre(s);
        });
    });
    return plan;
};
/**
 * Utility to convert genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
var modifyCoverageForClient = function (coverage) {
    var modifyGenre = function (coverage) {
        // Convert genre from an Array to an Object
        if (lodash_1.get(coverage, 'planning.genre[0]')) {
            coverage.planning.genre = coverage.planning.genre[0];
        }
        else if (!lodash_1.get(coverage, 'planning.genre.qcode')) {
            // only delete when genre not object
            delete coverage.planning.genre;
        }
    };
    // Make sure the coverage has a planning field
    if (!lodash_1.get(coverage, 'planning')) {
        coverage.planning = {};
    }
    modifyGenre(coverage);
    // Convert scheduled into a moment instance
    if (lodash_1.get(coverage, 'planning.scheduled')) {
        coverage.planning.scheduled = moment_timezone_1.default(coverage.planning.scheduled);
        coverage.planning._scheduledTime = moment_timezone_1.default(coverage.planning.scheduled);
    }
    else {
        delete coverage.planning.scheduled;
    }
    lodash_1.get(coverage, 'scheduled_updates', []).forEach(function (s) {
        if (s.planning.scheduled) {
            s.planning.scheduled = moment_timezone_1.default(s.planning.scheduled);
            s.planning._scheduledTime = moment_timezone_1.default(s.planning.scheduled);
            modifyGenre(s);
        }
    });
    return coverage;
};
var createNewPlanningFromNewsItem = function (addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes) {
    var newCoverage = self.createCoverageFromNewsItem(addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes);
    var newPlanning = {
        type: constants_1.ITEM_TYPE.PLANNING,
        slugline: addNewsItemToPlanning.slugline,
        headline: lodash_1.get(addNewsItemToPlanning, 'headline'),
        planning_date: moment_timezone_1.default(),
        ednote: lodash_1.get(addNewsItemToPlanning, 'ednote'),
        subject: lodash_1.get(addNewsItemToPlanning, 'subject'),
        anpa_category: lodash_1.get(addNewsItemToPlanning, 'anpa_category'),
        urgency: lodash_1.get(addNewsItemToPlanning, 'urgency'),
        description_text: helpers_1.stripHtmlRaw(lodash_1.get(addNewsItemToPlanning, 'abstract', '')),
        coverages: [newCoverage],
    };
    if (lodash_1.get(addNewsItemToPlanning, 'flags.marked_for_not_publication')) {
        newPlanning.flags = { marked_for_not_publication: true };
    }
    if (lodash_1.get(addNewsItemToPlanning, 'place.length', 0) > 0) {
        newPlanning.place = addNewsItemToPlanning.place;
    }
    return newPlanning;
};
var createCoverageFromNewsItem = function (addNewsItemToPlanning, newsCoverageStatus, desk, user, contentTypes) {
    var newCoverage = self.defaultCoverageValues(newsCoverageStatus);
    newCoverage.workflow_status = constants_1.COVERAGES.WORKFLOW_STATE.ACTIVE;
    // Add fields from news item to the coverage
    var contentType = contentTypes.find(function (ctype) { return lodash_1.get(ctype, 'content item type') === addNewsItemToPlanning.type; });
    newCoverage.planning = {
        g2_content_type: lodash_1.get(contentType, 'qcode', constants_1.PLANNING.G2_CONTENT_TYPE.TEXT),
        slugline: lodash_1.get(addNewsItemToPlanning, 'slugline', ''),
        ednote: lodash_1.get(addNewsItemToPlanning, 'ednote', ''),
        scheduled: moment_timezone_1.default().add(1, 'hour')
            .startOf('hour'),
    };
    if ([constants_1.WORKFLOW_STATE.SCHEDULED, 'published'].includes(addNewsItemToPlanning.state)) {
        newCoverage.planning.scheduled = lodash_1.get(addNewsItemToPlanning, 'schedule_settings.utc_publish_schedule') ?
            moment_timezone_1.default(addNewsItemToPlanning.schedule_settings.utc_publish_schedule).add(1, 'hour')
                .startOf('hour') :
            moment_timezone_1.default(addNewsItemToPlanning.firstpublished).add(1, 'hour')
                .startOf('hour');
    }
    if (lodash_1.get(addNewsItemToPlanning, 'genre')) {
        newCoverage.planning.genre = addNewsItemToPlanning.genre;
    }
    if (lodash_1.get(addNewsItemToPlanning, 'keywords.length', 0) > 0) {
        newCoverage.planning.keyword = addNewsItemToPlanning.keywords;
    }
    // Add assignment to coverage
    newCoverage.assigned_to = {
        desk: lodash_1.get(addNewsItemToPlanning, 'task.desk', desk),
        user: lodash_1.get(addNewsItemToPlanning, 'version_creator'),
    };
    self.modifyCoverageForClient(newCoverage);
    newCoverage.assigned_to.priority = constants_1.ASSIGNMENTS.DEFAULT_PRIORITY;
    return newCoverage;
};
var getCoverageReadOnlyFields = function (coverage, readOnly, newsCoverageStatus, addNewsItemToPlanning) {
    var scheduledUpdatesExist = lodash_1.get(coverage, 'scheduled_updates.length', 0) > 0;
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
            scheduled: readOnly || lodash_1.get(addNewsItemToPlanning, 'state') === 'published',
            flags: scheduledUpdatesExist,
            files: true,
            xmp_file: true,
        };
    }
    // State is either derived from the Assignment state or if the coverage is cancelled
    var state = null;
    if (lodash_1.get(coverage, 'assigned_to.assignment_id')) {
        state = lodash_1.get(coverage, 'assigned_to.state');
    }
    else if (lodash_1.get(coverage, 'workflow_status') === constants_1.WORKFLOW_STATE.CANCELLED) {
        state = constants_1.WORKFLOW_STATE.CANCELLED;
    }
    switch (state) {
        case constants_1.ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED:
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
        case constants_1.ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS:
        case constants_1.ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED:
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
        case constants_1.ASSIGNMENTS.WORKFLOW_STATE.COMPLETED:
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
        case constants_1.ASSIGNMENTS.WORKFLOW_STATE.CANCELLED:
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
                g2_content_type: (lodash_1.get(coverage, 'scheduled_updates.length', 0) > 0 ? true : readOnly),
                genre: readOnly,
                newsCoverageStatus: readOnly,
                scheduled: readOnly,
                flags: scheduledUpdatesExist,
                files: readOnly,
                xmp_file: readOnly,
            };
    }
};
var getFlattenedPlanningByDate = function (plansInList, events, startDate, endDate, timezone) {
    if (timezone === void 0) { timezone = null; }
    var planning = getPlanningByDate(plansInList, events, startDate, endDate, timezone);
    return lodash_1.flatten(lodash_1.sortBy(planning, [function (e) { return (e.date); }]).map(function (e) { return e.events.map(function (k) { return [e.date, k._id]; }); }));
};
var getPlanningByDate = function (plansInList, events, startDate, endDate, timezone, includeScheduledUpdates) {
    if (timezone === void 0) { timezone = null; }
    if (includeScheduledUpdates === void 0) { includeScheduledUpdates = false; }
    if (!plansInList)
        return [];
    var days = {};
    var getGroupDate = function (date) {
        var groupDate = date.clone();
        if (timezone) {
            groupDate.tz(timezone);
        }
        return groupDate;
    };
    plansInList.forEach(function (plan) {
        var dates = {};
        var groupDate = null;
        var setCoverageToDate = function (coverage) {
            groupDate = getGroupDate(moment_timezone_1.default(lodash_1.get(coverage, 'planning.scheduled', plan.planning_date)).clone());
            if (!index_1.isDateInRange(groupDate, startDate, endDate)) {
                return;
            }
            if (!lodash_1.get(dates, groupDate.format('YYYY-MM-DD'))) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
        };
        plan.event = lodash_1.get(events, lodash_1.get(plan, 'event_item'));
        plan.coverages.forEach(function (coverage) {
            setCoverageToDate(coverage);
            if (includeScheduledUpdates) {
                (lodash_1.get(coverage, 'scheduled_updates') || []).forEach(function (s) {
                    setCoverageToDate(s);
                });
            }
        });
        if (lodash_1.isEmpty(dates)) {
            groupDate = getGroupDate(moment_timezone_1.default(plan.planning_date).clone());
            if (index_1.isDateInRange(groupDate, startDate, endDate)) {
                dates[groupDate.format('YYYY-MM-DD')] = groupDate;
            }
        }
        for (var date in dates) {
            if (!days[date]) {
                days[date] = [];
            }
            var clonedPlan = lodash_1.cloneDeep(plan);
            clonedPlan._sortDate = dates[date];
            days[date].push(clonedPlan);
        }
    });
    return index_1.sortBasedOnTBC(days);
};
var isLockedForAddToPlanning = function (item) { return lodash_1.get(item, 'lock_action') ===
    constants_1.PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action; };
var isCoverageDraft = function (coverage) { return lodash_1.get(coverage, 'workflow_status') === constants_1.WORKFLOW_STATE.DRAFT; };
var isCoverageInWorkflow = function (coverage) { return !lodash_1.isEmpty(coverage.assigned_to) &&
    lodash_1.get(coverage, 'assigned_to.state') !== constants_1.WORKFLOW_STATE.DRAFT; };
var formatAgendaName = function (agenda) { return agenda.is_enabled ? agenda.name : agenda.name + (" - [" + index_1.gettext('Disabled') + "]"); };
var getCoverageDateTimeText = function (coverage) {
    return lodash_1.get(coverage, constants_1.TO_BE_CONFIRMED_FIELD) ? (lodash_1.get(coverage, 'planning.scheduled').format(appConfig_1.appConfig.planning.dateformat) +
        ' @ ' +
        constants_1.TO_BE_CONFIRMED_SHORT_TEXT) :
        index_1.getDateTimeString(lodash_1.get(coverage, 'planning.scheduled'), appConfig_1.appConfig.planning.dateformat, appConfig_1.appConfig.planning.timeformat, ' @ ', false);
};
/**
 * Get the name of associated icon for different coverage types
 * @param {type} coverage types
 * @returns {string} icon name
 */
var getCoverageIcon = function (type, coverage) {
    var _a;
    if (lodash_1.get(coverage, 'scheduled_updates.length', 0) > 0 ||
        (lodash_1.get(coverage, 'scheduled_update_id') && lodash_1.get(coverage, 'assignment_id'))) {
        return 'icon-copy';
    }
    var coverageIcons = (_a = {},
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.TEXT] = 'icon-text',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.VIDEO] = 'icon-video',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO] = 'icon-video',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.AUDIO] = 'icon-audio',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.PICTURE] = 'icon-photo',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.GRAPHIC] = 'icon-graphic',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.LIVE_BLOG] = 'icon-post',
        _a[constants_1.PLANNING.G2_CONTENT_TYPE.VIDEO_EXPLAINER] = 'icon-play',
        _a);
    return lodash_1.get(coverageIcons, type, 'icon-file');
};
var getCoverageIconColor = function (coverage) {
    if (lodash_1.get(coverage, 'assigned_to.state') === constants_1.ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
        return 'icon--green';
    }
    else if (isCoverageDraft(coverage) || lodash_1.get(coverage, 'workflow_status') === constants_1.COVERAGES.WORKFLOW_STATE.ACTIVE) {
        return 'icon--red';
    }
    else if (isCoverageCancelled(coverage)) {
        // Cancelled
        return 'icon--yellow';
    }
};
var getCoverageWorkflowIcon = function (coverage) {
    if (!lodash_1.get(coverage, 'assigned_to.desk')) {
        return;
    }
    if (lodash_1.get(coverage, 'assigned_to.state') === constants_1.ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
        return 'icon-ok';
    }
    switch (coverage.workflow_status) {
        case constants_1.WORKFLOW_STATE.CANCELLED:
            return 'icon-close-small';
        case constants_1.WORKFLOW_STATE.DRAFT:
            return 'icon-assign';
        case constants_1.COVERAGES.WORKFLOW_STATE.ACTIVE:
            return 'icon-user';
    }
};
var getCoverageContentType = function (coverage, contentTypes) {
    if (contentTypes === void 0) { contentTypes = []; }
    return lodash_1.get(contentTypes.find(function (c) { return lodash_1.get(c, 'qcode') === lodash_1.get(coverage, 'planning.g2_content_type'); }), 'content item type');
};
var shouldLockPlanningForEdit = function (item, privileges) { return (!!privileges[constants_1.PRIVILEGES.PLANNING_MANAGEMENT] &&
    (!index_1.isItemPublic(item) || !!privileges[constants_1.PRIVILEGES.POST_PLANNING])); };
var defaultPlanningValues = function (currentAgenda, defaultPlaceList) {
    var newPlanning = {
        type: constants_1.ITEM_TYPE.PLANNING,
        planning_date: moment_timezone_1.default(),
        agendas: lodash_1.get(currentAgenda, 'is_enabled') ?
            [index_1.getItemId(currentAgenda)] : [],
        state: 'draft',
        item_class: 'plinat:newscoverage',
    };
    if (defaultPlaceList) {
        newPlanning.place = defaultPlaceList;
    }
    return self.modifyForClient(newPlanning);
};
var getDefaultCoverageStatus = function (newsCoverageStatus) { return newsCoverageStatus[0]; };
var defaultCoverageValues = function (newsCoverageStatus, planningItem, eventItem, g2contentType, defaultDesk, preferredCoverageDesks) {
    var newCoverage = {
        coverage_id: index_1.generateTempId(),
        planning: {
            slugline: lodash_1.get(planningItem, 'slugline'),
            internal_note: lodash_1.get(planningItem, 'internal_note'),
            ednote: lodash_1.get(planningItem, 'ednote'),
            scheduled: lodash_1.get(planningItem, 'planning_date', moment_timezone_1.default()),
            g2_content_type: g2contentType,
            language: lodash_1.get(planningItem, 'language'),
        },
        news_coverage_status: getDefaultCoverageStatus(newsCoverageStatus),
        workflow_status: constants_1.WORKFLOW_STATE.DRAFT,
    };
    if (lodash_1.get(planningItem, constants_1.TO_BE_CONFIRMED_FIELD)) {
        newCoverage[constants_1.TO_BE_CONFIRMED_FIELD] = planningItem[constants_1.TO_BE_CONFIRMED_FIELD];
    }
    if (planningItem) {
        var coverageTime = null;
        if (!lodash_1.get(planningItem, 'event_item')) {
            coverageTime = lodash_1.get(planningItem, 'planning_date', moment_timezone_1.default()).clone();
        }
        else if (eventItem) {
            coverageTime = lodash_1.get(eventItem, 'dates.end', moment_timezone_1.default()).clone();
        }
        if (coverageTime) {
            coverageTime.add(1, 'hour');
            // Only round up to the hour if we didn't derive coverage time from an Event
            if (!eventItem) {
                coverageTime.minute() ?
                    coverageTime.add(1, 'hour').startOf('hour') :
                    coverageTime.startOf('hour');
            }
            if (moment_timezone_1.default().isAfter(coverageTime)) {
                coverageTime = moment_timezone_1.default();
                coverageTime.minute() ? coverageTime.add(1, 'hour').startOf('hour') : coverageTime.startOf('hour');
            }
            newCoverage.planning.scheduled = coverageTime;
        }
        if (eventItem && appConfig_1.appConfig.long_event_duration_threshold > -1) {
            if (appConfig_1.appConfig.long_event_duration_threshold === 0) {
                newCoverage.planning.scheduled = lodash_1.get(eventItem, 'dates.end', moment_timezone_1.default()).clone();
            }
            else {
                var duration = parseInt(moment_timezone_1.default.duration(lodash_1.get(eventItem, 'dates.end').diff(lodash_1.get(eventItem, 'dates.start'))).asHours(), 10);
                if (duration > appConfig_1.appConfig.long_event_duration_threshold) {
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
var setDefaultAssignment = function (coverage, preferredCoverageDesks, g2contentType, defaultDesk) {
    if (lodash_1.get(preferredCoverageDesks, g2contentType)) {
        coverage.assigned_to = { desk: preferredCoverageDesks[g2contentType] };
    }
    else if (g2contentType === 'text' && defaultDesk) {
        coverage.assigned_to = { desk: defaultDesk._id };
    }
    else {
        delete coverage.assigned_to;
    }
};
var modifyPlanningsBeingAdded = function (state, payload) {
    // payload must be an array. If not, we transform
    var plans = Array.isArray(payload) ? payload : [payload];
    // clone plannings
    var plannings = lodash_1.cloneDeep(lodash_1.get(state, 'plannings'));
    plans.forEach(function (planning) {
        self.modifyForClient(planning);
        plannings[index_1.getItemId(planning)] = planning;
    });
    return plannings;
};
var isFeaturedPlanningUpdatedAfterPosting = function (item) {
    if (!item || !lodash_1.get(item, '_updated')) {
        return;
    }
    var updatedDate = moment_timezone_1.default(item._updated);
    var postedDate = moment_timezone_1.default(lodash_1.get(item, 'last_posted_time'));
    return updatedDate.isAfter(postedDate);
};
var shouldFetchFilesForPlanning = function (planning) { return (self.getPlanningFiles(planning).filter(function (f) { return typeof (f) === 'string'
    || f instanceof String; }).length > 0); };
var getAgendaNames = function (item, agendas, onlyEnabled) {
    if (item === void 0) { item = {}; }
    if (agendas === void 0) { agendas = []; }
    if (onlyEnabled === void 0) { onlyEnabled = false; }
    return (lodash_1.get(item, 'agendas', [])
        .map(function (agendaId) { return agendas.find(function (agenda) { return agenda._id === lodash_1.get(agendaId, '_id', agendaId); }); })
        .filter(function (agenda) { return agenda && (!onlyEnabled || agenda.is_enabled); }));
};
var getDateStringForPlanning = function (planning) {
    return lodash_1.get(planning, constants_1.TO_BE_CONFIRMED_FIELD) ?
        planning.planning_date.format(appConfig_1.appConfig.planning.dateformat) + ' @ ' + constants_1.TO_BE_CONFIRMED_SHORT_TEXT :
        index_1.getDateTimeString(lodash_1.get(planning, 'planning_date'), appConfig_1.appConfig.planning.dateformat, appConfig_1.appConfig.planning.timeformat, ' @ ', false);
};
var getCoverageDateText = function (coverage) {
    var coverageDate = lodash_1.get(coverage, 'planning.scheduled');
    return !coverageDate ?
        index_1.gettext('Not scheduled yet') :
        index_1.getDateTimeString(coverageDate, appConfig_1.appConfig.planning.dateformat, appConfig_1.appConfig.planning.timeformat, ' @ ', false);
};
var canAddScheduledUpdateToWorkflow = function (scheduledUpdate, autoAssignToWorkflow, planning, coverage) {
    return index_1.isExistingItem(scheduledUpdate, 'scheduled_update_id') && isCoverageInWorkflow(coverage) &&
        isCoverageDraft(scheduledUpdate) && isCoverageAssigned(scheduledUpdate) && !autoAssignToWorkflow &&
        !index_1.isItemExpired(planning);
};
var setCoverageActiveValues = function (coverage, newsCoverageStatus) {
    lodash_1.set(coverage, 'news_coverage_status', newsCoverageStatus.find(function (s) { return s.qcode === 'ncostat:int'; }));
    lodash_1.set(coverage, 'workflow_status', constants_1.COVERAGES.WORKFLOW_STATE.ACTIVE);
    lodash_1.set(coverage, 'assigned_to.state', constants_1.ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED);
};
var getActiveCoverage = function (updatedCoverage, newsCoverageStatus) {
    var coverage = lodash_1.cloneDeep(updatedCoverage);
    setCoverageActiveValues(coverage, newsCoverageStatus);
    (lodash_1.get(coverage, 'scheduled_updates') || []).forEach(function (s) {
        // Add the scheduled_update to workflow if they have an assignment
        if (lodash_1.get(s, 'assigned_to')) {
            setCoverageActiveValues(s, newsCoverageStatus);
        }
    });
    return coverage;
};
var getPlanningFiles = function (planning) {
    var filesToFetch = lodash_1.get(planning, 'files') || [];
    (lodash_1.get(planning, 'coverages') || []).forEach(function (c) {
        if ((c.planning.files || []).length) {
            filesToFetch = __spreadArrays(filesToFetch, c.planning.files);
        }
        if (c.planning.xmp_file) {
            filesToFetch.push(c.planning.xmp_file);
        }
    });
    return filesToFetch;
};
var showXMPFileUIControl = function (coverage) { return (lodash_1.get(coverage, 'planning.g2_content_type') === 'picture' && (appConfig_1.appConfig.planning_use_xmp_for_pic_assignments ||
    appConfig_1.appConfig.planning_use_xmp_for_pic_slugline)); };
// eslint-disable-next-line consistent-this
var self = {
    canSpikePlanning: canSpikePlanning,
    canUnspikePlanning: canUnspikePlanning,
    canPostPlanning: canPostPlanning,
    canUnpostPlanning: canUnpostPlanning,
    canEditPlanning: canEditPlanning,
    canUpdatePlanning: canUpdatePlanning,
    mapCoverageByDate: exports.mapCoverageByDate,
    getPlanningItemActions: exports.getPlanningItemActions,
    isPlanningLocked: isPlanningLocked,
    isPlanningLockRestricted: isPlanningLockRestricted,
    isPlanAdHoc: isPlanAdHoc,
    modifyCoverageForClient: modifyCoverageForClient,
    isCoverageCancelled: isCoverageCancelled,
    canCancelCoverage: canCancelCoverage,
    canRemoveCoverage: canRemoveCoverage,
    getCoverageReadOnlyFields: getCoverageReadOnlyFields,
    isPlanMultiDay: isPlanMultiDay,
    getPlanningActions: getPlanningActions,
    isNotForPublication: exports.isNotForPublication,
    getPlanningByDate: getPlanningByDate,
    createNewPlanningFromNewsItem: createNewPlanningFromNewsItem,
    createCoverageFromNewsItem: createCoverageFromNewsItem,
    isLockedForAddToPlanning: isLockedForAddToPlanning,
    isCoverageAssigned: isCoverageAssigned,
    isCoverageDraft: isCoverageDraft,
    isCoverageInWorkflow: isCoverageInWorkflow,
    formatAgendaName: formatAgendaName,
    getCoverageIcon: getCoverageIcon,
    getCoverageIconColor: getCoverageIconColor,
    getCoverageWorkflowIcon: getCoverageWorkflowIcon,
    shouldLockPlanningForEdit: shouldLockPlanningForEdit,
    modifyForClient: exports.modifyForClient,
    modifyForServer: modifyForServer,
    defaultPlanningValues: defaultPlanningValues,
    defaultCoverageValues: defaultCoverageValues,
    modifyPlanningsBeingAdded: modifyPlanningsBeingAdded,
    isFeaturedPlanningUpdatedAfterPosting: isFeaturedPlanningUpdatedAfterPosting,
    shouldFetchFilesForPlanning: shouldFetchFilesForPlanning,
    getCoverageContentType: getCoverageContentType,
    getAgendaNames: getAgendaNames,
    getFlattenedPlanningByDate: getFlattenedPlanningByDate,
    canAddCoverageToWorkflow: canAddCoverageToWorkflow,
    getCoverageDateTimeText: getCoverageDateTimeText,
    getDateStringForPlanning: getDateStringForPlanning,
    setDefaultAssignment: setDefaultAssignment,
    getCoverageDateText: getCoverageDateText,
    getActiveCoverage: getActiveCoverage,
    canAddScheduledUpdateToWorkflow: canAddScheduledUpdateToWorkflow,
    getDefaultCoverageStatus: getDefaultCoverageStatus,
    getPlanningFiles: getPlanningFiles,
    showXMPFileUIControl: showXMPFileUIControl,
};
exports.default = self;
//# sourceMappingURL=planning.js.map