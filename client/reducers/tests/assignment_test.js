import assignment from '../assignment';
import moment from 'moment';

describe('assignment', () => {
    describe('load reducers', () => {
        let initialState;
        let stateTest = {
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
                    planning: {scheduled: moment('2017-07-28T13:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T13:16:36+0000',
                        desk: 'desk2',
                    },
                },
            },
            filterBy: 'All',
            previewOpened: false,
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
            currentAssignmentId: null,
            archive: {},
        };

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
                filterBy: 'All',
                previewOpened: false,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
                archive: {},
            });
        });
    });

    describe('select reducers', () => {
        let initialState;
        let stateTest = {
            assignments: {},
            filterBy: 'All',
            previewOpened: false,
            currentAssignmentId: null,
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
            archive: {},
        };

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('initialState select', () => {
            expect(initialState).toEqual(stateTest);
        });

        it('SELECT_ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'SELECT_ASSIGNMENTS',
                payload: ['assignment2', 'assignment3'],
            });

            expect(result).toEqual({
                assignments: {},
                filterBy: 'All',
                previewOpened: false,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
                archive: {},
            });
        });

        it('DESELECT_ASSIGNMENT', () => {
            const result = assignment(initialState, {
                type: 'DESELECT_ASSIGNMENT',
                payload: 'assignment2',
            });

            expect(result).toEqual({
                assignments: {},
                filterBy: 'All',
                previewOpened: false,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
                archive: {},
            });
        });
    });

    describe('list setting reducers', () => {
        let initialState;
        let stateTest = {
            assignments: {},
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
            currentAssignmentId: null,
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            previewOpened: false,
            archive: {},
        };

        beforeEach(() => {
            initialState = assignment(stateTest, {type: null});
        });

        it('CHANGE_LIST_SETTINGS', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'User',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                },
            });

            expect(result).toEqual({
                assignments: {},
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
                filterBy: 'User',
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                previewOpened: false,
                archive: {},
            });
        });
    });

    describe('list group reducers', () => {
        let initialState;
        let stateTest = {
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
                    planning: {scheduled: moment('2017-07-28T13:16:36+0000')},
                    assigned_to: {
                        assigned_date: '2017-07-28T13:16:36+0000',
                        desk: 'desk2',
                    },
                },
            },
            filterBy: 'All',
            previewOpened: false,
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
            currentAssignmentId: null,
            archive: {},
        };

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
                assignments: stateTest.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: ['1', '2'],
                assignmentsInCompletedList: [],
                todoListTotal: 4,
                todoListLastLoadedPage: 1,
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
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
                assignments: stateTest.assignments,
                assignmentsInInProgressList: ['1', '2'],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                inProgressListTotal: 4,
                inProgressListLastLoadedPage: 1,
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
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
                assignments: stateTest.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: ['1', '2'],
                completedListTotal: 4,
                completedListLastLoadedPage: 1,
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('ADD_TO_TODO_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
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
            };
            initialState.assignmentsInTodoList = ['1', '2'];

            const result = assignment(initialState, {
                type: 'ADD_TO_TODO_LIST',
                payload: ['3'],
            });

            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: ['1', '2', '3'],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('ADD_TO_IN_PROGRESS_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
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
            };
            initialState.assignmentsInInProgressList = ['1', '2'];

            const result = assignment(initialState, {
                type: 'ADD_TO_IN_PROGRESS_LIST',
                payload: ['3'],
            });

            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: ['1', '2', '3'],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('ADD_TO_COMPLETED_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
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
            };
            initialState.assignmentsInCompletedList = ['1', '2'];

            const result = assignment(initialState, {
                type: 'ADD_TO_COMPLETED_LIST',
                payload: ['3'],
            });

            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: ['1', '2', '3'],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('CHANGE_LIST_VIEW_MODE', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_VIEW_MODE',
                payload: 'TODO',
            });

            expect(result).toEqual({
                assignments: stateTest.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: 'TODO',
                archive: {},
            });
        });
    });

    describe('preview&edit assignment reducers', () => {
        let initialState;
        let stateTest = {
            assignments: {
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
            },
            previewOpened: false,
            filterBy: 'All',
            currentAssignmentId: null,
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
            archive: {},
        };

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
                assignments: {as1: initialState.assignments.as1},
                previewOpened: true,
                currentAssignmentId: 'as1',
                readOnly: true,
                filterBy: 'All',
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('CLOSE_PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, {type: 'CLOSE_PREVIEW_ASSIGNMENT'});

            expect(result).toEqual({
                assignments: {as1: initialState.assignments.as1},
                previewOpened: false,
                currentAssignmentId: null,
                filterBy: 'All',
                readOnly: true,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                archive: {},
            });
        });

        it('OPEN_ASSIGNMENT_EDITOR', () => {
            const result = assignment(initialState, {
                type: 'OPEN_ASSIGNMENT_EDITOR',
                payload: 'as1',
            });

            expect(result).toEqual({
                assignments: {as1: initialState.assignments.as1},
                previewOpened: true,
                currentAssignmentId: 'as1',
                readOnly: false,
                filterBy: 'All',
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                archive: {},
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
                    previewOpened: true,
                    currentAssignmentId: 'a2',
                });
            });
        });
    });
});
