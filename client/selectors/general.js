import {get} from 'lodash';
import {createSelector} from 'reselect';
import {getEnabledAgendas, getDisabledAgendas} from '../utils';

export const currentWorkspace = (state) => get(state, 'workspace.currentWorkspace', null);
export const ingestProviders = (state) => get(state, 'ingest.providers');
export const privileges = (state) => get(state, 'privileges');
export const users = (state) => get(state, 'users', []);
export const keywords = (state) => get(state, 'vocabularies.keywords', []);
export const newsCoverageStatus = (state) => get(state, 'vocabularies.newscoveragestatus', []);

export const contentTypes = (state) => get(state, 'vocabularies.g2_content_type', []);

export const currentDeskId = (state) => get(state, 'workspace.currentDeskId', null);
export const desks = (state) => get(state, 'desks', []);
export const templates = (state) => get(state, 'templates', []);


export const modalType = (state) => get(state, 'modal.modalType');
export const modalProps = (state) => get(state, 'modal.modalProps');
export const modalActionInProgress = (state) => !!get(state, 'modal.actionInProgress', false);

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const enabledAgendas = createSelector(
    [agendas],
    (agendas) => getEnabledAgendas(agendas)
);

export const disabledAgendas = createSelector(
    [agendas],
    (agendas) => getDisabledAgendas(agendas)
);

export const session = (state) => get(state, 'session');
export const sessionId = (state) => get(state, 'session.sessionId');
export const userPreferences = (state) => get(state, 'session.userPreferences');

export const currentUserId = createSelector(
    [session],
    (session) => get(session, 'identity._id')
);
