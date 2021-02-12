import {get, pickBy, isEqual} from 'lodash';

import {appConfig} from 'appConfig';
import {ICombinedSearchParams} from '../../interfaces';

import {EVENTS_PLANNING, MAIN, SPIKED_STATE} from '../../constants';
import {getTimeZoneOffset} from '../../utils';
import * as selectors from '../../selectors';
import main from '../main';
import {planningApis} from '../../api';

/**
 * Action Dispatcher for query the api for events and planning combined view
 * You can provide one of the following parameters to fetch from the server
 */
const query = (
    {
        advancedSearch = {},
        fulltext,
        spikeState = 'draft',
        page = 1,
        maxResults = MAIN.PAGE_SIZE,
        calendars = [],
        agendas = [],
        places = [],
        filter_id = null,
        includeKilled = false,
    }: ICombinedSearchParams,
    storeTotal = false
) => (
    (dispatch, getState) => (
        planningApis.combined.search({
            full_text: fulltext,
            name: advancedSearch?.name,
            spike_state: spikeState,
            anpa_category: advancedSearch.anpa_category,
            subject: advancedSearch.subject,
            place: places ?? advancedSearch.place,
            slugline: advancedSearch.slugline,
            reference: advancedSearch.reference,
            state: advancedSearch.state,
            posted: advancedSearch.posted,
            date_filter: advancedSearch.dates?.range,
            start_date: advancedSearch.dates?.start,
            end_date: advancedSearch.dates?.end,
            start_of_week: appConfig.start_of_week,
            calendars: calendars,
            agendas: agendas,
            tz_offset: getTimeZoneOffset(),
            page: page,
            max_results: maxResults,
            filter_id: filter_id || selectors.main.currentSearchFilterId(getState()),
            include_killed: includeKilled,
        })
            .then((response) => {
                if (storeTotal) {
                    dispatch(main.setTotal(MAIN.FILTERS.COMBINED, response._meta.total ?? 0));
                }

                if (response._items) {
                    return response._items;
                } else {
                    return Promise.reject('Failed to retrieve items');
                }
            }, (error) => Promise.reject(error))
    )
);

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page = 1, items = [], updateFilter = false) => (
    (dispatch, getState) => {
        const prevParams = selectors.main.lastRequestParams(getState());
        let currentPage = page;
        let params = {
            ...prevParams,
            currentPage,
        };

        if (updateFilter) {
            const filterId = selectors.eventsPlanning.currentFilter(getState());

            params = {
                ...params,
                filter_id: filterId,
            };
        }

        return dispatch(self.query(params, true))
            .then((result) => {
                const totalItems = items.concat(result);

                currentPage++;
                if (get(prevParams, 'page', 1) >= currentPage) {
                    return dispatch(self.refetch(currentPage, totalItems));
                }
                return Promise.resolve(totalItems);
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Saves the combined view filter
 * @param filter
 */
const saveFilter = (filter) => (
    (dispatch, getState, {api}) => {
        let original = {};

        if (filter._id) {
            // existing filter
            const filters = selectors.eventsPlanning.combinedViewFilters(getState());

            original = filters.find((f) => f._id === filter._id);
        }

        // remove all properties starting with _
        // and updates that are the same as original
        let diff = pickBy(filter, (v, k) => (
            !k.startsWith('_') && !isEqual(filter[k], original[k])
        ));

        return api('events_planning_filters').save(original, diff);
    }
);

// eslint-disable-next-line consistent-this
const self = {
    query,
    refetch,
    saveFilter,
};

export default self;
