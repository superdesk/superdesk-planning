import * as selectors from '../index';
import {AGENDA} from '../../constants';
import {cloneDeep} from 'lodash';
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
            filterBy: 'Desk',
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

    it('currentAgenda', () => {
        let result;

        result = selectors.planning.currentAgenda(state);
        expect(result).toEqual(state.agenda.agendas[0]);
        const newState = cloneDeep(state);

        delete newState.agenda.currentAgendaId;
        result = selectors.planning.currentAgenda(newState);
        expect(result).toEqual(undefined);
    });

    it('default currentAgendaId', () => {
        let result;

        result = selectors.planning.currentAgenda(state);
        expect(result).toEqual(state.agenda.agendas[0]);
        const newState = cloneDeep(state);

        newState.agenda.currentAgendaId = undefined;
        result = selectors.planning.currentAgendaId(newState);
        expect(result).toEqual(AGENDA.FILTER.ALL_PLANNING);
    });
});
