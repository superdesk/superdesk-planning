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
                relatedPlannings: {},
                filters: [],
                currentFilter: null,
            });
        });

        it('set events and planning in list', () => {
            const result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                    payload: [{_id: 'e1'}, {_id: 'p1'}],
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
                    payload: [{_id: 'e2'}, {_id: 'p1'}],
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
                    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST,
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
                        planning_ids: ['p1', 'p2'],
                    },
                }
            );

            expect(result.relatedPlannings.e1).toEqual(['p1', 'p2']);
        });

        it('set current selected filter', () => {
            const result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
                    payload: 'foo',
                }
            );

            expect(result.currentFilter).toEqual('foo');
        });

        it('receive filters', () => {
            const result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.RECEIVE_EVENTS_PLANNING_FILTERS,
                    payload: [
                        {_id: 1, name: 'sports'},
                        {_id: 2, name: 'finance'},
                    ],
                }
            );

            expect(result.filters).toEqual(
                [
                    {_id: 2, name: 'finance'},
                    {_id: 1, name: 'sports'},
                ]
            );
        });

        it('add filter or update filter', () => {
            initialState.filters = [{_id: 1, name: 'sports'}];

            let result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER,
                    payload: {_id: 2, name: 'finance'},
                }
            );

            expect(result.filters).toEqual(
                [
                    {_id: 2, name: 'finance'},
                    {_id: 1, name: 'sports'},
                ]
            );

            initialState.filters = [
                {_id: 2, name: 'finance'},
                {_id: 1, name: 'sports'},
            ];

            result = eventsPlanning(
                initialState,
                {
                    type: EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER,
                    payload: {_id: 1, name: 'abc'},
                }
            );

            expect(result.filters).toEqual(
                [
                    {_id: 1, name: 'abc'},
                    {_id: 2, name: 'finance'},
                ]
            );
        });
    });
});
