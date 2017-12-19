import * as selectors from '../index';
import moment from 'moment';

describe('selectors', () => {
    const state = {
        assignment: {
            assignments: {
                1: {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                        user: 'user1',
                    },
                },
                2: {
                    _id: 2,
                    _created: '2017-07-13T14:55:41+0000',
                    _updated: '2017-07-28T13:16:36+0000',
                    assigned_to: {
                        assigned_date: '2017-07-28T13:16:36+0000',
                        desk: 'desk2',
                    },
                },
            },
            assignmentsInTodoList: [1, 2],
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            lastAssignmentLoadedPage: 2,
            previewOpened: true,
            currentAssignmentId: 1,
            readOnly: true,
        },
        events: {
            events: {
                event1: {
                    _id: 'event1',
                    name: 'event1',
                    dates: {
                        start: moment('2099-10-15T13:01:00'),
                        end: moment('2099-10-16T14:01:00'),
                    },
                },
                event2: {
                    _id: 'event2',
                    name: 'event2',
                    dates: {
                        start: moment('2099-10-17T13:01:00'),
                        end: moment('2099-10-17T14:01:00'),
                    },
                },
            },
            showEventDetails: 'event1',
            eventsInList: ['event1', 'event2'],
            search: {currentSearch: {fulltext: 'event'}},
        },
        planning: {
            onlySpiked: false,
            plannings: {
                a: {
                    name: 'name a',
                    event_item: 'event1',
                    agendas: ['1', '2'],
                },
                b: {
                    name: 'name b',
                    state: 'draft',
                    agendas: ['1', '2'],
                },
                c: {name: 'plan c'},
                d: {
                    name: 'plan d',
                    state: 'spiked',
                    agendas: ['1'],
                },
                e: {name: 'plan e'},
            },
            planningsInList: ['a', 'b', 'd'],
            currentPlanningId: 'b',
            search: {
                currentSearch: undefined,
                advancedSearchOpened: false,
            },
        },
        agenda: {
            agendas: [{
                _id: '1',
                name: 'Agenda 1',
                is_enabled: true,
            }, {
                _id: '2',
                name: 'Agenda 2',
                is_enabled: true,
            }, {
                _id: '3',
                name: 'Agenda 3',
                is_enabled: false,
            }],
            currentAgendaId: '1',
        },
        session: {identity: {_id: 'user1'}},
    };

    it('getFilterBy', () => {
        const filterBy = selectors.getFilterBy(state);

        expect(filterBy).toEqual('All');
    });

    it('getSearchQuery', () => {
        const searchQuery = selectors.getSearchQuery(state);

        expect(searchQuery).toEqual('test');
    });

    it('getOrderByField', () => {
        const orderByField = selectors.getOrderByField(state);

        expect(orderByField).toEqual('Updated');
    });

    it('getOrderDirection', () => {
        const orderDirection = selectors.getOrderDirection(state);

        expect(orderDirection).toEqual('Desc');
    });

    it('getAssignmentListSettings', () => {
        const assignmentListSettings = selectors.getAssignmentListSettings(state);

        expect(assignmentListSettings).toEqual({
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            filterByState: null,
            filterByType: null,
            filterByPriority: null,
        });
    });

    it('getCurrentUserId', () => {
        const currentUserId = selectors.getCurrentUserId(state);

        expect(currentUserId).toEqual('user1');
    });

    it('getMyAssignmentsCount', () => {
        const myAssignmentsCount = selectors.getMyAssignmentsCount(state);

        expect(myAssignmentsCount).toEqual(1);
    });

    it('getPreviewAssignmentOpened', () => {
        const previewAssignmentOpened = selectors.getPreviewAssignmentOpened(state);

        expect(previewAssignmentOpened).toBeTruthy();
    });

    it('getCurrentAssignment', () => {
        const currentAssignment = selectors.getCurrentAssignment(state);

        expect(currentAssignment).toEqual({
            _id: 1,
            _created: '2017-07-13T13:55:41+0000',
            _updated: '2017-07-28T11:16:36+0000',
            assigned_to: {
                assigned_date: '2017-07-28T11:16:36+0000',
                desk: 'desk1',
                user: 'user1',
            },
        });
    });

    it('getReadOnlyAssignment', () => {
        const readOnly = selectors.getReadOnlyAssignment(state);

        expect(readOnly).toBeTruthy();
    });

    it('getAssignmentTodoListPage', () => {
        const page = selectors.getAssignmentTodoListPage(state);

        expect(page).toBe(1);
    });

    it('getAssignmentInProgressPage', () => {
        const page = selectors.getAssignmentInProgressPage(state);

        expect(page).toBe(1);
    });

    it('getAssignmentCompletedPage', () => {
        const page = selectors.getAssignmentCompletedPage(state);

        expect(page).toBe(1);
    });

    it('getAssignmentsToDoListCount', () => {
        const count = selectors.getAssignmentsToDoListCount(state);

        expect(count).toBe(0);
    });

    it('getAssignmentsInProgressListCount', () => {
        const count = selectors.getAssignmentsInProgressListCount(state);

        expect(count).toBe(0);
    });

    it('getAssignmentsCompletedListCount', () => {
        const count = selectors.getAssignmentsCompletedListCount(state);

        expect(count).toBe(0);
    });

    it('getAssignmentListSingleGroupView', () => {
        const view = selectors.getAssignmentListSingleGroupView(state);

        expect(view).toBe(null);
    });
});
