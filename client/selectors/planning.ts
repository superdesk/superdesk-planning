import {createSelector} from 'reselect';
import {cloneDeep, get} from 'lodash';

import {appConfig} from 'appConfig';
import {IPlanningAppState, IPlanningItem, LIST_VIEW_TYPE} from '../interfaces';

import {session, userPreferences} from './general';
import {getSearchDateRange, lockUtils, planningUtils} from '../utils';
import {AGENDA, SPIKED_STATE} from '../constants';

function getCurrentListViewType(state?: IPlanningAppState) {
    return state?.main?.listViewType ?? LIST_VIEW_TYPE.SCHEDULE;
}
const storedEvents = (state) => get(state, 'events.events', {});

export const planningHistory = (state) => get(state, 'planning.planningHistoryItems');
export function storedPlannings(state: IPlanningAppState): {[key: string]: IPlanningItem} {
    return state.planning?.plannings ?? {};
}
export const planIdsInList = (state) => get(state, 'planning.planningsInList', []);
export const agendas = (state) => get(state, 'agenda.agendas', []);
export const currentPlanningId = (state) => get(state, 'planning.currentPlanningId');
export const currentSearch = (state) => get(state, 'main.search.PLANNING.currentSearch');
export const selectedAgendaId = (state) => get(state, 'agenda.currentAgendaId', null);
export const currentPlanningFilterId = (state: IPlanningAppState) => state?.agenda?.currentFilterId;
const fullText = (state) => get(state, 'main.search.PLANNING.fulltext', '');
const previewId = (state) => get(state, 'main.previewId', null);


export const usersDefaultAgenda = createSelector(
    [agendas, userPreferences],
    (items, preferences) => {
        const defaultAgendaNameCode = get(preferences, 'planning:agenda.agenda.name');

        return items.find((agenda) => agenda.name === defaultAgendaNameCode) || null;
    }
);

export const defaultAgendaFilter = createSelector(
    [usersDefaultAgenda],
    (agenda) => agenda || {name: AGENDA.FILTER.ALL_PLANNING}
);

export const currentAgendaId = createSelector([usersDefaultAgenda, selectedAgendaId],
    (userAgenda, selectedAgendaId) => (selectedAgendaId || get(userAgenda, '_id') || AGENDA.FILTER.ALL_PLANNING));

export const currentPlanning = createSelector(
    [previewId, storedPlannings],
    (currentPlanningId, storedPlannings) => {
        if (typeof currentPlanningId === 'string') {
            return storedPlannings[currentPlanningId];
        } else if (typeof currentPlanningId === 'object') {
            return currentPlanningId;
        }
    }
);

export const currentAgenda = createSelector(
    [agendas, currentAgendaId],
    (agendas, agendaId) => (
        agendas.find((a) => a._id === agendaId)
    )
);

/** Used for the planning list */
export const plansInList = createSelector(
    [storedPlannings, planIdsInList],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

export const orderedPlanningList = createSelector(
    [currentAgenda, plansInList, storedEvents, currentSearch, getCurrentListViewType],
    (currentAgenda, plansInList, events, search, viewType) => {
        if (!plansInList?.length) {
            return [];
        } if (viewType === LIST_VIEW_TYPE.LIST) {
            return [{
                date: null,
                events: plansInList,
            }];
        }

        const dateRange = getSearchDateRange(search, appConfig.start_of_week);

        return planningUtils.getPlanningByDate(
            plansInList, events, dateRange.startDate, dateRange.endDate
        );
    }
);

export const FlattenedPlanningList = createSelector(
    [currentAgenda, plansInList, storedEvents, currentSearch],
    (currentAgenda, plansInList, events, search) => {
        const dateRange = getSearchDateRange(search, appConfig.start_of_week);

        return planningUtils.getFlattenedPlanningByDate(
            plansInList, events, dateRange.startDate, dateRange.endDate
        );
    }
);


export const getPlanningFilterParams = createSelector(
    [currentAgendaId, currentSearch, fullText, currentPlanningFilterId],
    (agendaId, currentSearch, fullText, filterId) => {
        let agendas = null;

        if (agendaId && agendaId !== AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
            agendaId !== AGENDA.FILTER.ALL_PLANNING) {
            agendas = [agendaId];
        }

        return {
            noAgendaAssigned: agendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED,
            agendas: agendas,
            advancedSearch: get(currentSearch, 'advancedSearch', {}),
            spikeState: get(currentSearch, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: fullText,
            excludeRescheduledAndCancelled: get(currentSearch, 'excludeRescheduledAndCancelled', false),
            filter_id: filterId,
            page: 1,
        };
    }
);

const getLockedItems = (state) => get(state, 'locks', {
    event: {},
    planning: {},
    recurring: {},
    assignment: {},
});

export const isCurrentPlanningLockedInThisSession = createSelector(
    [currentPlanning, session, getLockedItems],
    (currentPlanning, session, locks) => (
        currentPlanning && lockUtils.isItemLockedInThisSession(
            currentPlanning,
            session,
            locks
        )
    )
);
