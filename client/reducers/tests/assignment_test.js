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
            selectedAssignments: [],
            previewOpened: false,
            assignmentsInList: [1, 2],
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
                selectedAssignments: [],
                previewOpened: false,
                assignmentsInList: [1, 2],
                currentAssignmentId: null,
            })
        })

        it('SET_ASSIGNMENTS_LIST', () => {
            const result = assignment(initialState, {
                type: 'SET_ASSIGNMENTS_LIST',
                payload: [1, 2, 3],
            })

            expect(result.assignmentsInList).toEqual([1, 2, 3])
        })

        it('ADD_TO_ASSIGNMENTS_LIST', () => {
            const result = assignment(initialState, {
                type: 'ADD_TO_ASSIGNMENTS_LIST',
                payload: [2, 3, 4],
            })

            expect(result.assignmentsInList).toEqual([1, 2, 3, 4])
        })
    })

    describe('select reducers', () => {
        let initialState
        let stateTest = {
            assignments: {},
            selectedAssignments: ['assignment1', 'assignment2'],
            filterBy: 'All',
            previewOpened: false,
            assignmentsInList: [],
            currentAssignmentId: null,
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
                selectedAssignments: ['assignment1', 'assignment2', 'assignment3'],
                filterBy: 'All',
                previewOpened: false,
                assignmentsInList: [],
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
                selectedAssignments: ['assignment1'],
                filterBy: 'All',
                previewOpened: false,
                assignmentsInList: [],
                currentAssignmentId: null,
            })
        })
    })

    describe('list setting reducers', () => {
        let initialState
        let stateTest = {
            assignments: {},
            selectedAssignments: [],
            assignmentsInList: [],
            currentAssignmentId: null,
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            lastAssignmentLoadedPage: 2,
            previewOpened: false,
        }

        beforeEach(() => { initialState = assignment(stateTest, { type: null })})

        it('initialState list setting', () => {
            expect(initialState).toEqual(stateTest)
        })

        it('CHANGE_LIST_SETTINGS', () => {
            const result = assignment(initialState, {
                type: 'CHANGE_LIST_SETTINGS',
                payload: {
                    filterBy: 'User',
                    orderByField: 'Created',
                    orderDirection: 'Asc',
                    lastAssignmentLoadedPage: 3,
                },
            })
            expect(result).toEqual({
                assignments: {},
                selectedAssignments: [],
                assignmentsInList: [],
                currentAssignmentId: null,
                filterBy: 'User',
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                lastAssignmentLoadedPage: 3,
                previewOpened: false,
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
            selectedAssignments: [],
            assignmentsInList: ['a1'],
            currentAssignmentId: null,
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
                selectedAssignments: [],
                assignmentsInList: ['a1'],
            })
        })

        it('CLOSE_PREVIEW_ASSIGNMENT', () => {
            const result = assignment(initialState, { type: 'CLOSE_PREVIEW_ASSIGNMENT' })
            expect(result).toEqual({
                assignments: { a1: initialState.assignments.a1 },
                previewOpened: false,
                currentAssignmentId: null,
                filterBy: 'All',
                selectedAssignments: [],
                readOnly: true,
                assignmentsInList: ['a1'],
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
                selectedAssignments: [],
                assignmentsInList: ['a1'],
            })
        })
    })
})
