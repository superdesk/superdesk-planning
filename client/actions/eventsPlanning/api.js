import {get} from 'lodash';
import {MAIN, SPIKED_STATE} from '../../constants';
import {planningUtils, eventUtils, getDateTimeElasticFormat} from '../../utils';
import * as selectors from '../../selectors';
import main from '../main';

/**
 * Action Dispatcher for query the api for events and planning combined view
 * You can provide one of the following parameters to fetch from the server
 */
const query = (
    {
        advancedSearch = {},
        fulltext,
        spikeState = SPIKED_STATE.NOT_SPIKED,
        page = 1,
        maxResults = MAIN.PAGE_SIZE,
    },
    storeTotal = false
) => (
    (dispatch, getState, {api}) => {
        let search = {
            full_text: fulltext,
            spike_state: spikeState,
            anpa_category: get(advancedSearch, 'anpa_category.length', 0) ?
                JSON.stringify(get(advancedSearch, 'anpa_category', []).map((c) => c.qcode)) : null,
            subject: get(advancedSearch, 'subject.length', 0) ?
                JSON.stringify(get(advancedSearch, 'subject', []).map((s) => s.qcode)) : null,
            place: get(advancedSearch, 'place.length', 0) > 0 ?
                JSON.stringify(get(advancedSearch, 'place', []).map((p) => p.qcode)) : null,
            slugline: advancedSearch.slugline,
            state: get(advancedSearch, 'state.length', 0) ?
                JSON.stringify(get(advancedSearch, 'state', []).map((c) => c.qcode)) : null,
            posted: advancedSearch.posted,
            date_filter: get(advancedSearch, 'dates.range'),
            start_date: get(advancedSearch, 'dates.start') ?
                getDateTimeElasticFormat(get(advancedSearch, 'dates.start')) : null,
            end_date: get(advancedSearch, 'dates.end') ?
                getDateTimeElasticFormat(get(advancedSearch, 'dates.end')) : null,
            start_of_week: selectors.config.getStartOfWeek(getState()),
            page: page,
            max_results: maxResults,
        };

        // Query the API
        return api('events_planning_search').query(search)
            .then((data) => {
                if (storeTotal) {
                    dispatch(main.setTotal(MAIN.FILTERS.COMBINED, get(data, '_meta.total')));
                }

                if (get(data, '_items')) {
                    data._items.forEach((item) => {
                        if (item.type === 'event') {
                            eventUtils.modifyForClient(item);
                            return;
                        }
                        planningUtils.modifyForClient(item);
                    });

                    return get(data, '_items', []);
                } else {
                    return Promise.reject('Failed to retrieve items');
                }
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page = 1, items = []) => (
    (dispatch, getState) => {
        const prevParams = selectors.main.lastRequestParams(getState());
        let currentPage = page;
        let params = {
            ...prevParams,
            currentPage,
        };

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

// eslint-disable-next-line consistent-this
const self = {
    query,
    refetch,
};

export default self;