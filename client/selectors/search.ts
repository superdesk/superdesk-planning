import {MAIN} from '../constants';
import {createSelector} from 'reselect';
import {ICombinedSearchParams, IEventSearchParams, IPlanningSearchParams, ISearchParams} from '../interfaces';
import {planningParamsToSearchParams, eventParamsToSearchParams, combinedParamsToSearchParams} from '../utils/search';

export function activeFilter(state): string {
    return state.main?.filter ?? MAIN.FILTERS.COMBINED;
}

interface IStoredSearchParams {
    COMBINED: ICombinedSearchParams;
    EVENTS: IEventSearchParams;
    PLANNING: IPlanningSearchParams;
}

export function allSearchParams(state): IStoredSearchParams {
    return state.main?.search;
}

export const currentSearchParams = createSelector<
    any,
    string,
    IStoredSearchParams,
    ISearchParams
>(
    [activeFilter, allSearchParams],
    (currentFilter, params) => {
        switch (currentFilter) {
        case MAIN.FILTERS.EVENTS:
            return eventParamsToSearchParams(params.EVENTS);
        case MAIN.FILTERS.PLANNING:
            return planningParamsToSearchParams(params.PLANNING);
        case MAIN.FILTERS.COMBINED:
            return combinedParamsToSearchParams(params.COMBINED);
        }
    }
);
