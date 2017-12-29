import {get} from 'lodash';

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const modalType = (state) => get(state, 'modal.modalType');
export const modalProps = (state) => get(state, 'modal.modalProps');
export const dateFormat = (state) => get(state, 'config.model.dateformat') ||
    get(state, 'config.view.dateformat');
export const timeFormat = (state) => get(state, 'config.shortTimeFormat') ||
    get(state, 'config.view.timeformat');
