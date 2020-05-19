import moment from 'moment';
import {cloneDeep} from 'lodash';

import assignment from '../assignment';
import * as testData from '../../utils/testData';
import {ASSIGNMENTS} from '../../constants';

describe('assignment', () => {
    let initialState;
    let state;
    let assignments;

    beforeEach(() => {
        initialState = cloneDeep(testData.assignmentInitialState);
        state = assignment({}, {type: null});
        assignments = cloneDeep(testData.assignments);
    });

    it('initialState load', () => {
        expect(state).toEqual(initialState);
    });

    it('RECEIVED_ASSIGNMENTS', () => {
        let result = assignment(state, {
            type: 'RECEIVED_ASSIGNMENTS',
            payload: [
                assignments[0],
                assignments[1],
            ],
        });

        expect(result).toEqual({
            ...initialState,
            assignments: {
                as1: {
                    ...assignments[0],
                    planning: {
                        ...assignments[0].planning,
                        scheduled: moment(assignments[0].planning.scheduled),
                    },
                },
                as2: {
                    ...assignments[1],
                    planning: {
                        ...assignments[1].planning,
                        scheduled: moment(assignments[1].planning.scheduled),
                    },
                },
            },
        });

        result = assignment(result, {
            type: 'RECEIVED_ASSIGNMENTS',
            payload: [
                {
                    ...assignments[1],
                    planning: {
                        ...assignments[1].planning,
                        slugline: 'test',
                    },
                },
                {
                    _id: 'as3',
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: {scheduled: '2017-07-28T14:16:36+0000'},
                    assigned_to: {
                        assigned_date: '2017-07-28T14:16:36+0000',
                        desk: 'desk3',
                    },
                },
            ],
        });

        expect(result).toEqual({
            ...initialState,
            assignments: {
                as1: {
                    ...assignments[0],
                    planning: {
                        ...assignments[0].planning,
                        scheduled: moment(assignments[0].planning.scheduled),
                    },
                },
                as2: {
                    ...assignments[1],
                    planning: {
                        ...assignments[1].planning,
                        scheduled: moment(assignments[1].planning.scheduled),
                        slugline: 'test',
                    },
                },
                as3: {
                    _id: 'as3',
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: {scheduled: moment('2017-07-28T14:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T14:16:36+0000',
                        desk: 'desk3',
                    },
                },
            },
        });
    });

    describe('list setting reducers', () => {
        beforeEach(() => {
            state = {
                ...state,
                searchQuery: 'test',
                orderByField: 'Updated',
                orderDirection: 'Desc',
            };
        });

        it('CHANGE_LIST_SETTINGS MY ASSIGNMENTS', () => {
            const result = assignment(state, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'User',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                },
            });

            expect(result).toEqual({
                ...initialState,
                searchQuery: 'test',
                filterBy: 'User',
                orderByField: 'Created',
                orderDirection: 'Asc',
            });
        });

        it('CHANGE_LIST_SETTINGS DESK ASSIGNMENTS', () => {
            const result = assignment(state, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'Desk',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                    selectedDeskId: '1',
                },
            });

            expect(result).toEqual({
                ...initialState,
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                selectedDeskId: '1',
            });
        });
    });

    describe('list group reducers', () => {
        beforeEach(() => {
            state = assignment(state, {
                type: 'RECEIVED_ASSIGNMENTS',
                payload: [
                    assignments[0],
                    assignments[1],
                ],
            });
            initialState = cloneDeep(state);
        });

        it('SET_TODO_LIST', () => {
            const result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'TODO',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    TODO: {
                        assignmentIds: ['1', '2'],
                        total: 4,
                        lastPage: 1,
                        sortOrder: 'Asc',
                    },
                },
            });
        });

        it('SET_IN_PROGRESS_LIST', () => {
            const result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'IN_PROGRESS',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    IN_PROGRESS: {
                        assignmentIds: ['1', '2'],
                        total: 4,
                        lastPage: 1,
                        sortOrder: 'Desc',
                    },
                },
            });
        });

        it('SET_COMPLETED_LIST', () => {
            const result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'COMPLETED',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    COMPLETED: {
                        assignmentIds: ['1', '2'],
                        total: 4,
                        lastPage: 1,
                        sortOrder: 'Desc',
                    },
                },
            });
        });

        it('ADD_TO_TODO_LIST', () => {
            let result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'TODO',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            result = assignment(result, {
                type: 'ADD_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'TODO',
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    TODO: {
                        assignmentIds: ['1', '2', '3'],
                        total: 3,
                        lastPage: 1,
                        sortOrder: 'Asc',
                    },
                },
            });
        });

        it('ADD_TO_IN_PROGRESS_LIST', () => {
            let result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'IN_PROGRESS',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            result = assignment(result, {
                type: 'ADD_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'IN_PROGRESS',
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    IN_PROGRESS: {
                        assignmentIds: ['1', '2', '3'],
                        total: 3,
                        lastPage: 1,
                        sortOrder: 'Desc',
                    },
                },
            });
        });

        it('ADD_TO_COMPLETED_LIST', () => {
            let result = assignment(state, {
                type: 'SET_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'COMPLETED',
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            result = assignment(result, {
                type: 'ADD_ASSIGNMENT_LIST_ITEMS',
                payload: {
                    list: 'COMPLETED',
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...initialState,
                lists: {
                    ...initialState.lists,
                    COMPLETED: {
                        assignmentIds: ['1', '2', '3'],
                        total: 3,
                        lastPage: 1,
                        sortOrder: 'Desc',
                    },
                },
            });
        });

        it('CHANGE_LIST_VIEW_MODE', () => {
            const result = assignment(state, {
                type: 'CHANGE_LIST_VIEW_MODE',
                payload: 'TODO',
            });

            expect(result).toEqual({
                ...initialState,
                assignmentListSingleGroupView: 'TODO',
            });
        });
    });

    describe('preview & edit assignment reducers', () => {
        beforeEach(() => {
            state = assignment(state, {
                type: 'RECEIVED_ASSIGNMENTS',
                payload: [assignments[0]],
            });
            initialState = cloneDeep(state);
        });

        it('PREVIEW_ASSIGNMENT', () => {
            const result = assignment(state, {
                type: 'PREVIEW_ASSIGNMENT',
                payload: 'as1',
            });

            expect(result).toEqual({
                ...initialState,
                previewOpened: true,
                currentAssignmentId: 'as1',
                readOnly: true,
            });
        });

        it('CLOSE_PREVIEW_ASSIGNMENT', () => {
            const result = assignment(state, {type: 'CLOSE_PREVIEW_ASSIGNMENT'});

            expect(result).toEqual({
                ...initialState,
                readOnly: true,
            });
        });

        describe('REMOVE_ASSIGNMENT', () => {
            beforeEach(() => {
                state = assignment(undefined, {type: null});
                initialState = cloneDeep(state);
            });

            it('REMOVE_ASSIGNMENT returns if Assignment not loaded', () => {
                const result = assignment(state, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result).toEqual(initialState);
            });

            it('REMOVE_ASSIGNMENT removes the assignment from view lists', () => {
                // Checks to see if IN_PROGRESS list is set back to empty
                let result = assignment(initialState, {
                    type: 'RECEIVED_ASSIGNMENTS',
                    payload: [assignments[0]],
                });

                result = assignment(result, {
                    type: 'SET_ASSIGNMENT_LIST_ITEMS',
                    payload: {list: 'IN_PROGRESS', ids: ['as1'], total: 1},
                });

                result = assignment(result, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result.lists.IN_PROGRESS).toEqual({
                    assignmentIds: [],
                    total: 0,
                    lastPage: 1,
                    sortOrder: 'Desc',
                });

                // Checks to see if TO_DO list is set back to empty
                result = assignment(initialState, {
                    type: 'RECEIVED_ASSIGNMENTS',
                    payload: [assignments[0]],
                });

                result = assignment(result, {
                    type: 'SET_ASSIGNMENT_LIST_ITEMS',
                    payload: {list: 'TODO', ids: ['as1'], total: 1},
                });

                result = assignment(result, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result.lists.TODO).toEqual({
                    assignmentIds: [],
                    total: 0,
                    lastPage: 1,
                    sortOrder: 'Asc',
                });

                // Checks to see if COMPLETED list is set back to empty
                result = assignment(initialState, {
                    type: 'RECEIVED_ASSIGNMENTS',
                    payload: [assignments[0]],
                });

                result = assignment(result, {
                    type: 'SET_ASSIGNMENT_LIST_ITEMS',
                    payload: {list: 'COMPLETED', ids: ['as1'], total: 1},
                });

                result = assignment(result, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result.lists.COMPLETED).toEqual({
                    assignmentIds: [],
                    total: 0,
                    lastPage: 1,
                    sortOrder: 'Desc',
                });
            });

            it('REMOVE_ASSIGNMENT closes the preview', () => {
                let result = assignment(initialState, {
                    type: 'RECEIVED_ASSIGNMENTS',
                    payload: [assignments[0]],
                });

                result = assignment(result, {
                    type: 'SET_ASSIGNMENT_LIST_ITEMS',
                    payload: {list: 'IN_PROGRESS', ids: ['as1'], total: 1},
                });

                result = assignment(result, {
                    type: 'PREVIEW_ASSIGNMENT',
                    payload: 'as1',
                });

                result = assignment(result, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result).toEqual(jasmine.objectContaining({
                    previewOpened: false,
                    currentAssignmentId: null,
                }));
            });

            it('REMOVE_ASSIGNMENT doesnt close the preview if not viewing', () => {
                let result = assignment(initialState, {
                    type: 'RECEIVED_ASSIGNMENTS',
                    payload: [assignments[0]],
                });

                result = assignment(result, {
                    type: 'SET_ASSIGNMENT_LIST_ITEMS',
                    payload: {list: 'IN_PROGRESS', ids: ['as1'], total: 1},
                });

                result = assignment(result, {
                    type: 'PREVIEW_ASSIGNMENT',
                    payload: 'as2',
                });

                result = assignment(result, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignments: ['as1']},
                });

                expect(result).toEqual(jasmine.objectContaining({
                    previewOpened: true,
                    currentAssignmentId: 'as2',
                }));
            });
        });
    });

    it('SET_LIST_ITEMS and ADD_LIST_ITEMS', () => {
        let result = assignment(initialState, {
            type: 'SET_ASSIGNMENT_LIST_ITEMS',
            payload: {
                list: 'TODO',
                ids: ['as1', 'as2'],
                total: 2,
            },
        });

        expect(result.lists).toEqual(jasmine.objectContaining({
            TODO: {
                assignmentIds: ['as1', 'as2'],
                total: 2,
                lastPage: 1,
                sortOrder: 'Asc',
            },
        }));

        result = assignment(result, {
            type: 'ADD_ASSIGNMENT_LIST_ITEMS',
            payload: {
                list: 'TODO',
                ids: ['as3'],
                total: 3,
            },
        });

        expect(result.lists).toEqual(jasmine.objectContaining({
            TODO: {
                assignmentIds: ['as1', 'as2', 'as3'],
                total: 3,
                lastPage: 1,
                sortOrder: 'Asc',
            },
        }));

        result = assignment(result, {
            type: 'SET_ASSIGNMENT_LIST_PAGE',
            payload: {
                list: 'TODO',
                page: 2,
            },
        });

        expect(result.lists).toEqual(jasmine.objectContaining({
            TODO: {
                assignmentIds: ['as1', 'as2', 'as3'],
                total: 3,
                lastPage: 2,
                sortOrder: 'Asc',
            },
        }));
    });

    it('SET_GROUP_SORT_ORDER', () => {
        const result = assignment(initialState, {
            type: ASSIGNMENTS.ACTIONS.SET_GROUP_SORT_ORDER,
            payload: {
                list: 'TODO',
                sortOrder: 'Desc',
            },
        });

        expect(result.lists).toEqual(jasmine.objectContaining({
            TODO: {
                assignmentIds: [],
                total: 0,
                lastPage: null,
                sortOrder: 'Desc',
            },
        }));
    });

    it('SET_SORT_FIELD', () => {
        const result = assignment(initialState, {
            type: ASSIGNMENTS.ACTIONS.SET_SORT_FIELD,
            payload: 'Created',
        });

        expect(result.orderByField).toBe('Created');
    });
});
