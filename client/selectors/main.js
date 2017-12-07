import {createSelector} from 'reselect';
import {get} from 'lodash';
import {MAIN} from '../constants';
import {orderedEvents} from './events';

export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);

export const itemGroups = createSelector(
    [activeFilter, orderedEvents],
    (filter, events) => {
        switch (filter) {
        case MAIN.FILTERS.COMBINED:
            return [];
        case MAIN.FILTERS.EVENTS:
            return events;
        case MAIN.FILTERS.PLANNING:
            return [];
        }

        return [];
    }
);
