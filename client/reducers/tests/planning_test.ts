import moment from 'moment';
import planning from '../planning';
import {PLANNING} from '../../constants';

describe('planning', () => {
    describe('reducers', () => {
        // Ensure we set the default state for planning
        let initialState;

        beforeEach(() => {
            initialState = planning(undefined, {type: null});
        });

        const plannings = {
            p1: {
                _id: 'p1',
                slugline: 'Plan1',
                coverages: [{
                    _id: 'c1',
                    planning_item: 'p1',
                }],
                state: 'draft',
                _etag: 'old_etag',
            },
        };

        it('initialState', () => {
            expect(initialState).toEqual({
                plannings: {},
                planningsInList: [],
                currentPlanningId: undefined,
                editorOpened: false,
                readOnly: true,
                planningHistoryItems: [],
            });
        });

        it('SET_LIST', () => {
            const result = planning(
                initialState,
                {
                    type: 'SET_PLANNING_LIST',
                    payload: ['p1', 'p2'],
                }
            );

            expect(result.planningsInList).toEqual(['p1', 'p2']);
        });

        it('ADD_TO_LIST', () => {
            const result = planning(
                {
                    ...initialState,
                    planningsInList: ['p1', 'p2'],
                },
                {
                    type: 'ADD_TO_PLANNING_LIST',
                    payload: ['p2', 'p3', 'p4'],
                }
            );

            expect(result.planningsInList).toEqual(['p1', 'p2', 'p3', 'p4']);
        });

        it('CLEAR_LIST', () => {
            const result = planning(initialState, {type: 'CLEAR_PLANNING_LIST'});

            expect(result.planningsInList).toEqual([]);
        });

        describe('RECEIVE_PLANNINGS', () => {
            it('saves the plan to the store', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: [{
                            _id: 'p1',
                            planning_date: '2016-10-15T13:01:11',
                            coverages: [{_id: 'c1'}],
                        }],
                    }
                );

                expect(result.plannings.p1._id).toBe('p1');
                expect(result.plannings.p1.coverages[0]._id).toBe('c1');
                expect(result.plannings.p1.planning_date.toString()).toBe(
                    moment('2016-10-15T13:01:11').toString());
            });

            it('defaults coverages to empty array', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: [{
                            _id: 'p1',
                            planning_date: '2016-10-15T13:01:11',
                        }],
                    }
                );

                expect(result.plannings.p1._id).toBe('p1');
                expect(result.plannings.p1.coverages.length).toBe(0);
                expect(result.plannings.p1.planning_date.toString()).toBe(
                    moment('2016-10-15T13:01:11').toString());
            });

            it('converts payload to array', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: {
                            _id: 'p1',
                            planning_date: '2016-10-15T13:01:11',
                        },
                    }
                );

                expect(result.plannings.p1._id).toBe('p1');
                expect(result.plannings.p1.coverages.length).toBe(0);
                expect(result.plannings.p1.planning_date.toString()).toBe(
                    moment('2016-10-15T13:01:11').toString());
            });
        });

        describe('REMOVE_ASSIGNMENT', () => {
            it('REMOVE_ASSIGNMENT returns if planning not loaded', () => {
                const result = planning(initialState, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {planning: 'p1'},
                });

                expect(result).toEqual(initialState);
            });
        });

        it('spike planning marks the planning as spiked', () => {
            initialState.plannings = plannings;

            let result = planning(
                initialState,
                {
                    type: PLANNING.ACTIONS.SPIKE_PLANNING,
                    payload: {
                        id: 'p1',
                        etag: 'new_etag',
                        state: 'spiked',
                        revert_state: 'draft',
                    },
                }
            );

            expect(result.plannings.p1).toEqual({
                ...plannings.p1,
                _etag: 'new_etag',
                revert_state: 'draft',
                state: 'spiked',
            });

            expect(result.planningsInList).toEqual([]);
        });

        it('unspike planning reverts the planning states', () => {
            initialState.plannings = {
                ...plannings,
                p1: {
                    ...plannings.p1,
                    state: 'spiked',
                    revert_state: 'draft',
                },
            };

            const result = planning(
                initialState,
                {
                    type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                    payload: {
                        id: 'p1',
                        etag: 'new_etag',
                        state: 'draft',
                    },
                }
            );

            expect(result.plannings.p1).toEqual({
                ...plannings.p1,
                _etag: 'new_etag',
                state: 'draft',
            });
        });
    });
});
