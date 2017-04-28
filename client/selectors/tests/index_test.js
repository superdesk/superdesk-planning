import * as selectors from '../index'
import { cloneDeep } from 'lodash'
import moment from 'moment'

describe('selectors', () => {
    const state = {
        events: {
            events: {
                event1: { _id: 'event1' },
                event2: { _id: 'event2' },
            },
            showEventDetails: 'event1',
            eventsInList: ['event1', 'event2'],
        },
        planning: {
            onlyFuture: false,
            plannings: {
                a: {
                    name: 'name a',
                    event_item: 'event1',
                },
                b: { name: 'name b' },
            },
            currentAgendaId: '1',
            agendas: [{
                _id: '1',
                name: 'name',
                planning_items: ['a', 'b'],
            }],
        },
    }
    it('getCurrentAgenda', () => {
        let result
        result = selectors.getCurrentAgenda(state)
        expect(result).toEqual(state.planning.agendas[0])
        const newState = cloneDeep(state)
        delete newState.planning.currentAgendaId
        result = selectors.getCurrentAgenda(newState)
        expect(result).toEqual(undefined)
    })
    it('getCurrentAgendaPlannings', () => {
        let result
        // normal
        result = selectors.getCurrentAgendaPlannings(state)
        expect(result).toEqual([state.planning.plannings.a, state.planning.plannings.b])
        // without planning_items
        let newState
        newState = cloneDeep(state)
        delete newState.planning.agendas[0].planning_items
        result = selectors.getCurrentAgendaPlannings(newState)
        expect(result).toEqual([])
        // without currentAgendaId
        newState = cloneDeep(state)
        delete newState.planning.currentAgendaId
        result = selectors.getCurrentAgendaPlannings(newState)
        expect(result).toEqual([])
        // only future
        newState = cloneDeep(state)
        newState.planning.onlyFuture = true
        result = selectors.getCurrentAgendaPlannings(newState)
        // a and b have no coverage due date or event ending date, so they appear
        expect(result).toEqual([newState.planning.plannings.a, newState.planning.plannings.b])
        newState = cloneDeep(state)
        newState.planning.onlyFuture = true
        const future = '2045-10-19T13:01:50+0000'
        const past = '1900-10-19T13:01:50+0000'
        newState.events.events.event1.dates = { end: moment(future) }
        newState.planning.plannings.b.coverages = [{ planning: { scheduled: past } }]
        result = selectors.getCurrentAgendaPlannings(newState)
        // a appears because it has a linked event with a future ending date
        expect(result).toEqual([newState.planning.plannings.a])
        newState = cloneDeep(state)
        newState.planning.onlyFuture = true
        newState.events.events.event1.dates = { end: moment(past) }
        newState.planning.plannings.b.coverages = [{ planning: { scheduled: future } }]
        result = selectors.getCurrentAgendaPlannings(newState)
        // b appears because it has a future due date
        expect(result).toEqual([newState.planning.plannings.b])
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
        expect(event._plannings[0]._agenda.name).toBe('name')
    })
})
