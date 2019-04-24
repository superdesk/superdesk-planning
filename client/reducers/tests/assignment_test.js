import assignment from '../assignment';
import moment from 'moment';

describe('assignment', () => {
    let initialState;
    let stateTest;

    beforeEach(() => {
        stateTest = {
            archive: {},
            assignmentListSingleGroupView: null,
            assignments: {},
            assignmentsInCompletedList: [],
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            baseQuery: {must: []},
            completedListLastLoadedPage: null,
            completedListTotal: 0,
            currentAssignmentId: null,
            filterBy: 'Desk',
            filterByPriority: null,
            filterByType: null,
            inProgressListLastLoadedPage: null,
            inProgressListTotal: 0,
            myAssignmentsTotal: 0,
            orderByField: 'Scheduled',
            orderDirection: 'Asc',
            previewOpened: false,
            readOnly: false,
            searchQuery: null,
            selectedDeskId: '',
            todoListLastLoadedPage: null,
            todoListTotal: 0,
        };
    });

    describe('load reducers', () => {
        beforeEach(() => {
            stateTest.assignments = {
                as1: {
                    _id: 'as1',
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {scheduled: moment('2017-07-28T11:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                },
                as2: {
                    _id: 'as2',
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    planning: {scheduled: moment('2017-07-28T13:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T13:16:36+0000',
                        desk: 'desk2',
                    },
                },
            };
        });

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('initialState load', () => {
            expect(initialState).toEqual(stateTest);
        });

        it('RECEIVED_ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'RECEIVED_ASSIGNMENTS',
                payload: [
                    {
                        _id: 'as2',
                        _created: '2017-07-13T14:55:41+0000',
                        _updated: '2017-07-28T13:16:36+0000',
                        planning: {
                            scheduled: '2017-07-28T13:16:36+0000',
                            slugline: 'test',
                        },
                        assigned_to: {
                            assigned_date: '2017-07-28T13:16:36+0000',
                            desk: 'desk2',
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
                ...stateTest,
                assignments: {
                    as1: {
                        _id: 'as1',
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: {scheduled: moment('2017-07-28T11:16:36+0000')},
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                    },
                    as2: {
                        _id: 'as2',
                        _created: '2017-07-13T14:55:41+0000',
                        _updated: '2017-07-28T13:16:36+0000',
                        planning: {
                            scheduled: moment('2017-07-28T13:16:36+0000'),
                            slugline: 'test',
                        },
                        assigned_to: {
                            assigned_date: '2017-07-28T13:16:36+0000',
                            desk: 'desk2',
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
    });

    describe('list setting reducers', () => {
        beforeEach(() => {
            stateTest = {
                ...stateTest,
                searchQuery: 'test',
                orderByField: 'Updated',
                orderDirection: 'Desc',
            };
        });

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('CHANGE_LIST_SETTINGS MY ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'User',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                },
            });

            expect(result).toEqual({
                ...stateTest,
                filterBy: 'User',
                orderByField: 'Created',
                orderDirection: 'Asc',
            });
        });

        it('CHANGE_LIST_SETTINGS DESK ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'Desk',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                    selectedDeskId: '1',
                },
            });

            expect(result).toEqual({
                ...stateTest,
                orderByField: 'Created',
                orderDirection: 'Asc',
                selectedDeskId: '1',
            });
        });
    });

    describe('list group reducers', () => {
        beforeEach(() => {
            stateTest.assignments = {
                as1: {
                    _id: 'as1',
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {scheduled: moment('2017-07-28T11:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                },
                as2: {
                    _id: 'as2',
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    planning: {scheduled: moment('2017-07-28T13:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T13:16:36+0000',
                        desk: 'desk2',
                    },
                },
            };
        });

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('initialState list setting', () => {
            expect(initialState).toEqual(stateTest);
        });

        it('SET_TODO_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_TODO_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInTodoList: ['1', '2'],
                todoListTotal: 4,
                todoListLastLoadedPage: 1,
            });
        });

        it('SET_IN_PROGRESS_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_IN_PROGRESS_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInInProgressList: ['1', '2'],
                inProgressListTotal: 4,
                inProgressListLastLoadedPage: 1,
            });
        });

        it('SET_COMPLETED_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_COMPLETED_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInCompletedList: ['1', '2'],
                completedListTotal: 4,
                completedListLastLoadedPage: 1,
            });
        });

        it('ADD_TO_TODO_LIST', () => {
            initialState.assignmentsInTodoList = ['1', '2'];
            const result = assignment(initialState, {
                type: 'ADD_TO_TODO_LIST',
                payload: {
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInTodoList: ['1', '2', '3'],
                todoListTotal: 3,
            });
        });

        it('ADD_TO_IN_PROGRESS_LIST', () => {
            initialState.assignmentsInInProgressList = ['1', '2'];

            const result = assignment(initialState, {
                type: 'ADD_TO_IN_PROGRESS_LIST',
                payload: {
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInInProgressList: ['1', '2', '3'],
                inProgressListTotal: 3,
            });
        });

        it('ADD_TO_COMPLETED_LIST', () => {
            initialState.assignmentsInCompletedList = ['1', '2'];

            const result = assignment(initialState, {
                type: 'ADD_TO_COMPLETED_LIST',
                payload: {
                    ids: ['3'],
                    total: 3,
                },
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentsInCompletedList: ['1', '2', '3'],
                completedListTotal: 3,
            });
        });

        it('CHANGE_LIST_VIEW_MODE', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_VIEW_MODE',
                payload: 'TODO',
            });

            expect(result).toEqual({
                ...stateTest,
                assignmentListSingleGroupView: 'TODO',
            });
        });
    });

    describe('preview&edit assignment reducers', () => {
        beforeEach(() => {
            stateTest.assignments = {
                as1: {
                    _id: 'as1',
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: {
                        assigned_to: {
                            assigned_date: '2017-07-28T14:16:36+0000',
                            desk: 'desk3',
                        },
                    },
                },
            };
        });

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('initialState preview&edit assignment', () => {
            expect(initialState).toEqual(stateTest);
        });

        it('PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, {
                type: 'PREVIEW_ASSIGNMENT',
                payload: 'as1',
            });

            expect(result).toEqual({
                ...stateTest,
                previewOpened: true,
                currentAssignmentId: 'as1',
                readOnly: true,
            });
        });

        it('CLOSE_PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, {type: 'CLOSE_PREVIEW_ASSIGNMENT'});

            expect(result).toEqual({
                ...stateTest,
                readOnly: true,
            });
        });

        describe('REMOVE_ASSIGNMENT', () => {
            beforeEach(() => {
                initialState = assignment(undefined, {type: null});
            });

            it('REMOVE_ASSIGNMENT returns if Assignment not loaded', () => {
                const result = assignment(initialState, {
                    type: 'REMOVE_ASSIGNMENT',
                    payload: {assignment: 'a1'},
                });

                expect(result).toEqual(initialState);
            });

            it('REMOVE_ASSIGNMENT removes the assignment from view lists', () => {
                // Checks to see if assignmentsInInProgressList is set back to empty list
                let result = assignment(
                    {
                        ...initialState,
                        assignments: {a1: {_id: 'a1'}},
                        assignmentsInInProgressList: ['a1'],
                        inProgressListTotal: 1,
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignment: 'a1'},
                    }
                );

                expect(result).toEqual(initialState);

                // Checks to see if assignmentsInTodoList is set back to empty list
                result = assignment(
                    {
                        ...initialState,
                        assignments: {a1: {_id: 'a1'}},
                        assignmentsInTodoList: ['a1'],
                        todoListTotal: 1,
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignment: 'a1'},
                    }
                );
                expect(result).toEqual(initialState);

                // Checks to see if assignmentsInCompletedList is set back to empty list
                result = assignment(
                    {
                        ...initialState,
                        assignments: {a1: {_id: 'a1'}},
                        assignmentsInCompletedList: ['a1'],
                        completedListTotal: 1,
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignment: 'a1'},
                    }
                );
                expect(result).toEqual(initialState);
            });

            it('REMOVE_ASSIGNMENT closes preview viewing the removed Assignment', () => {
                // Closes the preview and sets currentAssignmentId to null
                let result = assignment(
                    {
                        ...initialState,
                        assignments: {a1: {_id: 'a1'}},
                        assignmentsInInProgressList: ['a1'],
                        inProgressListTotal: 1,
                        previewOpened: true,
                        currentAssignmentId: 'a1',
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignment: 'a1'},
                    }
                );

                expect(result).toEqual(initialState);

                // Removes the assignment from the store, but keeps the preview open
                result = assignment(
                    {
                        ...initialState,
                        assignments: {
                            a1: {_id: 'a1'},
                            a2: {_id: 'a2'},
                        },
                        assignmentsInInProgressList: ['a1', 'a2'],
                        inProgressListTotal: 2,
                        previewOpened: true,
                        currentAssignmentId: 'a2',
                    },
                    {
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignment: 'a1'},
                    }
                );

                expect(result).toEqual({
                    ...initialState,
                    assignments: {a2: {_id: 'a2'}},
                    assignmentsInInProgressList: ['a2'],
                    inProgressListTotal: 1,
                    previewOpened: true,
                    currentAssignmentId: 'a2',
                });
            });
        });
    });
});
