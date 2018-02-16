export * from './modal';
export * from './agenda';
export * from './assignments';

import planning from './planning/index';
import events from './events/index';
import locks from './locks';
import assignments from './assignments/index';
import autosave from './autosave';
import main from './main';
import locations from './locations';
import eventsPlanning from './eventsPlanning/index';
import multiSelect from './multiSelect';
import {agendaNotifications} from './agenda';

import {RESET_STORE, INIT_STORE} from '../constants';

const resetStore = () => ({type: RESET_STORE});
const initStore = (workspace) => ({
    type: INIT_STORE,
    payload: workspace,
});

/**
 * Map WebSocket Notifications to Action Event
 * This is used by client.controller.PlanningController to listen for
 * the WebSocket Notifications from the server, and dispatch events
 **/
const notifications = {
    ...agendaNotifications,
    ...planning.notifications.events,
    ...events.notifications.events,
    ...assignments.notifications.events
};

export {
    planning,
    notifications,
    events,
    resetStore,
    initStore,
    locks,
    assignments,
    autosave,
    main,
    locations,
    eventsPlanning,
    multiSelect,
};
