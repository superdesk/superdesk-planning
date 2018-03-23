import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedEvents} from './events';
import {storedPlannings} from './planning';

export const selectedEventIds = (state) => get(state, 'multiSelect.selectedEventIds');
export const selectedEvents = createSelector(
    [storedEvents, selectedEventIds],
    (events, eventIds) => eventIds.map((eventId) => events[eventId])
);

export const selectedPlanningIds = (state) => get(state, 'multiSelect.selectedPlanningIds');
export const selectedPlannings = createSelector(
    [storedPlannings, storedEvents, selectedPlanningIds],
    (plannings, events, planningIds) => planningIds.map((planningId) => ({
        ...plannings[planningId],
        event: get(events, get(plannings[planningId], 'event_item'))
    }))
);
