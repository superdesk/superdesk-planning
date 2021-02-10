import {get, isEmpty} from 'lodash';
import eventsAndPlanningApi from './api';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {EVENTS_PLANNING, MAIN, ITEM_TYPE, MODALS} from '../../constants';
import * as selectors from '../../selectors';
import {getItemType, dispatchUtils, getErrorMessage} from '../../utils';
import main from '../main';
import {gettext} from '../../utils';
import {showModal} from '../index';

/**
 * Action to fetch events and planning based on the params
 * @param {object} params - Params Object
 * @return object - Object containing array of events and planning
 */
const fetch = (params = {}) => (
    (dispatch, getState, {$location, $timeout}) => {
        dispatch(self.requestEventsPlanning(params));

        return dispatch(eventsAndPlanningApi.query(params, true))
            .then((results) => {
                dispatch(self.receiveEventsPlanning(results));
                dispatch(self.setInList(results));
                // update the url (deep linking)
                $timeout(() => $location.search('searchParams', JSON.stringify(params)));
                return results;
            });
    }
);

/**
 * Action to load next page of the events and planning combined view
 * @return object - Object containing array of events and planning
 */
const loadMore = () => (
    (dispatch, getState) => {
        const previousParams = selectors.main.lastRequestParams(getState());
        const totalItems = selectors.main.combinedTotalItems(getState());
        const eventsPlanningIdsList = selectors.eventsPlanning.getEventsPlanningList(getState());

        if (totalItems === get(eventsPlanningIdsList, 'length', 0)) {
            return Promise.resolve();
        }

        const params = {
            ...previousParams,
            page: get(previousParams, 'page', 1) + 1,
        };

        return dispatch(eventsAndPlanningApi.query(params, true))
            .then((results) => {
                if (get(results, 'length', 0) === MAIN.PAGE_SIZE) {
                    dispatch(self.requestEventsPlanning(params));
                }

                dispatch(self.receiveEventsPlanning(results));
                dispatch(self.addToList(results));
                return results;
            });
    }
);

const refetch = (updateFilter = false) => (
    (dispatch, getState) => {
        var previewId = selectors.main.previewId(getState());
        var previewType = selectors.main.previewType(getState());

        if (!selectors.main.isEventsPlanningView(getState())) {
            return Promise.resolve();
        }
        if (previewId && previewType === 'planning') {
            dispatch(main.fetchItemHistory({_id: previewId, type: ITEM_TYPE.PLANNING}));
        }

        return dispatch(eventsAndPlanningApi.refetch(1, [], updateFilter))
            .then((results) => {
                dispatch(self.receiveEventsPlanning(results));
                dispatch(self.setInList(results));
                return results;
            });
    }
);

/**
 * Action refetch planning item in combined view
 *
 */
const refetchPlanning = (planningId) => (
    (dispatch, getState) => {
        const storedPlannings = selectors.planning.storedPlannings(getState());
        const plan = get(storedPlannings, planningId);
        const eventId = get(plan, 'event_item');
        const events = selectors.eventsPlanning.getRelatedPlanningsList(getState()) || {};

        if (!selectors.main.isEventsPlanningView(getState()) || !eventId ||
            isEmpty(events) || !get(events, eventId)) {
            return Promise.resolve();
        }

        return dispatch(planningApi.loadPlanningById(planningId));
    }
);

/**
 * Schedule the refetch to run after one second and avoid any other refetch
 */
let nextRefetch = {
    called: 0,
};
const scheduleRefetch = (updateFilter = false) => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(updateFilter), nextRefetch)
        )
    )
);

const receiveEventsPlanning = (items = []) => (
    (dispatch) => {
        const events = [];
        const plannings = [];

        items.forEach((item) => {
            const type = getItemType(item);

            if (type === ITEM_TYPE.EVENT) {
                events.push(item);
            } if (type === ITEM_TYPE.PLANNING) {
                plannings.push(item);
            }
        });

        dispatch(eventsApi.receiveEvents(events));
        dispatch(planningApi.receivePlannings(plannings));
        return Promise.resolve();
    }
);

const setInList = (items = []) => ({
    type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
    payload: items,
});

const addToList = (items = []) => ({
    type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
    payload: items,
});

const clearList = () => ({
    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST,
});

/**
 * Action to load related plannings for an event
 * @param {object} event - Event Object
 * @return array - Array of planning items related to the event
 */
const showRelatedPlannings = (event) => (
    (dispatch, getState) => dispatch(eventsApi.loadAssociatedPlannings(event))
        .then((plannings) => {
            dispatch(self._showRelatedPlannings(event));
            return Promise.resolve(plannings);
        })
);

const requestEventsPlanning = (payload = {}) => ({
    type: MAIN.ACTIONS.REQUEST,
    payload: {[MAIN.FILTERS.COMBINED]: payload},
});

const _showRelatedPlannings = (event) => ({
    type: EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS,
    payload: event,
});

/**
 * Saves the combined view filter
 * @param filter
 */
const saveFilter = (filter) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsAndPlanningApi.saveFilter(filter))
            .then((result) => {
                notify.success(
                    gettext(
                        'The Events and Planning view filter is {{action}}.',
                        {action: filter._id ? gettext('updated') : gettext('created')}
                    )
                );

                return result;
            }, (error) => {
                let errorMessage = get(error, 'data._issues.name.unique') ?
                    gettext('The Events and Planning view filter with this name already exists') :
                    getErrorMessage(error, gettext('Failed to create/update Events and Planning view filter'));

                notify.error(errorMessage);
                return Promise.reject(error);
            })
    )
);


/**
 * delete the combined view filter
 * @param filter
 */
const deleteFilter = (filter) => (
    (dispatch, getState, {notify, api}) => (
        api('events_planning_filters').remove(filter)
            .then(() => {
                notify.success(gettext('The Events and Planning view filter is deleted.'));
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('There was an error, could not delete Events and Planning view filter.')
                    )
                );
                return Promise.reject(error);
            })
    )
);


/**
 * Fetch all filters defined and adds to redux store.
 * @param {object} params - params to query
 */
const fetchFilters = (params = null) => (
    (dispatch, getState, {api, notify}) => (
        api('events_planning_filters').getAll(params)
            .then((items) => {
                dispatch(self.receiveFilters(items));
                return items;
            }, (error) => {
                notify.success(gettext('Failed to fetch all filters'));
                return Promise.reject(error);
            })
    )
);


/**
 * fetches an filter by ID
 * @param {string} _id - The ID of the filter to fetch
 */
const fetchFilterById = (_id) => (
    (dispatch, getState, {api, notify}) => (
        api('events_planning_filters').getById(_id)
            .then((filter) => {
                dispatch(self.addOrReplaceFilter(filter));
                return Promise.resolve(filter);
            }, (error) => {
                notify.error(getErrorMessage(error, 'Failed to fetch an Events and Planning Filter!'));
            })
    )
);

const addOrReplaceFilter = (filter) => ({
    type: EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER,
    payload: filter,
});


const receiveFilters = (items = []) => ({
    type: EVENTS_PLANNING.ACTIONS.RECEIVE_EVENTS_PLANNING_FILTERS,
    payload: items,
});

const openFilters = () => (
    (dispatch) => (
        dispatch(showModal({
            modalType: MODALS.MANAGE_EVENTS_PLANNING_FILTERS,
        }))
    )
);

const selectFilter = (filterId, params = {}) => (
    (dispatch, getState, {$timeout, $location}) => {
        const filters = selectors.eventsPlanning.combinedViewFilters(getState());
        let selectedFilterID = filterId;

        if (selectedFilterID !== null &&
            selectedFilterID !== EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING &&
            !filters.find((f) => f._id === selectedFilterID)) {
            return dispatch(selectFilter(EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING));
        }

        if (selectedFilterID === null) {
            selectedFilterID = selectors.eventsPlanning.currentFilter(getState());
        }

        // store filter
        dispatch(self.storeFilter(selectedFilterID));

        // update the url (deep linking)
        $timeout(() => ($location.search('eventsPlanningFilter', selectedFilterID)));
        const queryParams = {
            ...selectors.eventsPlanning.getEventsPlanningViewParams(getState()),
            ...params,
            filter_id: selectedFilterID,
        };

        // reload the list
        dispatch(main.setUnsetUserInitiatedSearch(true));
        return dispatch(self.fetch(queryParams))
            .then((data) => Promise.resolve(data))
            .finally(() => dispatch(main.setUnsetUserInitiatedSearch(false)));
    }
);


const storeFilter = (filterId) => ({
    type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
    payload: filterId,
});

// eslint-disable-next-line consistent-this
const self = {
    fetch,
    setInList,
    addToList,
    clearList,
    showRelatedPlannings,
    _showRelatedPlannings,
    loadMore,
    requestEventsPlanning,
    refetch,
    receiveEventsPlanning,
    scheduleRefetch,
    refetchPlanning,
    saveFilter,
    deleteFilter,
    addOrReplaceFilter,
    receiveFilters,
    fetchFilters,
    fetchFilterById,
    openFilters,
    selectFilter,
    storeFilter,
};

export default self;
