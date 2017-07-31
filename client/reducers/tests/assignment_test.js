import assignment from '../assignment'

describe('assignment', () => {
    describe('load reducers', () => {
        let initialState
        let stateTest = {
            assignments: [
                {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                    },
                },
                {
                    _id: 2,
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    planning: {
                        assigned_to: {
                            assigned_date: '2017-07-28T13:16:36+0000',
                            desk: 'desk2',
                        },
                    },
                },
            ],
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
                            assigned_to: {
                                assigned_date: '2017-07-28T13:16:36+0000',
                                desk: 'desk2',
                            },
                        },
                    },
                    {
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T14:16:36+0000',
                                desk: 'desk3',
                            },
                        },
                    },
                ],
            })
            expect(result).toEqual({
                assignments: [
                    {
                        _id: 2,
                        _created: '2017-07-13T14:55:41+0000',
                        _updated: '2017-07-28T13:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T13:16:36+0000',
                                desk: 'desk2',
                            },
                        },
                    },
                    {
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T14:16:36+0000',
                                desk: 'desk3',
                            },
                        },
                    },
                ],
            })
        })

        it('RECEIVED_MORE_ASSIGNMENTS', () => {
            const result = assignment(initialState, {
                type: 'RECEIVED_MORE_ASSIGNMENTS',
                payload: [
                    {
                        _id: 2,
                        _created: '2017-07-13T14:55:41+0000',
                        _updated: '2017-07-28T13:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T13:16:36+0000',
                                desk: 'desk2',
                            },
                        },
                    },
                    {
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T14:16:36+0000',
                                desk: 'desk3',
                            },
                        },
                    },
                ],
            })
            expect(result).toEqual({
                assignments: [
                    {
                        _id: 1,
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T11:16:36+0000',
                                desk: 'desk1',
                            },
                        },
                    },
                    {
                        _id: 2,
                        _created: '2017-07-13T14:55:41+0000',
                        _updated: '2017-07-28T13:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T13:16:36+0000',
                                desk: 'desk2',
                            },
                        },
                    },
                    {
                        _id: 3,
                        _created: '2017-07-13T15:55:41+0000',
                        _updated: '2017-07-28T14:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T14:16:36+0000',
                                desk: 'desk3',
                            },
                        },
                    },
                ],
            })
        })
    })

    describe('select reducers', () => {
        let initialState
        let stateTest = {
            assignments: [],
            selectedAssignments: ['assignment1', 'assignment2'],
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
                assignments: [],
                selectedAssignments: ['assignment1', 'assignment2', 'assignment3'],
            })
        })

        it('DESELECT_ASSIGNMENT', () => {
            const result = assignment(initialState, {
                type: 'DESELECT_ASSIGNMENT',
                payload: 'assignment2',
            })
            expect(result).toEqual({
                assignments: [],
                selectedAssignments: ['assignment1'],
            })
        })
    })

    describe('list setting reducers', () => {
        let initialState
        let stateTest = {
            assignments: [],
            selectedAssignments: [],
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            lastAssignmentLoadedPage: 2,

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
                assignments: [],
                selectedAssignments: [],
                filterBy: 'User',
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                lastAssignmentLoadedPage: 3,
            })
        })
    })
})
