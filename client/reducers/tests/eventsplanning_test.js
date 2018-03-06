import eventsPlanning from '../eventsplanning';
import {EVENTS_PLANNING} from '../../constants';

describe('eventsplanning', () => {
    describe('reducers', () => {
        let initialState;


        beforeEach(() => {
            initialState = eventsPlanning(undefined, {type: null});
        });

        it('initialState', () => {
            expect(initialState).toEqual({
                eventsAndPlanningInList: [],
                relatedPlannings: {}
            });
        });

        it('set events and planning in list', () => {
            const result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                    payload: [{_id: 'e1'}, {_id: 'p1'}]
                }
            );

            expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);
        });

        it('add events and planning in list', () => {
            const result = eventsPlanning(
                {
                    ...initialState,
                    eventsAndPlanningInList: ['e1', 'p1'],
                },
                {
                    type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
                    payload: [{_id: 'e2'}, {_id: 'p1'}]
                }
            );

            expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1', 'e2']);
        });

        it('clear events and planning list', () => {
            const result = eventsPlanning(
                {
                    ...initialState,
                    eventsAndPlanningInList: ['e1', 'p1'],
                },
                {
                    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST
                }
            );

            expect(result.eventsAndPlanningInList).toEqual([]);
        });

        it('show related planning list', () => {
            const result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS,
                    payload: {
                        _id: 'e1',
                        planning_ids: ['p1', 'p2']
                    }
                }
            );

            expect(result.relatedPlannings.e1).toEqual(['p1', 'p2']);
        });
    });
});
