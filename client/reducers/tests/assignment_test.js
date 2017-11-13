import assignment from '../assignment'
import moment from 'moment'

describe('assignment', () => {
    describe('load reducers', () => {
        let initialState
        let stateTest = {
            assignments: {
                1: {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T11:16:36+0000') },
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                },
                2: {
                    _id: 2,
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T13:16:36+0000') },
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
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('initialState load', () => {
            expect(initialState).toEqual(stateTest)
        })

        it('RECEIVED_ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'RECEIVED_ASSIGNMENTS',
                payload: [
                    {
                        _id: 2,
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
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: { scheduled: '2017-07-28T14:16:36+0000' },
                        assigned_to: {
                            assigned_date: '2017-07-28T14:16:36+0000',
                            desk: 'desk3',
                        },
                    },
                ],
            })
            expect(result).toEqual({
                assignments: {
                    1: {
                        _id: 1,
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: { scheduled: moment('2017-07-28T11:16:36+0000') },
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                    },
                    2: {
                        _id: 2,
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
                    3: {
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: { scheduled: moment('2017-07-28T14:16:36+0000') },
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
            })
        })
    })

    describe('select reducers', () => {
        let initialState
        let stateTest = {
            assignments: {},
            filterBy: 'All',
            previewOpened: false,
            currentAssignmentId: null,
            assignmentsInInProgressList: [],
            assignmentsInTodoList: [],
            assignmentsInCompletedList: [],
            assignmentListSingleGroupView: null,
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('initialState select', () => {
            expect(initialState).toEqual(stateTest)
        })

        it('SELECT_ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'SELECT_ASSIGNMENTS',
                payload: ['assignment2', 'assignment3'],
            })
            expect(result).toEqual({
                assignments: {},
                filterBy: 'All',
                previewOpened: false,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
            })
        })

        it('DESELECT_ASSIGNMENT', () => {
            const result = assignment(initialState, {
                type: 'DESELECT_ASSIGNMENT',
                payload: 'assignment2',
            })
            expect(result).toEqual({
                assignments: {},
                filterBy: 'All',
                previewOpened: false,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
                currentAssignmentId: null,
            })
        })
    })

    describe('list setting reducers', () => {
        let initialState
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
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('CHANGE_LIST_SETTINGS', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'User',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                },
            })
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
            })
        })
    })

    describe('list group reducers', () => {
        let initialState
        let stateTest = {
            assignments: {
                1: {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T11:16:36+0000') },
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                },
                2: {
                    _id: 2,
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T13:16:36+0000') },
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
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('initialState list setting', () => {
            expect(initialState).toEqual(stateTest)
        })

        it('SET_TODO_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_TODO_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            })
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
            })
        })

        it('SET_IN_PROGRESS_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_IN_PROGRESS_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            })
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
            })
        })

        it('SET_COMPLETED_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_COMPLETED_LIST',
                payload: {
                    ids: ['1', '2'],
                    total: 4,
                },
            })
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
            })
        })

        it('ADD_TO_TODO_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
                3: {
                    _id: 3,
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T14:16:36+0000') },
                    assigned_to: {
                        assigned_date: '2017-07-28T14:16:36+0000',
                        desk: 'desk3',
                    },
                },
            }
            initialState.assignmentsInTodoList = ['1', '2']

            const result = assignment(initialState, {
                type: 'ADD_TO_TODO_LIST',
                payload: ['3'],
            })
            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: ['1', '2', '3'],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
            })
        })

        it('ADD_TO_IN_PROGRESS_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
                3: {
                    _id: 3,
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T14:16:36+0000') },
                    assigned_to: {
                        assigned_date: '2017-07-28T14:16:36+0000',
                        desk: 'desk3',
                    },
                },
            }
            initialState.assignmentsInInProgressList = ['1', '2']

            const result = assignment(initialState, {
                type: 'ADD_TO_IN_PROGRESS_LIST',
                payload: ['3'],
            })
            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: ['1', '2', '3'],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
            })
        })

        it('ADD_TO_COMPLETED_LIST', () => {
            initialState.assignments = {
                ...initialState.assignments,
                3: {
                    _id: 3,
                    _created: '2017-07-13T15:55:41+0000',
                    _updated: '2017-07-28T14:16:36+0000',
                    planning: { scheduled: moment('2017-07-28T14:16:36+0000') },
                    assigned_to: {
                        assigned_date: '2017-07-28T14:16:36+0000',
                        desk: 'desk3',
                    },
                },
            }
            initialState.assignmentsInCompletedList = ['1', '2']

            const result = assignment(initialState, {
                type: 'ADD_TO_COMPLETED_LIST',
                payload: ['3'],
            })
            expect(result).toEqual({
                assignments: initialState.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: ['1', '2', '3'],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: null,
            })
        })

        it('CHANGE_LIST_VIEW_MODE', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_VIEW_MODE',
                payload: 'TODO',
            })
            expect(result).toEqual({
                assignments: stateTest.assignments,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                currentAssignmentId: null,
                filterBy: 'All',
                previewOpened: false,
                assignmentListSingleGroupView: 'TODO',
            })
        })
    })

    describe('preview&edit assignment reducers', () => {
        let initialState
        let stateTest = {
            assignments: {
                a1: {
                    _id: 'a1',
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
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('initialState preview&edit assignment', () => {
            expect(initialState).toEqual(stateTest)
        })

        it('PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, {
                type: 'PREVIEW_ASSIGNMENT',
                payload: 'a1',
            })
            expect(result).toEqual({
                assignments: { a1: initialState.assignments.a1 },
                previewOpened: true,
                currentAssignmentId: 'a1',
                readOnly: true,
                filterBy: 'All',
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
            })
        })

        it('CLOSE_PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, { type: 'CLOSE_PREVIEW_ASSIGNMENT' })
            expect(result).toEqual({
                assignments: { a1: initialState.assignments.a1 },
                previewOpened: false,
                currentAssignmentId: null,
                filterBy: 'All',
                readOnly: true,
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
            })
        })

        it('OPEN_ASSIGNMENT_EDITOR', () => {
            const result = assignment(initialState, {
                type: 'OPEN_ASSIGNMENT_EDITOR',
                payload: 'a1',
            })
            expect(result).toEqual({
                assignments: { a1: initialState.assignments.a1 },
                previewOpened: true,
                currentAssignmentId: 'a1',
                readOnly: false,
                filterBy: 'All',
                assignmentsInInProgressList: [],
                assignmentsInTodoList: [],
                assignmentsInCompletedList: [],
                assignmentListSingleGroupView: null,
            })
        })
    })
})
