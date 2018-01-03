import {get} from 'lodash';

export const getDateFormat = (state) =>
    get(state, 'config.model.dateformat') ||
    get(state, 'config.view.dateformat');

export const getTimeFormat = (state) =>
    get(state, 'config.shortTimeFormat') ||
    get(state, 'config.view.timeformat');
