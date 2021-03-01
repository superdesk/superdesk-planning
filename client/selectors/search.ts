import {createSelector} from 'reselect';
import {ISearchParams, IPlanningAppState, PLANNING_VIEW} from '../interfaces';
import {planningParamsToSearchParams, eventParamsToSearchParams, combinedParamsToSearchParams} from '../utils/search';

export function activeFilter(state: IPlanningAppState): PLANNING_VIEW {
    return state.main?.filter ?? PLANNING_VIEW.COMBINED;
}

export function allSearchParams(state: IPlanningAppState) {
    return state.main?.search;
}

export const currentSearchParams = createSelector<
    IPlanningAppState,
    PLANNING_VIEW,
    IPlanningAppState['main']['search'],
    ISearchParams
>(
    [activeFilter, allSearchParams],
    (currentFilter, params) => {
        switch (currentFilter) {
        case PLANNING_VIEW.EVENTS:
            return eventParamsToSearchParams(params.EVENTS.currentSearch);
        case PLANNING_VIEW.PLANNING:
            return planningParamsToSearchParams(params.PLANNING.currentSearch);
        case PLANNING_VIEW.COMBINED:
            return combinedParamsToSearchParams(params.COMBINED.currentSearch);
        }
    }
);
