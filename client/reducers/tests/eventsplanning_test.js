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

        describe('spike', () => {
            it('remove event from list', () => {
                let result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'draft'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'both'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'spiked'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);
            });

            it('remove planning from list', () => {
                let result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING,
                        payload: {
                            id: 'p1',
                            spikeState: 'draft'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING,
                        payload: {
                            id: 'p1',
                            spikeState: 'both'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING,
                        payload: {
                            id: 'p1',
                            spikeState: 'spiked'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);
            });

            it('recurring spike events', () => {
                let result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'e2', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_RECURRING_EVENTS,
                        payload: {
                            ids: ['e1', 'e2'],
                            spikeState: 'draft'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['p1']);
            });
        });

        describe('unspike', () => {
            it('remove event from list on unspike', () => {
                let result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'draft'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'both'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT,
                        payload: {
                            id: 'e1',
                            spikeState: 'spiked'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['p1']);
            });

            it('remove planning from list on unspike', () => {
                let result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_PLANNING,
                        payload: {
                            id: 'p1',
                            spikeState: 'draft'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1', 'p1']);

                result = eventsPlanning(
                    {
                        ...initialState,
                        eventsAndPlanningInList: ['e1', 'p1'],
                    },
                    {
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_PLANNING,
                        payload: {
                            id: 'p1',
                            spikeState: 'spiked'
                        }
                    }
                );

                expect(result.eventsAndPlanningInList).toEqual(['e1']);
            });
        });
    });
});
