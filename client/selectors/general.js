import {get} from 'lodash';
import {createSelector} from 'reselect';

export const currentWorkspace = (state) => get(state, 'workspace.currentWorkspace', null);
export const session = (state) => get(state, 'session');
export const modalType = (state) => get(state, 'modal.modalType');
export const modalProps = (state) => get(state, 'modal.modalProps');

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const enabledAgendas = createSelector(
    [agendas],
    (agendas) => agendas.filter((agenda) => get(agenda, 'is_enabled', true))
);

export const coverageProviders = (state) => get(state, 'vocabularies.coverage_providers', []);
