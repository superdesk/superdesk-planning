import {get} from 'lodash';
import eventsAndPlanningApi from './api';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {EVENTS_PLANNING, MAIN, ITEM_TYPE} from '../../constants';
import * as selectors from '../../selectors';
import {getItemType, dispatchUtils} from '../../utils';

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

const refetch = () => (
    (dispatch, getState) => {
        if (!selectors.main.isEventsPlanningView(getState())) {
            return Promise.resolve();
        }

        return dispatch(eventsAndPlanningApi.refetch())
            .then((results) => {
                dispatch(self.receiveEventsPlanning(results));
                dispatch(self.setInList(results));
                return results;
            });
    }
);

/**
 * Schedule the refetch to run after one second and avoid any other refetch
 */
let nextRefetch = {
    called: 0
};
const scheduleRefetch = () => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(), nextRefetch)
        )
    )
);

const receiveEventsPlanning = (items = []) => (
    (dispatch, getState) => {
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
    payload: items
});

const addToList = (items = []) => ({
    type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
    payload: items
});

const clearList = () => ({
    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST
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
    payload: {[MAIN.FILTERS.COMBINED]: payload}
});

const _showRelatedPlannings = (event) => ({
    type: EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS,
    payload: event
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
    scheduleRefetch
};

export default self;
