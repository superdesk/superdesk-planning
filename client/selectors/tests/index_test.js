import * as selectors from '../index'
import { cloneDeep } from 'lodash'
import moment from 'moment'

describe('selectors', () => {
    const state = {
        events: {
            events: {
                event1: {
                    _id: 'event1',
                    name: 'event1',
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-16T14:01:00+0000'),
                    },
                },
                event2: {
                    _id: 'event2',
                    name: 'event2',
                    dates: {
                        start: moment('2016-10-17T13:01:00+0000'),
                        end: moment('2016-10-17T14:01:00+0000'),
                    },
                },
            },
            showEventDetails: 'event1',
            eventsInList: ['event1', 'event2'],
            search: { currentSearch: { fulltext: 'event' } },
        },
        planning: {
            onlyFuture: false,
            onlySpiked: false,
            plannings: {
                a: {
                    name: 'name a',
                    event_item: 'event1',
                },
                b: {
                    name: 'name b',
                    state: 'active',
                },
                c: { name: 'plan c' },
                d: {
                    name: 'plan d',
                    state: 'spiked',
                },
            },
            currentPlanningId: 'b',
        },
        agenda: {
            agendas: [{
                _id: '1',
                name: 'Agenda 1',
                planning_items: ['a', 'b', 'd'],
            }, {
                _id: '2',
                name: 'Agenda 2',
                state: 'active',
            }, {
                _id: '3',
                name: 'Agenda 3',
                state: 'spiked',
                planning_items: ['c'],
            }],
            currentAgendaId: '1',
        },
    }

    it('getCurrentAgenda', () => {
        let result
        result = selectors.getCurrentAgenda(state)
        expect(result).toEqual(state.agenda.agendas[0])
        const newState = cloneDeep(state)
        delete newState.agenda.currentAgendaId
        result = selectors.getCurrentAgenda(newState)
        expect(result).toEqual(undefined)
    })

    describe('getCurrentAgendaPlannings', () => {
        let result
        let newState

        const _getPlanningItems = () => (selectors.getCurrentAgendaPlannings(newState))
        beforeEach(() => { newState = cloneDeep(state) })

        it('show all except spiked', () => {
            result = _getPlanningItems()
            expect(result).toEqual([newState.planning.plannings.a, newState.planning.plannings.b])
        })

        it('empty planning items', () => {
            delete newState.agenda.agendas[0].planning_items
            result = _getPlanningItems()
            expect(result).toEqual([])
        })

        it('without a selected agenda', () => {
            delete newState.agenda.currentAgendaId
            result = _getPlanningItems()
            expect(result).toEqual([])
        })

        it('empty list when all items are spiked', () => {
            newState.planning.plannings.a.state = 'spiked'
            newState.planning.plannings.b.state = 'spiked'
            result = _getPlanningItems()
            expect(result).toEqual([])
        })

        it('only future items', () => {
            // a and b have no coverage due date or event ending date, so they appear
            newState.planning.onlyFuture = true
            result = _getPlanningItems()
            expect(result).toEqual([newState.planning.plannings.b])

            // a appears because it has a linked event with a future ending date
            newState = cloneDeep(state)
            newState.planning.onlyFuture = true
            const future = '2045-10-19T13:01:50+0000'
            const past = '1900-10-19T13:01:50+0000'
            newState.events.events.event1.dates = { end: moment(future) }
            newState.planning.plannings.b.coverages = [{ planning: { scheduled: past } }]
            result = selectors.getCurrentAgendaPlannings(newState)
            expect(result).toEqual([newState.planning.plannings.a])

            // b appears because it has a future due date
            newState = cloneDeep(state)
            newState.planning.onlyFuture = true
            newState.events.events.event1.dates = { end: moment(past) }
            newState.planning.plannings.b.coverages = [{ planning: { scheduled: future } }]
            result = selectors.getCurrentAgendaPlannings(newState)
            expect(result).toEqual([newState.planning.plannings.b])
        })

        it('only spiked items', () => {
            newState.planning.onlySpiked = true
            result = _getPlanningItems()
            expect(result).toEqual([newState.planning.plannings.d])
        })

        it('only future spiked items', () => {
            // a and d have no coverage due date or event ending date, so they appear
            newState.planning.onlySpiked = true
            newState.planning.onlyFuture = true
            newState.planning.plannings.a.state = 'spiked'
            result = _getPlanningItems()
            expect(result).toEqual([
                newState.planning.plannings.d,
            ])

            // a appears because it has a linked event with a future ending date
            newState = cloneDeep(state)
            newState.planning.onlySpiked = true
            newState.planning.onlyFuture = true
            newState.planning.plannings.a.state = 'spiked'
            const future = '2045-10-19T13:01:50+0000'
            const past = '1900-10-19T13:01:50+0000'
            newState.events.events.event1.dates = { end: moment(future) }
            newState.planning.plannings.d.coverages = [{ planning: { scheduled: past } }]
            result = selectors.getCurrentAgendaPlannings(newState)
            expect(result).toEqual([newState.planning.plannings.a])

            // d appears because it has a future due date
            newState = cloneDeep(state)
            newState.planning.onlySpiked = true
            newState.planning.onlyFuture = true
            newState.planning.plannings.a.state = 'spiked'
            newState.events.events.event1.dates = { end: moment(past) }
            newState.planning.plannings.d.coverages = [{ planning: { scheduled: future } }]
            result = selectors.getCurrentAgendaPlannings(newState)
            expect(result).toEqual([newState.planning.plannings.d])
        })
    })

    it('getEventsWithMoreInfo', () => {
        const events = selectors.getEventsWithMoreInfo(state)
        expect(events.length).toBe(2)
        expect(events.find((e) => e._id === 'event1')._hasPlanning).toBe(true)
        expect(events.find((e) => e._id === 'event2')._hasPlanning).toBe(false)
    })

    it('getEventToBeDetailed', () => {
        const event = selectors.getEventToBeDetailed(state)
        expect(event._plannings.length).toBe(1)
        expect(event._plannings[0]._agenda.name).toBe('Agenda 1')
    })

    it('getCurrentPlanningAgendaSpiked', () => {
        state.planning.currentPlanningId = 'c'
        let agendaSpiked = selectors.getCurrentPlanningAgendaSpiked(state)
        expect(agendaSpiked).toBe(true)

        state.planning.currentPlanningId = 'b'
        agendaSpiked = selectors.getCurrentPlanningAgendaSpiked(state)
        expect(agendaSpiked).toBe(false)
    })

    it('getSpikedAgendas', () => {
        const agendas = selectors.getSpikedAgendas(state)
        expect(agendas.length).toBe(1)
        expect(agendas).toEqual([{
            _id: '3',
            name: 'Agenda 3',
            state: 'spiked',
            planning_items: ['c'],
        }])
    })

    it('getActiveAgendas', () => {
        const agendas = selectors.getActiveAgendas(state)
        expect(agendas.length).toBe(2)
        expect(agendas).toEqual([{
            _id: '1',
            name: 'Agenda 1',
            planning_items: ['a', 'b', 'd'],
        }, {
            _id: '2',
            name: 'Agenda 2',
            state: 'active',
        }])
    })

    it('getEventsOrderedByDay', () => {
        const days = selectors.getEventsOrderedByDay(state)
        expect(days.map((d) => d.date)).toEqual([
            '2016-10-15',
            '2016-10-16',
            '2016-10-17',
        ])
        expect(days[0].events[0]._id).toEqual('event1')
        expect(days[1].events[0]._id).toEqual('event1')
        expect(days[2].events[0]._id).toEqual('event2')
    })
})
