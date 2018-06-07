import {pick, get} from 'lodash';
import {MAIN, SPIKED_STATE} from '../../constants';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {planningUtils, eventUtils} from '../../utils';
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
        const filter = {};

        let search = {
            fulltext: fulltext,
            spikeState: spikeState,
            adHocPlanning: true, // only adhoc planning items,
            advancedSearch: pick(advancedSearch,
                ['anpa_category', 'subject', 'slugline', 'posted', 'spikeState', 'state', 'dates']),
        };

        const planningCriteria = planningApi.getCriteria(search);
        const eventsCriteria = eventsApi.getCriteria(search);

        filter.or = {
            filters: [
                {
                    and: {
                        filters: [
                            {type: {value: 'events'}},
                            eventsCriteria.filter,
                        ],
                    },
                },
                {
                    and: {
                        filters: [
                            {type: {value: 'planning'}},
                            planningCriteria.filter,
                        ],
                    },
                },
            ],
        };

        const sortField = '_planning_schedule.scheduled';
        const sortParams = {
            [sortField]: {
                order: 'asc',
                nested_path: '_planning_schedule',
            },
        };

        // Query the API
        return api('planning_search').query({
            source: JSON.stringify({
                query: planningCriteria.query,
                filter: filter,
                sort: [sortParams],
                size: maxResults,
                from: (page - 1) * maxResults,
            }),
            timestamp: new Date(),
        })
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