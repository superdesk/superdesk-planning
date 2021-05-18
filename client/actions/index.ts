export * from './modal';
export * from './agenda';
export * from './assignments';
import * as editors from './editor';

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
import users from './users';
import * as modalActions from './modal';
import contacts from './contacts';
import otherNotifications from './notifications';

import {currentWorkspace} from '../selectors/general';
import {RESET_STORE, INIT_STORE, WORKSPACE} from '../constants';

const resetStore = () => ({type: RESET_STORE});

function initStore(workspace: string) {
    return (dispatch, getState) => {
        const previousWorkspace = currentWorkspace(getState());

        // If the PlanningDetails AuthoringWidget is loaded at the same time as Assignments view
        // then don't bother about changing the workspace in the store
        // This works because there is no custom workspace logic for the PlanningDetails widget view
        // (specifically from websocket notifications)
        if (!(previousWorkspace === WORKSPACE.ASSIGNMENTS && workspace === WORKSPACE.AUTHORING_WIDGET)) {
            dispatch({
                type: INIT_STORE,
                payload: workspace,
            });
        }
    };
}

/**
 * Map WebSocket Notifications to Action Event
 * This is used by client.controller.PlanningController to listen for
 * the WebSocket Notifications from the server, and dispatch events
 **/
const notifications = {
    ...agendaNotifications,
    ...planning.notifications.events,
    ...events.notifications.events,
    ...eventsPlanning.notifications.events,
    ...assignments.notifications.events,
    ...otherNotifications.events,
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
    users,
    modalActions,
    contacts,
    editors,
};
