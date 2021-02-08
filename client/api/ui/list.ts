import {IAgenda, ICalendar, IPlanningAPI, ISearchFilter} from '../../interfaces';
import {planningApi} from '../../superdeskApi';
import {AGENDA, EVENTS, EVENTS_PLANNING, MAIN} from '../../constants';

import {activeFilter} from '../../selectors/main';
import {getEventFilterParams} from '../../selectors/events';
import {getPlanningFilterParams} from '../../selectors/planning';
import {getEventsPlanningViewParams} from '../../selectors/eventsplanning';

import * as actions from '../../actions';

function reloadList(params = {}) {
    const {getState, dispatch} = planningApi.redux.store;
    const currentView = activeFilter(getState());

    if (currentView === MAIN.FILTERS.PLANNING) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.events.ui.clearList());
        return dispatch(actions.planning.ui.fetchToList({
            ...getPlanningFilterParams(getState()),
            ...params,
            page: 1,
        }));
    } else if (currentView === MAIN.FILTERS.EVENTS) {
        dispatch(actions.eventsPlanning.ui.clearList());
        dispatch(actions.planning.ui.clearList());
        return dispatch(actions.events.ui.fetchEvents({
            ...getEventFilterParams(getState()),
            ...params,
            page: 1,
        }));
    }

    dispatch(actions.events.ui.clearList());
    dispatch(actions.planning.ui.clearList());
    return dispatch(actions.eventsPlanning.ui.fetch({
        ...getEventsPlanningViewParams(getState()),
        ...params,
        page: 1,
    }));
}

function changeFilterId(id: ISearchFilter['_id'], params = {}) {
    const {getState, dispatch} = planningApi.redux.store;
    const currentView = activeFilter(getState());

    dispatch(actions.main.setUnsetLoadingIndicator(true));
    if (currentView === MAIN.FILTERS.PLANNING) {
        dispatch({
            type: AGENDA.ACTIONS.SELECT_FILTER,
            payload: id,
        });
        planningApi.$location.search('agenda', null);
    } else if (currentView === MAIN.FILTERS.EVENTS) {
        dispatch({
            type: EVENTS.ACTIONS.SELECT_FILTER,
            payload: id,
        });
        planningApi.$location.search('calendar', null);
    } else {
        dispatch({
            type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
            payload: id,
        });
    }
    planningApi.$location.search('eventsPlanningFilter', id);
    return reloadList(params).finally(() => {
        dispatch(actions.main.setUnsetLoadingIndicator(false));
    });
}

function changeCalendarId(id: ICalendar['qcode'], params = {}) {
    const {dispatch} = planningApi.redux.store;

    dispatch(actions.main.setUnsetLoadingIndicator(true));
    dispatch({
        type: EVENTS.ACTIONS.SELECT_CALENDAR,
        payload: id,
    });
    planningApi.$location.search('calendar', id);
    planningApi.$location.search('eventsPlanningFilter', null);
    return reloadList(params).finally(() => {
        dispatch(actions.main.setUnsetLoadingIndicator(false));
    });
}

function changeAgendaId(id: IAgenda['_id'], params = {}) {
    const {dispatch} = planningApi.redux.store;

    dispatch(actions.main.setUnsetLoadingIndicator(true));
    dispatch({
        type: AGENDA.ACTIONS.SELECT_AGENDA,
        payload: id,
    });
    planningApi.$location.search('agenda', id);
    planningApi.$location.search('eventsPlanningFilter', null);
    return reloadList(params).finally(() => {
        dispatch(actions.main.setUnsetLoadingIndicator(false));
    });
}

export const list: IPlanningAPI['ui']['list'] = {
    changeFilterId,
    changeCalendarId,
    changeAgendaId,
};
