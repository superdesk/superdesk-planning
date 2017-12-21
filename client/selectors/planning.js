import {createSelector} from 'reselect';
import {get, sortBy} from 'lodash';
import moment from 'moment';

const storedEvents = (state) => get(state, 'events.events', {});

export const storedPlannings = (state) => get(state, 'planning.plannings', {});
export const planIdsInList = (state) => get(state, 'planning.planningsInList', []);

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const currentAgendaId = (state) => get(state, 'agenda.currentAgendaId', null);

export const planningsFormsProfile = (state) => get(state, 'formsProfile.planning');
export const coverageFormsProfile = (state) => get(state, 'formsProfile.coverage');
export const currentPlanningId = (state) => get(state, 'planning.currentPlanningId');

export const currentPlanning = createSelector(
    [currentPlanningId, storedPlannings],
    (currentPlanningId, storedPlannings) => {
        if (typeof currentPlanningId === 'string') {
            return storedPlannings[currentPlanningId];
        } else if (typeof currentPlanningId === 'object') {
            return currentPlanningId;
        }
    }
);

export const planningAndCoverageFormsProfile = createSelector(
    [planningsFormsProfile, coverageFormsProfile],
    (planningProfile, coverageProfile) => (
        {
            planning: planningProfile,
            coverage: coverageProfile,
        }
    )
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
        planIds.map((planId) => plans[planId])
    )
);

export const orderedPlanningList = createSelector(
    [currentAgenda, plansInList, storedEvents],
    (currentAgenda, plansInList, events) => {
        if (!plansInList) return [];

        const days = {};

        plansInList.forEach((plan) => {
            const dates = new Set();

            plan.event = get(events, get(plan, 'event_item'));
            plan.coverages.forEach((coverage) =>
                dates.add(
                    moment(
                        get(coverage, 'planning.scheduled', plan._planning_date)
                    ).format('YYYY-MM-DD')
                )
            );

            if (dates.size < 1) {
                dates.add(moment(plan._planning_date).format('YYYY-MM-DD'));
            }

            dates.forEach((date) => {
                if (!days[date]) {
                    days[date] = [];
                }

                days[date].push(plan);
            });
        });

        let sortable = [];

        for (let day in days)
            sortable.push({
                date: day,
                events: days[day],
            });

        return sortBy(sortable, [(e) => e.date]);
    }
);
