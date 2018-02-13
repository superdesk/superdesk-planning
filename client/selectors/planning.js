import {createSelector} from 'reselect';
import {get, cloneDeep} from 'lodash';
import {lockUtils} from '../utils';
import {session} from './general';
import {planningUtils} from '../utils';
import {AGENDA, SPIKED_STATE} from '../constants';


const storedEvents = (state) => get(state, 'events.events', {});

export const storedPlannings = (state) => get(state, 'planning.plannings', {});
export const planIdsInList = (state) => get(state, 'planning.planningsInList', []);
export const agendas = (state) => get(state, 'agenda.agendas', []);
export const currentAgendaId = (state) => get(state, 'agenda.currentAgendaId', null);
export const currentPlanningId = (state) => get(state, 'planning.currentPlanningId');
export const currentSearch = (state) => get(state, 'main.search.PLANNING.currentSearch');
const fullText = (state) => get(state, 'main.search.PLANNING.fulltext', '');
const previewId = (state) => get(state, 'main.previewId', null);

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
    [currentAgenda, plansInList, storedEvents],
    (currentAgenda, plansInList, events) => planningUtils.getPlanningByDate(plansInList, events)
);

export const getPlanningFilterParams = createSelector(
    [currentAgendaId, currentSearch, fullText],
    (agendaId, currentSearch, fullText) => {
        let agendas = null;

        if (agendaId && agendaId !== AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
            agendaId !== AGENDA.FILTER.ALL_PLANNING) {
            agendas = [agendaId];
        }

        const params = {
            noAgendaAssigned: agendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED,
            agendas: agendas,
            advancedSearch: get(currentSearch, 'advancedSearch', {}),
            spikeState: get(currentSearch, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: fullText,
            page: 1
        };

        return params;
    }
);

export const isCurrentPlanningLockedInThisSession = createSelector(
    [currentPlanning, session],
    (currentPlanning, session) => (
        currentPlanning && lockUtils.isItemLockedInThisSession(currentPlanning, session)
    )
);

