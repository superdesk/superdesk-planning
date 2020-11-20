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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAgenda = exports.deleteAgenda = exports.agendaNotifications = exports.fetchSelectedAgendaPlannings = exports.askForAddEventToCurrentAgenda = exports.addEventToCurrentAgenda = exports.selectAgenda = exports.fetchAgendaById = exports.fetchAgendas = exports.createOrUpdateAgenda = void 0;
var selectors = __importStar(require("../selectors"));
var lodash_1 = require("lodash");
var constants_1 = require("../constants");
var utils_1 = require("../utils");
var index_1 = require("./index");
var openAgenda = function () { return (function (dispatch) { return (dispatch(index_1.showModal({
    modalType: constants_1.MODALS.MANAGE_AGENDAS,
}))); }); };
exports.openAgenda = openAgenda;
/**
 * Creates or updates an Agenda
 * @param {string} _id - The ID of the Agenda
 * @param {string} name - The name of the Agenda to create
 * @return Promise
 */
var createOrUpdateAgenda = function (newAgenda) { return (function (dispatch, getState, _a) {
    var api = _a.api, notify = _a.notify;
    var originalAgenda = {};
    var agendas = selectors.general.agendas(getState());
    var diff = lodash_1.pick(newAgenda, ['name', 'is_enabled']);
    if (newAgenda._id) {
        originalAgenda = agendas.find(function (agenda) { return agenda._id === newAgenda._id; });
        originalAgenda = lodash_1.cloneDeep(originalAgenda || {});
    }
    return api('agenda').save(originalAgenda, diff)
        .then(function (agenda) {
        notify.success('The agenda has been created/updated.');
        dispatch(addOrReplaceAgenda(agenda));
    }, function (error) {
        var errorMessage = lodash_1.get(error, 'data._issues.name.unique') ?
            utils_1.gettext('An agenda with this name already exists') : utils_1.getErrorMessage(error);
        notify.error(errorMessage);
        return Promise.reject(error);
    });
}); };
exports.createOrUpdateAgenda = createOrUpdateAgenda;
/**
 * Action for adding or updating an Agenda in the redux store
 * @param {object} agenda - The agenda object to send to the reducer
 * @return object
 */
var addOrReplaceAgenda = function (agenda) { return ({
    type: constants_1.AGENDA.ACTIONS.ADD_OR_REPLACE_AGENDA,
    payload: agenda,
}); };
/**
 * Action for storing the list of Agenda's in the redux store
 * @param agendas
 * @return object
 */
var receiveAgendas = function (agendas) { return ({
    type: constants_1.AGENDA.ACTIONS.RECEIVE_AGENDAS,
    payload: agendas,
}); };
/**
 * Action dispatcher that changes the selected Agenda to the one provided.
 * This also closes the PlanningEditor and fetches the plannings that are
 * associated with the agenda
 * @param {string} agendaId - The ID of the Agenda
 * @return arrow function
 */
var selectAgenda = function (agendaId, params) {
    if (params === void 0) { params = {}; }
    return (function (dispatch, getState, _a) {
        var $timeout = _a.$timeout, $location = _a.$location;
        var agendas = selectors.planning.agendas(getState());
        // If the provided Agenda does not exist, then select all planning instead
        if (agendaId !== constants_1.AGENDA.FILTER.ALL_PLANNING &&
            agendaId !== constants_1.AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
            lodash_1.findIndex(agendas, function (agenda) { return agenda._id === agendaId; }) < 0) {
            return dispatch(selectAgenda(constants_1.AGENDA.FILTER.ALL_PLANNING, params));
        }
        // save in store selected agenda
        dispatch({
            type: constants_1.AGENDA.ACTIONS.SELECT_AGENDA,
            payload: agendaId,
        });
        // update the url (deep linking)
        $timeout(function () { return ($location.search('agenda', agendaId)); });
        // reload the plannings list
        dispatch(index_1.main.setUnsetUserInitiatedSearch(true));
        return dispatch(fetchSelectedAgendaPlannings(params))
            .then(function (data) { return Promise.resolve(data); })
            .finally(function () {
            dispatch(index_1.main.setUnsetUserInitiatedSearch(false));
        });
    });
};
exports.selectAgenda = selectAgenda;
/**
 * Action dispatcher that fetches all Agendas using performFetchRequest
 * @return arrow function
 */
var fetchAgendas = function (query) {
    if (query === void 0) { query = {}; }
    return (function (dispatch, getState, _a) {
        var api = _a.api, notify = _a.notify;
        dispatch({ type: constants_1.AGENDA.ACTIONS.REQUEST_AGENDAS });
        return api('agenda').query({
            source: query.source,
            where: query.where,
            max_results: 200,
        })
            .then(function (data) {
            dispatch(receiveAgendas(lodash_1.sortBy(data._items, [function (a) {
                    return a.name.toLowerCase();
                },
            ])));
        }, function (error) {
            notify.error(utils_1.getErrorMessage(error, 'There was a problem, agendas could not be fetched'));
        });
    });
};
exports.fetchAgendas = fetchAgendas;
/**
 * Action Dispatcher that fetches an Agenda by ID
 * and adds it to the redux store
 * @param {string} _id - The ID of the Agenda to fetch
 */
var fetchAgendaById = function (_id) { return (function (dispatch, getState, _a) {
    var api = _a.api, notify = _a.notify;
    return (api('agenda').getById(_id)
        .then(function (agenda) {
        dispatch(addOrReplaceAgenda(agenda));
        return Promise.resolve(agenda);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, 'Failed to fetch an Agenda!'));
    }));
}); };
exports.fetchAgendaById = fetchAgendaById;
/**
 * Action factory that ask for creating a planning item from the supplied event,
 * then calls addEventToCurrentAgenda
 * @param {array} events - The events needed to create the planning items
 */
var askForAddEventToCurrentAgenda = function (events) { return (function (dispatch, getState) {
    var title = lodash_1.get(events, 'length', 0) === 1 ?
        utils_1.gettext('Add this event to the planning list?') :
        utils_1.gettext("Add these " + events.length + " events to the planning list?");
    return dispatch(index_1.showModal({
        modalType: constants_1.MODALS.ITEM_ACTIONS_MODAL,
        modalProps: {
            events: events,
            actionType: constants_1.EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label,
            title: title,
        },
    }));
}); };
exports.askForAddEventToCurrentAgenda = askForAddEventToCurrentAgenda;
/**
 * Action dispatcher that creates a planning item from the supplied event,
 * then adds this to the currently selected agenda
 * @param {array} events - The event used to create the planning item
 * @param {object} planningDate - The date to set for the new Planning item
 * @param {boolean} openInEditor - If true, opens the new Planning item in the Editor
 * @return Promise
 */
var addEventToCurrentAgenda = function (events, planningDate, openInEditor, agendas, openInModal) {
    if (planningDate === void 0) { planningDate = null; }
    if (openInEditor === void 0) { openInEditor = false; }
    if (agendas === void 0) { agendas = null; }
    if (openInModal === void 0) { openInModal = false; }
    return (function (dispatch, getState, _a) {
        var notify = _a.notify;
        var updatesAgendas = lodash_1.get(agendas, 'length', 0) > 0 ? agendas.map(function (a) { return a._id; }) : [];
        var eventsList = events;
        var chunkSize = 5;
        var promise = Promise.resolve();
        var plannings = [];
        if (!agendas) {
            var currentAgenda = selectors.planning.currentAgenda(getState());
            if (currentAgenda && currentAgenda.is_enabled) {
                updatesAgendas.push(currentAgenda);
            }
        }
        if (!Array.isArray(events)) {
            eventsList = [events];
        }
        var _loop_1 = function (i) {
            var eventsChunk = eventsList.slice(i * chunkSize, (i + 1) * chunkSize);
            promise = promise.then(function () { return (Promise.all(eventsChunk.map(function (event) { return (dispatch(createPlanningFromEvent(event, planningDate, updatesAgendas))); }))
                .then(function (data) { return data.forEach(function (p) { return plannings.push(p); }); })
                .then(function () {
                notify.pop();
                notify.success(utils_1.gettext("created " + plannings.length + "/" + eventsList.length + " planning item(s)"));
            })); });
        };
        for (var i = 0; i < Math.ceil(eventsList.length / chunkSize); i++) {
            _loop_1(i);
        }
        // reload the plannings of the current calendar
        return promise
            .then(function () {
            var firstPlanning = utils_1.planningUtils.modifyForClient(plannings[0]);
            notify.pop();
            notify.success(utils_1.gettext("created " + eventsList.length + " planning item."));
            return openInEditor ?
                dispatch(index_1.main.openForEdit(firstPlanning, !openInModal, openInModal)) :
                Promise.resolve(firstPlanning);
        })
            .then(function () { return dispatch(fetchSelectedAgendaPlannings()); });
    });
};
exports.addEventToCurrentAgenda = addEventToCurrentAgenda;
/**
 * Action dispatcher that creates a planning item from the supplied event,
 * @param {IEventItem} event - The event used to create the planning item
 * @param {Moment} planningDate - The date to set for the new Planning item
 * @param {Array<string>} agendas - The list of agendas to assign the new item
 * @return Promise
 */
var createPlanningFromEvent = function (event, planningDate, agendas) {
    if (agendas === void 0) { agendas = []; }
    return (function (dispatch) { return (dispatch(index_1.planning.api.save({}, {
        event_item: event._id,
        slugline: event.slugline,
        planning_date: planningDate || event._sortDate || event.dates.start,
        internal_note: event.internal_note,
        name: event.name,
        place: event.place,
        subject: event.subject,
        anpa_category: event.anpa_category,
        description_text: event.definition_short,
        ednote: event.ednote,
        agendas: agendas,
        language: event.language,
    }))); });
};
/**
 * Action dispatcher that fetches all planning items for the
 * currently selected agenda
 * @return arrow function
 */
var fetchSelectedAgendaPlannings = function (params) {
    if (params === void 0) { params = {}; }
    return (function (dispatch, getState, _a) {
        var $location = _a.$location, $timeout = _a.$timeout;
        var agendaId = selectors.planning.currentAgendaId(getState());
        if (!agendaId) {
            dispatch(index_1.planning.ui.clearList());
            return Promise.resolve();
        }
        var filters = __assign(__assign({}, selectors.planning.getPlanningFilterParams(getState())), params);
        return dispatch(index_1.planning.ui.fetchToList(filters))
            .then(function (result) {
            $timeout(function () { return $location.search('searchParams', JSON.stringify(params)); });
            return result;
        });
    });
};
exports.fetchSelectedAgendaPlannings = fetchSelectedAgendaPlannings;
/**
 * Action dispatcher that deletes agenda
 * @return promise
 */
var deleteAgenda = function (agenda) { return (function (dispatch, getState, _a) {
    var api = _a.api, notify = _a.notify;
    return (api('agenda').remove(agenda)
        .then(function () {
        notify.success('The agenda has been deleted.');
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, 'There was a problem, agenda could not be deleted.'));
    }));
}); };
exports.deleteAgenda = deleteAgenda;
// WebSocket Notifications
/**
 * Action Event when a new Agenda is created or updated
 * @param _e
 * @param {object} data - Agenda and User IDs
 */
var onAgendaCreatedOrUpdated = function (_e, data) { return (function (dispatch) {
    if (data && data.item) {
        return dispatch(fetchAgendaById(data.item));
    }
}); };
/**
 * Action Event when a Agenda is deleted
 */
var onAgendaDeleted = function (_e, data) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    if (data && data.item) {
        var currentAgendaId = selectors.planning.currentAgendaId(getState());
        if (currentAgendaId === data.item) {
            dispatch(selectAgenda(constants_1.AGENDA.FILTER.ALL_PLANNING));
            notify.warning(utils_1.gettext('The Agenda you were viewing was deleted!'));
        }
    }
    dispatch(fetchAgendas());
}); };
// Map of notification name and Action Event to execute
var agendaNotifications = {
    'agenda:created': function () { return (onAgendaCreatedOrUpdated); },
    'agenda:updated': function () { return (onAgendaCreatedOrUpdated); },
    'agenda:deleted': function () { return (onAgendaDeleted); },
};
exports.agendaNotifications = agendaNotifications;
//# sourceMappingURL=agenda.js.map