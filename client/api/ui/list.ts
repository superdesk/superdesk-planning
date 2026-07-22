import moment from 'moment';

import {IRestApiResponse} from 'superdesk-api';
import {
    IAgenda,
    ICalendar,
    ICombinedEventOrPlanningSearchParams,
    IEventItem,
    IEventOrPlanningItem,
    IEventSearchParams,
    IPlanningAPI,
    IPlanningSearchParams,
    IReloadPagePayload,
    ISearchFilter,
    ISearchParams,
    LIST_VIEW_TYPE,
    PLANNING_VIEW,
    SORT_FIELD,
    SORT_ORDER,
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {appConfig} from 'appConfig';
import {AGENDA, EVENTS, EVENTS_PLANNING, MAIN} from '../../constants';

import {
    activeFilter,
    combinedTotalItems,
    eventsTotalItems,
    getCurrentListViewType,
    lastRequestParams,
    planningTotalItems,
} from '../../selectors/main';
import {eventIdsInList, getEventFilterParams} from '../../selectors/events';
import {getPlanningFilterParams, planIdsInList} from '../../selectors/planning';
import {getEventsPlanningList, getEventsPlanningViewParams} from '../../selectors/eventsplanning';
import {getErrorMessage, gettext} from '../../utils';
import {throttlePromise} from '../../utils/throttle';
import {
    combinedParamsToSearchParams,
    eventParamsToSearchParams,
    planningParamsToSearchParams,
    removeUndefinedParams,
    searchParamsToOld,
} from '../../utils/search';

import * as actions from '../../actions';

function _fetchPage(page: number): Promise<IRestApiResponse<IEventOrPlanningItem>> {
    const {getState} = planningApi.redux.store;
    const state = getState();
    const currentView = activeFilter(state);
    const params = {
        ...lastRequestParams(state),
        page: page,
    };

    switch (currentView) {
    case MAIN.FILTERS.PLANNING:
        return planningApi.planning.search(planningParamsToSearchParams(params));
    case MAIN.FILTERS.EVENTS:
        return planningApi.events.search(eventParamsToSearchParams(params));
    default:
        return planningApi.combined.search(combinedParamsToSearchParams(params));
    }
}

function _refetchListItemPages(): Promise<{items: Array<IEventOrPlanningItem>, total: number, numberOfPages: number}> {
    const {getState} = planningApi.redux.store;
    const numberOfPages = lastRequestParams(getState())?.page ?? 1;
    let currentPage = 1;
    let items: Array<IEventOrPlanningItem> = [];
    let total = 0;

    const requestPromises = Array.from({length: numberOfPages}, (_, index) => _fetchPage(index + 1));

    return Promise.all(requestPromises)
        .then((pageResults) => {
            total = pageResults[0]._meta.total;
            pageResults.forEach((pageData) => {
                items = items.concat(pageData._items);
            });
        })
        .then(() => ({items, total, numberOfPages}));
}

const RELOAD_LIST_PAGES_COOLDOWN_MS = 1000;

// Collapse bursts of websocket notifications: the first call reloads immediately, while
// calls received during a reload or its cooldown share a single follow-up reload.
const reloadListPagesThrottled = throttlePromise(_reloadListPages, RELOAD_LIST_PAGES_COOLDOWN_MS);

function reloadListPages(forViewType: PLANNING_VIEW): Promise<IReloadPagePayload | null> {
    const currentView = activeFilter(planningApi.redux.store.getState());

    if (![forViewType, PLANNING_VIEW.COMBINED].includes(currentView)) {
        // No need to reload the current page, as it won't include the changes required
        return Promise.resolve(null);
    }

    return reloadListPagesThrottled();
}

function _reloadListPages(): Promise<IReloadPagePayload | null> {
    const {getState, dispatch} = planningApi.redux.store;
    const state = getState();
    const currentView = activeFilter(state);
    const currentListViewType = getCurrentListViewType(state);

    dispatch(actions.main.setUnsetLoadingIndicator(true));
    return _refetchListItemPages()
        .then(({items, total, numberOfPages}) => _processPageLoad(items, total, numberOfPages))
        .then((payload) => {
            if (payload.plannings.length > 0) {
                dispatch(actions.contacts.fetchContactsFromPlanning(payload.plannings));
            }
            dispatch({type: MAIN.ACTIONS.RELOAD_LIST_PAGES, payload: payload});

            return payload;
        })
        .catch((error) => {
            superdeskApi.ui.notify.error(
                getErrorMessage(error, gettext('Failed to reload item list'))
            );

            return null;
        })
        .finally(() => {
            dispatch(actions.main.setUnsetLoadingIndicator(false));
        });
}

function getItemTotalsAndPage(): [number, number, number] {
    const {getState} = planningApi.redux.store;
    const state = getState();
    const currentView = activeFilter(state);
    const lastParams = lastRequestParams(state);
    const lastPage = lastRequestParams(state)?.page ?? 1;
    const nextPage = lastParams.lastPageReceivedInFull === true ? lastPage + 1 : lastPage;

    switch (currentView) {
    case MAIN.FILTERS.PLANNING:
        return [planIdsInList(state)?.length ?? 0, planningTotalItems(state), nextPage];
    case MAIN.FILTERS.EVENTS:
        return [eventIdsInList(state)?.length ?? 0, eventsTotalItems(state), nextPage];
    default:
        return [getEventsPlanningList(state)?.length ?? 0, combinedTotalItems(state), nextPage];
    }
}

function _processPageLoad(
    items: Array<IEventOrPlanningItem>,
    total: number,
    numberOfPages: number,
): Promise<IReloadPagePayload> {
    const {getState} = planningApi.redux.store;
    const state = getState();
    const currentView = activeFilter(state);
    const payload: IReloadPagePayload = {
        currentView: currentView,
        total: total,
        items: items,
        events: [],
        plannings: [],
        relatedPlannings: {},
        listViewType: getCurrentListViewType(state),
        lastPage: numberOfPages,
    };

    items.forEach((item) => {
        if (item.type === 'event') {
            payload.events.push(item);
        } else if (item.type === 'planning') {
            payload.plannings.push(item);
        }
    });

    if (currentView === MAIN.FILTERS.COMBINED && appConfig.planning_expand_related_plannings) {
        const eventsWithPlannings: Array<IEventItem> = payload.events.filter(
            (item) => (item.planning_ids?.length ?? 0) > 0
        );

        if (eventsWithPlannings.length === 0) {
            return payload;
        }

        const eventIds = eventsWithPlannings.map((event) => event._id);

        return planningApi.planning
            .getByEventIds(eventIds)
            .then((plannings) => {
                payload.plannings = payload.plannings.concat(plannings);

                payload.relatedPlannings = eventsWithPlannings.reduce(
                    (acc, curr) => {
                        acc[curr._id] = curr.planning_ids;
                        return acc;
                    },
                    {},
                );

                return payload;
            });
    }

    return payload;
}

function loadNextPage(): Promise<IReloadPagePayload | undefined> {
    const {dispatch} = planningApi.redux.store;
    const [listTotal, searchTotal, nextPage] = getItemTotalsAndPage();

    if (listTotal === searchTotal) {
        return Promise.resolve();
    }

    dispatch(actions.main.setUnsetLoadingIndicator(true));
    return _fetchPage(nextPage)
        .then((response) => _processPageLoad(response._items, searchTotal, nextPage))
        .then((payload) => {
            if (payload.plannings.length > 0) {
                dispatch(actions.contacts.fetchContactsFromPlanning(payload.plannings));
            }
            dispatch({type: MAIN.ACTIONS.NEXT_PAGE_LOADED, payload: payload});

            return payload;
        })
        .catch((error) => {
            superdeskApi.ui.notify.error(
                getErrorMessage(error, gettext('Failed to load next page'))
            );

            return null;
        })
        .finally(() => {
            dispatch(actions.main.setUnsetLoadingIndicator(false));
        });
}

function updateSearchAndReloadList(params: ICombinedEventOrPlanningSearchParams = {}) {
    const {getState, dispatch} = planningApi.redux.store;
    const currentView = activeFilter(getState());

    dispatch(actions.main.setUnsetLoadingIndicator(true));

    if (currentView === MAIN.FILTERS.PLANNING) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.events.ui.clearList());
        dispatch(actions.planning.ui.requestPlannings({
            ...getPlanningFilterParams(getState()),
            ...params,
            page: 1,
        }));
        return reloadListPages(PLANNING_VIEW.PLANNING);
    } else if (currentView === MAIN.FILTERS.EVENTS) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.planning.ui.clearList());
        dispatch(actions.events.ui.requestEvents({
            ...getEventFilterParams(getState()),
            ...params,
            page: 1,
        }));
        return reloadListPages(PLANNING_VIEW.EVENTS);
    } else {
        dispatch(actions.events.ui.clearList());
        dispatch(actions.planning.ui.clearList());
        dispatch(
            actions.eventsPlanning.ui.requestEventsPlanning({
                ...getEventsPlanningViewParams(getState()),
                ...params,
                page: 1,
            })
        );
        return reloadListPages(PLANNING_VIEW.COMBINED);
    }
}

function clearList() {
    const {getState, dispatch} = planningApi.redux.store;
    const currentView = activeFilter(getState());

    switch (currentView) {
    case MAIN.FILTERS.COMBINED:
        dispatch(actions.eventsPlanning.ui.clearList());
        break;
    case MAIN.FILTERS.EVENTS:
        dispatch(actions.events.ui.clearList());
        break;
    case MAIN.FILTERS.PLANNING:
        dispatch(actions.planning.ui.clearList());
        break;
    }
}

function changeFilterId(id: ISearchFilter['_id'], params: ICombinedEventOrPlanningSearchParams = {}) {
    const {getState, dispatch} = planningApi.redux.store;
    const {urlParams} = superdeskApi.browser.location;
    const currentView = activeFilter(getState());

    if (currentView === MAIN.FILTERS.PLANNING) {
        dispatch({
            type: AGENDA.ACTIONS.SELECT_FILTER,
            payload: id,
        });
        urlParams.setString('agenda', null);
    } else if (currentView === MAIN.FILTERS.EVENTS) {
        dispatch({
            type: EVENTS.ACTIONS.SELECT_FILTER,
            payload: id,
        });
        urlParams.setString('calendar', null);
    } else {
        dispatch({
            type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
            payload: id,
        });
    }
    urlParams.setString('eventsPlanningFilter', id);

    return updateSearchAndReloadList(params);
}

function changeCalendarId(id: ICalendar['qcode'], params: IEventSearchParams = {}) {
    const {dispatch} = planningApi.redux.store;
    const {urlParams} = superdeskApi.browser.location;

    dispatch({
        type: EVENTS.ACTIONS.SELECT_CALENDAR,
        payload: id,
    });

    urlParams.setString('calendar', id);
    urlParams.setString('eventsPlanningFilter', null);
    return updateSearchAndReloadList(params);
}

function changeAgendaId(id: IAgenda['_id'], params: IPlanningSearchParams = {}) {
    const {dispatch} = planningApi.redux.store;
    const {urlParams} = superdeskApi.browser.location;

    dispatch({
        type: AGENDA.ACTIONS.SELECT_AGENDA,
        payload: id,
    });

    urlParams.setString('agenda', id);
    urlParams.setString('eventsPlanningFilter', null);
    return updateSearchAndReloadList(params);
}

function changeCurrentView(view: PLANNING_VIEW) {
    const {dispatch} = planningApi.redux.store;
    const {urlParams} = superdeskApi.browser.location;

    dispatch({
        type: MAIN.ACTIONS.FILTER,
        payload: view,
    });
    urlParams.setString('filter', view);
    return updateSearchAndReloadList();
}

function search(newParams: ISearchParams) {
    const {getState} = planningApi.redux.store;
    const currentSearch = removeUndefinedParams(searchParamsToOld(newParams, activeFilter(getState())));
    const previousParams = removeUndefinedParams(lastRequestParams(getState()));

    const params: ICombinedEventOrPlanningSearchParams = {
        ...previousParams,
        ...currentSearch,
        page: 1,
    };
    const dates = params.advancedSearch?.dates ?? {};
    const listViewType = getCurrentListViewType(getState());

    // If an end date had been provided without a start date
    // then default the start date to 1 day before the end date
    if (listViewType === LIST_VIEW_TYPE.SCHEDULE && !dates.range && !dates.start && dates.end) {
        dates.start = moment(dates.end).subtract(1, 'days');
    }

    return updateSearchAndReloadList(params);
}

function clearSearch() {
    const {dispatch, getState} = planningApi.redux.store;

    dispatch({
        type: MAIN.ACTIONS.CLEAR_SEARCH,
        payload: activeFilter(getState()),
    });

    return updateSearchAndReloadList();
}

function setViewType(viewType: LIST_VIEW_TYPE) {
    const {dispatch, getState} = planningApi.redux.store;

    if (viewType === getCurrentListViewType(getState())) {
        return Promise.resolve();
    }

    // For performance reasons, clear the list before changing list view type
    // otherwise the list will try and re-render with the currently loaded items
    clearList();
    dispatch({
        type: MAIN.ACTIONS.SET_LIST_VIEW_TYPE,
        payload: viewType,
    });
    superdeskApi.browser.location.urlParams.setString('listViewType', viewType);

    const params: ICombinedEventOrPlanningSearchParams = viewType === LIST_VIEW_TYPE.SCHEDULE ?
        {
            sortField: SORT_FIELD.SCHEDULE,
            sortOrder: SORT_ORDER.ASCENDING,
            page: 1,
        } :
        {
            page: 1,
        };

    return updateSearchAndReloadList(params);
}

export const list: IPlanningAPI['ui']['list'] = {
    updateSearchAndReloadList,
    changeFilterId,
    changeCalendarId,
    changeAgendaId,
    search,
    clearSearch,
    clearList,
    setViewType,
    changeCurrentView,
    reloadListPages,
    loadNextPage,
};
