import moment from 'moment';

import {
    IAgenda,
    ICalendar,
    ICombinedEventOrPlanningSearchParams,
    IEventSearchParams,
    IPlanningAPI,
    IPlanningSearchParams,
    ISearchFilter,
    ISearchParams,
    LIST_VIEW_TYPE,
    PLANNING_VIEW,
    SORT_FIELD,
    SORT_ORDER,
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {AGENDA, EVENTS, EVENTS_PLANNING, MAIN} from '../../constants';

import {activeFilter, getCurrentListViewType, lastRequestParams} from '../../selectors/main';
import {getEventFilterParams} from '../../selectors/events';
import {getPlanningFilterParams} from '../../selectors/planning';
import {getEventsPlanningViewParams} from '../../selectors/eventsplanning';
import {searchParamsToOld, removeUndefinedParams} from '../../utils/search';

import * as actions from '../../actions';

function reloadList(params: ICombinedEventOrPlanningSearchParams = {}) {
    const {getState, dispatch} = planningApi.redux.store;
    const currentView = activeFilter(getState());
    let promise: Promise<any>;

    dispatch(actions.main.setUnsetLoadingIndicator(true));

    if (currentView === MAIN.FILTERS.PLANNING) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.events.ui.clearList());
        promise = dispatch<any>(actions.planning.ui.fetchToList({
            ...getPlanningFilterParams(getState()),
            ...params,
            page: 1,
        }));
    } else if (currentView === MAIN.FILTERS.EVENTS) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.planning.ui.clearList());
        promise = dispatch<any>(actions.events.ui.fetchEvents({
            ...getEventFilterParams(getState()),
            ...params,
            page: 1,
        }));
    } else {
        dispatch(actions.events.ui.clearList());
        dispatch(actions.planning.ui.clearList());
        promise = dispatch<any>(actions.eventsPlanning.ui.fetch({
            ...getEventsPlanningViewParams(getState()),
            ...params,
            page: 1,
        }));
    }

    return promise.finally(() => {
        dispatch(actions.main.setUnsetLoadingIndicator(false));
    });
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
    return reloadList(params);
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
    return reloadList(params);
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
    return reloadList(params);
}

function changeCurrentView(view: PLANNING_VIEW) {
    const {dispatch} = planningApi.redux.store;
    const {urlParams} = superdeskApi.browser.location;

    dispatch({
        type: MAIN.ACTIONS.FILTER,
        payload: view,
    });
    urlParams.setString('filter', view);
    return reloadList();
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

    return reloadList(params);
}

function clearSearch() {
    const {dispatch, getState} = planningApi.redux.store;

    dispatch({
        type: MAIN.ACTIONS.CLEAR_SEARCH,
        payload: activeFilter(getState()),
    });

    return reloadList();
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

    return reloadList(params);
}

export const list: IPlanningAPI['ui']['list'] = {
    changeFilterId,
    changeCalendarId,
    changeAgendaId,
    search,
    clearSearch,
    clearList,
    setViewType,
    changeCurrentView,
};
