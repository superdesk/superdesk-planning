import moment from 'moment';
import planning from '../planning';
import actions from '../../actions/planning';
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
                _etag: 'old_etag'
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
                selectedItems: [],
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

        it('OPEN_PLANNING_EDITOR', () => {
            const result = planning(
                initialState,
                {
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: 'p1',
                }
            );

            expect(result.editorOpened).toBe(true);
            expect(result.currentPlanningId).toBe('p1');
            expect(result.readOnly).toBe(false);
        });

        it('PREVIEW_PLANNING', () => {
            const result = planning(
                initialState,
                {
                    type: 'PREVIEW_PLANNING',
                    payload: 'p1',
                }
            );

            expect(result.editorOpened).toBe(true);
            expect(result.currentPlanningId).toBe('p1');
            expect(result.readOnly).toBe(true);
        });

        it('CLOSE_PLANNING_EDITOR', () => {
            const result = planning(
                initialState,
                {type: 'CLOSE_PLANNING_EDITOR'}
            );

            expect(result.editorOpened).toBe(false);
            expect(result.currentPlanningId).toBe(undefined);
        });

        it('PLANNING_FILTER_BY_KEYWORD', () => {
            let result = planning(
                initialState,
                {
                    type: 'PLANNING_FILTER_BY_KEYWORD',
                    payload: 'Find this plan',
                }
            );

            expect(result.filterPlanningKeyword).toBe('Find this plan');
        });

        describe('RECEIVE_COVERAGE', () => {
            it('planning not loaded', () => {
                initialState.plannings = plannings;
                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            item: 'c1',
                            planning: 'p2',
                        },
                    }
                );

                expect(result).toEqual(initialState);
            });

            it('coverage created', () => {
                initialState.plannings = plannings;

                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p1',
                        },
                    }
                );

                expect(result.plannings.p1.coverages).toEqual([
                    {
                        _id: 'c1',
                        planning_item: 'p1',
                    },
                    {
                        _id: 'c2',
                        planning_item: 'p1',
                    },
                ]);
            });

            it('coverage updated', () => {
                initialState.plannings = plannings;

                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            _id: 'c1',
                            planning_item: 'p1',
                            foo: 'bar',
                        },
                    }
                );

                expect(result.plannings.p1.coverages).toEqual([{
                    _id: 'c1',
                    planning_item: 'p1',
                    foo: 'bar',
                }]);
            });
        });

        describe('COVERAGE_DELETED', () => {
            it('when planning not loaded', () => {
                initialState.plannings = plannings;

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p2',
                        },
                    }
                );

                expect(result).toEqual(initialState);
            });

            it('coverage not loaded', () => {
                initialState.plannings = plannings;

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p1',
                        },
                    }
                );

                expect(result).toEqual(initialState);
            });

            it('removes coverage', () => {
                initialState.plannings = plannings;

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c1',
                            planning_item: 'p1',
                        },
                    }
                );

                expect(result.plannings.p1.coverages).toEqual([]);
            });
        });

        describe('toggle selected items', () => {
            it('can select an item, select all and deselect', () => {
                initialState.planningsInList = ['foo', 'bar'];
                expect(initialState.selectedItems).toEqual([]);

                let state;

                state = planning(initialState, actions.ui.toggleItemSelected('foo'));
                expect(state.selectedItems).toEqual(['foo']);

                state = planning(state, actions.ui.toggleItemSelected('bar'));
                expect(state.selectedItems).toEqual(['foo', 'bar']);

                state = planning(state, actions.ui.toggleItemSelected('foo'));
                expect(state.selectedItems).toEqual(['bar']);

                state = planning(state, actions.ui.selectAll());
                expect(state.selectedItems).toEqual(['foo', 'bar']);

                state = planning(state, actions.ui.deselectAll());
                expect(state.selectedItems).toEqual([]);
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

            it('REMOVE_ASSIGNMENT removes the lock and updates the etag', () => {
                const result = planning(
                    {
                        ...initialState,
                        plannings: {
                            p1: {
                                _id: 'p1',
                                _etag: 'e123',
                                coverages: [{
                                    coverage_id: 'cov1',
                                    assigned_to: {
                                        desk: 'desk1',
                                        user: 'user1',
                                    },
                                }],
                                lock_action: 'remove_assignment',
                                lock_user: 'user1',
                                lock_session: 'session1',
                                lock_time: 'now',
                            },
                        },
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {
                            planning: 'p1',
                            planning_etag: 'e456',
                            coverage: 'cov1',
                        },
                    }
                );

                expect(result).toEqual({
                    ...initialState,
                    plannings: {
                        p1: {
                            _id: 'p1',
                            _etag: 'e456',
                            coverages: [{coverage_id: 'cov1'}],
                        },
                    },
                });
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
                    }
                }
            );

            expect(result.plannings.p1).toEqual({
                ...plannings.p1,
                _etag: 'new_etag',
                revert_state: 'draft',
                state: 'spiked'
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
                }
            };

            const result = planning(
                initialState,
                {
                    type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                    payload: {
                        id: 'p1',
                        etag: 'new_etag',
                        state: 'draft'
                    }
                }
            );

            expect(result.plannings.p1).toEqual({
                ...plannings.p1,
                _etag: 'new_etag',
                state: 'draft'
            });
        });
    });
});
