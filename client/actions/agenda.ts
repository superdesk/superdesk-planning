import * as selectors from '../selectors';
import {cloneDeep, pick, get, sortBy, findIndex} from 'lodash';
import {Moment} from 'moment';

import {IEventItem, IPlanningItem, IAgenda} from '../interfaces';

import {AGENDA, MODALS, EVENTS} from '../constants';
import {getErrorMessage, gettext, planningUtils} from '../utils';
import {planning, showModal, main} from './index';

const openAgenda = () => (
    (dispatch) => (
        dispatch(showModal({
            modalType: MODALS.MANAGE_AGENDAS,
        }))
    )
);

/**
 * Creates or updates an Agenda
 * @param {string} _id - The ID of the Agenda
 * @param {string} name - The name of the Agenda to create
 * @return Promise
 */
const createOrUpdateAgenda = (newAgenda) => (
    (dispatch, getState, {api, notify}) => {
        let originalAgenda = {};
        const agendas = selectors.general.agendas(getState());
        let diff = pick(newAgenda, ['name', 'is_enabled']);

        if (newAgenda._id) {
            originalAgenda = agendas.find((agenda) => agenda._id === newAgenda._id);
            originalAgenda = cloneDeep(originalAgenda || {});
        }

        return api('agenda').save(originalAgenda, diff)
            .then((agenda) => {
                notify.success('The agenda has been created/updated.');
                dispatch(addOrReplaceAgenda(agenda));
            }, (error) => {
                let errorMessage = get(error, 'data._issues.name.unique') ?
                    gettext('An agenda with this name already exists') : getErrorMessage(error);

                notify.error(errorMessage);
                return Promise.reject(error);
            });
    }
);

/**
 * Action for adding or updating an Agenda in the redux store
 * @param {object} agenda - The agenda object to send to the reducer
 * @return object
 */
const addOrReplaceAgenda = (agenda) => ({
    type: AGENDA.ACTIONS.ADD_OR_REPLACE_AGENDA,
    payload: agenda,
});

/**
 * Action for storing the list of Agenda's in the redux store
 * @param agendas
 * @return object
 */
const receiveAgendas = (agendas) => ({
    type: AGENDA.ACTIONS.RECEIVE_AGENDAS,
    payload: agendas,
});

/**
 * Action dispatcher that changes the selected Agenda to the one provided.
 * This also closes the PlanningEditor and fetches the plannings that are
 * associated with the agenda
 * @param {string} agendaId - The ID of the Agenda
 * @return arrow function
 */
const selectAgenda = (agendaId, params = {}) => (
    (dispatch, getState, {$timeout, $location}) => {
        const agendas = selectors.planning.agendas(getState());

        // If the provided Agenda does not exist, then select all planning instead
        if (agendaId !== AGENDA.FILTER.ALL_PLANNING &&
            agendaId !== AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
            findIndex(agendas, (agenda) => agenda._id === agendaId) < 0
        ) {
            return dispatch(
                selectAgenda(AGENDA.FILTER.ALL_PLANNING, params)
            );
        }

        // save in store selected agenda
        dispatch({
            type: AGENDA.ACTIONS.SELECT_AGENDA,
            payload: agendaId,
        });

        // update the url (deep linking)
        $timeout(() => ($location.search('agenda', agendaId)));

        // reload the plannings list
        dispatch(main.setUnsetUserInitiatedSearch(true));
        return dispatch(fetchSelectedAgendaPlannings(params))
            .then((data) => Promise.resolve(data))
            .finally(() => {
                dispatch(main.setUnsetUserInitiatedSearch(false));
            });
    }
);

/**
 * Action dispatcher that fetches all Agendas using performFetchRequest
 * @return arrow function
 */
const fetchAgendas = (query = {}) => (
    (dispatch, getState, {api, notify}) => {
        dispatch({type: AGENDA.ACTIONS.REQUEST_AGENDAS});
        return api('agenda').query({
            source: query.source,
            where: query.where,
            max_results: 200,
        })
            .then((data) => {
                dispatch(receiveAgendas(sortBy(data._items, [(a) =>
                    a.name.toLowerCase(),
                ])));
            }, (error) => {
                notify.error(getErrorMessage(
                    error,
                    'There was a problem, agendas could not be fetched'
                ));
            });
    }
);

/**
 * Action Dispatcher that fetches an Agenda by ID
 * and adds it to the redux store
 * @param {string} _id - The ID of the Agenda to fetch
 */
const fetchAgendaById = (_id) => (
    (dispatch, getState, {api, notify}) => (
        api('agenda').getById(_id)
            .then((agenda) => {
                dispatch(addOrReplaceAgenda(agenda));
                return Promise.resolve(agenda);
            }, (error) => {
                notify.error(getErrorMessage(error, 'Failed to fetch an Agenda!'));
            })
    )
);

/**
 * Action factory that ask for creating a planning item from the supplied event,
 * then calls addEventToCurrentAgenda
 * @param {array} events - The events needed to create the planning items
 */
const askForAddEventToCurrentAgenda = (events) => (
    (dispatch, getState) => {
        const title = get(events, 'length', 0) === 1 ?
            gettext('Add this event to the planning list?') :
            gettext(`Add these ${events.length} events to the planning list?`);

        return dispatch(showModal({
            modalType: MODALS.ITEM_ACTIONS_MODAL,
            modalProps: {
                events: events,
                actionType: EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName,
                title: title,
            },
        }));
    }
);

/**
 * Action dispatcher that creates a planning item from the supplied event,
 * then adds this to the currently selected agenda
 * @param {array} events - The event used to create the planning item
 * @param {object} planningDate - The date to set for the new Planning item
 * @param {boolean} openInEditor - If true, opens the new Planning item in the Editor
 * @return Promise
 */
const addEventToCurrentAgenda = (
    events: Array<IEventItem>,
    planningDate: Moment = null,
    openInEditor: boolean = false,
    agendas: Array<IAgenda> = null,
    openInModal: boolean = false
) => (
    (dispatch, getState, {notify}) => {
        let updatesAgendas = get(agendas, 'length', 0) > 0 ? agendas.map((a) => a._id) : [];
        let eventsList = events;
        const chunkSize = 5;
        let promise = Promise.resolve();
        let plannings = [];

        if (!agendas) {
            const currentAgenda = selectors.planning.currentAgenda(getState());

            if (currentAgenda && currentAgenda.is_enabled) {
                updatesAgendas.push(currentAgenda);
            }
        }

        if (!Array.isArray(events)) {
            eventsList = [events];
        }

        for (let i = 0; i < Math.ceil(eventsList.length / chunkSize); i++) {
            let eventsChunk = eventsList.slice(i * chunkSize, (i + 1) * chunkSize);

            promise = promise.then(() => (
                Promise.all(
                    eventsChunk.map((event) => (
                        dispatch(createPlanningFromEvent(event, planningDate, updatesAgendas))
                    ))
                )
                    .then((data) => data.forEach((p) => plannings.push(p)))
                    .then(() => {
                        notify.pop();
                        notify.success(
                            gettext(`created ${plannings.length}/${eventsList.length} planning item(s)`)
                        );
                    })
            ));
        }
        // reload the plannings of the current calendar
        return promise
            .then(() => {
                const firstPlanning = planningUtils.modifyForClient(plannings[0]);

                notify.pop();
                notify.success(gettext(`created ${eventsList.length} planning item.`));
                return openInEditor ?
                    dispatch(main.openForEdit(firstPlanning, !openInModal, openInModal)) :
                    Promise.resolve(firstPlanning);
            })
            .then(() => dispatch(fetchSelectedAgendaPlannings()));
    }
);

/**
 * Action dispatcher that creates a planning item from the supplied event,
 * @param {object} event - The event used to create the planning item
 * @param {object} planningDate - The date to set for the new Planning item
 * @return Promise
 */
const createPlanningFromEvent = (
    event: IEventItem,
    planningDate: Moment = null,
    agendas: Array<string> = []
) => (
    (dispatch) => (
        dispatch(planning.api.save({}, {
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
        }))
    )
);

/**
 * Action dispatcher that fetches all planning items for the
 * currently selected agenda
 * @return arrow function
 */
const fetchSelectedAgendaPlannings = (params = {}) => (
    (dispatch, getState, {$location, $timeout}) => {
        const agendaId = selectors.planning.currentAgendaId(getState());

        if (!agendaId) {
            dispatch(planning.ui.clearList());
            return Promise.resolve();
        }

        const filters = {
            ...selectors.planning.getPlanningFilterParams(getState()),
            ...params,
        };

        return dispatch(planning.ui.fetchToList(filters))
            .then((result) => {
                $timeout(() => $location.search('searchParams', JSON.stringify(params)));
                return result;
            });
    }
);

/**
 * Action dispatcher that deletes agenda
 * @return promise
 */
const deleteAgenda = (agenda) => (
    (dispatch, getState, {api, notify}) => (
        api('agenda').remove(agenda)
            .then(() => {
                notify.success('The agenda has been deleted.');
            }, (error) => {
                notify.error(getErrorMessage(
                    error,
                    'There was a problem, agenda could not be deleted.'
                ));
            })
    )
);

// WebSocket Notifications
/**
 * Action Event when a new Agenda is created or updated
 * @param _e
 * @param {object} data - Agenda and User IDs
 */
const onAgendaCreatedOrUpdated = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(fetchAgendaById(data.item));
        }
    }
);

/**
 * Action Event when a Agenda is deleted
 */
const onAgendaDeleted = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (data && data.item) {
            const currentAgendaId = selectors.planning.currentAgendaId(getState());

            if (currentAgendaId === data.item) {
                dispatch(selectAgenda(AGENDA.FILTER.ALL_PLANNING));

                notify.warning(
                    gettext('The Agenda you were viewing was deleted!')
                );
            }
        }

        dispatch(fetchAgendas());
    }
);

// Map of notification name and Action Event to execute
const agendaNotifications = {
    'agenda:created': () => (onAgendaCreatedOrUpdated),
    'agenda:updated': () => (onAgendaCreatedOrUpdated),
    'agenda:deleted': () => (onAgendaDeleted),
};

export {
    createOrUpdateAgenda,
    fetchAgendas,
    fetchAgendaById,
    selectAgenda,
    addEventToCurrentAgenda,
    askForAddEventToCurrentAgenda,
    fetchSelectedAgendaPlannings,
    agendaNotifications,
    deleteAgenda,
    openAgenda,
};
