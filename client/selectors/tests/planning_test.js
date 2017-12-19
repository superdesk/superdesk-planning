import * as selectors from '../index';
import {cloneDeep} from 'lodash';
import moment from 'moment';
import {AGENDA} from '../../constants';

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

    it('getCurrentAgenda', () => {
        let result;

        result = selectors.getCurrentAgenda(state);
        expect(result).toEqual(state.agenda.agendas[0]);
        const newState = cloneDeep(state);

        delete newState.agenda.currentAgendaId;
        result = selectors.getCurrentAgenda(newState);
        expect(result).toEqual(undefined);
    });

    describe('getFilteredPlanningList', () => {
        let result;
        let newState;

        const _getPlanningItems = () => (selectors.getFilteredPlanningList(newState));

        beforeEach(() => {
            newState = cloneDeep(state);
        });

        it('without a selected agenda', () => {
            delete newState.agenda.currentAgendaId;
            newState.planning.planningsInList = [];
            result = _getPlanningItems();
            expect(result).toEqual([]);
        });

        it('Planning items with no agenda', () => {
            newState.agenda.currentAgendaId = AGENDA.FILTER.NO_AGENDA_ASSIGNED;
            newState.planning.planningsInList = ['c', 'e'];
            result = _getPlanningItems();
            expect(result).toEqual([newState.planning.plannings.c, newState.planning.plannings.e]);
        });
    });

    it('getEventToBeDetailed', () => {
        const event = selectors.getEventToBeDetailed(state);

        expect(event._plannings.length).toBe(1);
        expect(event._plannings[0]._agendas[0].name).toBe('Agenda 1');
    });

    it('getDisabledAgendas', () => {
        const agendas = selectors.getDisabledAgendas(state);

        expect(agendas.length).toBe(1);
        expect(agendas).toEqual([{
            _id: '3',
            name: 'Agenda 3',
            is_enabled: false,
        }]);
    });

    it('getEnabledAgendas', () => {
        const agendas = selectors.getEnabledAgendas(state);

        expect(agendas.length).toBe(2);
        expect(agendas).toEqual([
            {
                _id: '1',
                name: 'Agenda 1',
                is_enabled: true,
            }, {
                _id: '2',
                name: 'Agenda 2',
                is_enabled: true,
            },
        ]);
    });

    it('getEventsOrderedByDay', () => {
        const events = selectors.getEventsOrderedByDay(state);

        expect(events.map((d) => d.date)).toEqual([
            '2099-10-15',
            '2099-10-16',
            '2099-10-17',
        ]);
        expect(events[0].event._id).toEqual('event1');
        expect(events[1].event._id).toEqual('event1');
        expect(events[2].event._id).toEqual('event2');
    });
});
