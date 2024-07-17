import {createSelector} from 'reselect';
import {get, cloneDeep} from 'lodash';

import {IEventItem, IPlanningAppState, IPlanningItem} from '../interfaces';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {pickRelatedEventsForPlanning} from '../utils/planning';

export const selectedEventIds = (state) => get(state, 'multiSelect.selectedEventIds');
export const selectedEvents = createSelector(
    [storedEvents, selectedEventIds],
    (events, eventIds) => eventIds.map((eventId) => events[eventId])
);
export const lastSelectedEventDate = (state) => get(state, 'multiSelect.lastSelectedEventDate');

export const selectedPlanningIds = (state) => get(state, 'multiSelect.selectedPlanningIds');


export const selectedPlannings = createSelector<
    IPlanningAppState,
    {[planningId: string]: IPlanningItem},
    {[eventId: string]: IEventItem},
    Array<IPlanningItem['_id']>,
    Array<IPlanningItem & {event?: IEventItem}>
>(
    [storedPlannings, storedEvents, selectedPlanningIds],
    (plannings, events, planningIds) => (
        planningIds.map((planningId) => {
            if (plannings[planningId] == null) {
                return null;
            }

            const planningItem: IPlanningItem & {event?: IEventItem} = cloneDeep(plannings[planningId]);
            const relatedEvents = pickRelatedEventsForPlanning(planningItem, Object.values(events ?? {}), 'logic');

            if (relatedEvents.length > 0) {
                planningItem.event = relatedEvents[0]; // TAG: MULTIPLE_PRIMARY_EVENTS
            }

            return planningItem;
        })
            .filter((planningItem) => planningItem != null)
    )
);

export const lastSelectedPlanningDate = (state) => get(state, 'multiSelect.lastSelectedPlanningDate');
