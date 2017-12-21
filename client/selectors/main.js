import {createSelector} from 'reselect';
import {get} from 'lodash';
import {MAIN} from '../constants';
import {orderedEvents} from './events';
import {orderedPlanningList} from './planning';

export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);
export const previewItem = (state) => get(state, 'main.previewItem', null);
export const editItem = (state) => get(state, 'main.editItem', null);
export const itemGroups = createSelector(
    [activeFilter, orderedEvents, orderedPlanningList],
    (filter, events, plans) => {
        switch (filter) {
        case MAIN.FILTERS.COMBINED:
            return [];
        case MAIN.FILTERS.EVENTS:
            return events;
        case MAIN.FILTERS.PLANNING:
            return plans;
        }

        return [];
    }
);
