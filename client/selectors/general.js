import {get} from 'lodash';

export const currentWorkspace = (state) => get(state, 'workspace.currentWorkspace', null);
export const session = (state) => get(state, 'session');
export const agendas = (state) => get(state, 'agenda.agendas', []);
export const modalType = (state) => get(state, 'modal.modalType');
export const modalProps = (state) => get(state, 'modal.modalProps');
