import eventsApi from '../api'
import planningApi from '../../planning/api'
import sinon from 'sinon'
import { EventUpdateMethods } from '../../../components/fields'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'
import { ITEM_STATE } from '../../../constants'

describe('actions.events.api', () => {
    let errorMessage
    let store
    let services
    let data

    beforeEach(() => {
        errorMessage = { data: { _message: 'Failed!' } }
        store = getTestActionStore()
        services = store.services
        data = store.data

        sinon.stub(eventsApi, 'query').callsFake(
            () => (Promise.resolve({ _items: data.events }))
        )
        sinon.stub(eventsApi, 'refetchEvents').callsFake(() => (Promise.resolve()))
        sinon.stub(eventsApi, 'receiveEvents').callsFake(() => (Promise.resolve()))
        sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
            () => (Promise.resolve(data.events))
        )

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        )
    })

    afterEach(() => {
        restoreSinonStub(eventsApi.query)
        restoreSinonStub(eventsApi.refetchEvents)
        restoreSinonStub(eventsApi.receiveEvents)
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId)
        restoreSinonStub(planningApi.fetch)
        restoreSinonStub(planningApi.loadPlanningByEventId)
    })

    describe('loadEventsByRecurrenceId', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId)
        })

        it('runs the query', (done) => (
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1', ITEM_STATE.ACTIVE))
            .then((items) => {
                expect(items).toEqual(data.events)

                expect(eventsApi.query.callCount).toBe(1)
                expect(eventsApi.query.args[0]).toEqual([{
                    recurrenceId: 'r1',
                    state: ITEM_STATE.ACTIVE,
                }])

                expect(eventsApi.receiveEvents.callCount).toBe(1)
                expect(eventsApi.receiveEvents.args[0]).toEqual([data.events])

                done()
            })
        ))

        it('returns Promise.reject if query fails', (done) => {
            restoreSinonStub(eventsApi.query)
            sinon.stub(eventsApi, 'query').callsFake(() => (Promise.reject(errorMessage)))
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1'))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                done()
            })
        })
    })

    describe('spike', () => {
        beforeEach(() => {
            store.initialState.agenda.currentAgendaId = 'a2'
        })

        it('can spike a single event', (done) => (
            store.test(done, eventsApi.spike(data.events[1]))
            .then((items) => {
                expect(items).toEqual([data.events[1]])
                expect(services.api.update.callCount).toBe(1)
                expect(services.api.update.args[0]).toEqual([
                    'events_spike',
                    data.events[1],
                    { update_method: EventUpdateMethods[0].value },
                ])

                expect(store.dispatch.args[0]).toEqual([{
                    type: 'SPIKE_EVENT',
                    payload: [data.events[1]],
                }])

                done()
            })
        ))

        it('can spike multiple events', (done) => (
            store.test(done, eventsApi.spike(data.events))
            .then((items) => {
                expect(items).toEqual(data.events)
                expect(services.api.update.callCount).toBe(data.events.length)

                for (let i = 0; i < data.events.length; i++) {
                    expect(services.api.update.args[i]).toEqual([
                        'events_spike',
                        data.events[i],
                        { update_method: EventUpdateMethods[0].value },
                    ])
                }

                expect(store.dispatch.args[0]).toEqual([{
                    type: 'SPIKE_EVENT',
                    payload: data.events,
                }])

                done()
            })
        ))

        it('can send `future` for `update_method`', (done) => {
            data.events[1].update_method = 'future'
            return store.test(done, eventsApi.spike(data.events[1]))
            .then(() => {
                expect(services.api.update.callCount).toBe(1)
                expect(services.api.update.args[0]).toEqual([
                    'events_spike',
                    data.events[1],
                    { update_method: data.events[1].update_method },
                ])

                done()
            })
        })

        it('returns Promise.reject if `events_spike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)))
            return store.test(done, planningApi.spike(data.events))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })
    })

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.query)
        })

        it('default query/filter', (done) => (
            store.test(done, eventsApi.query({}))
            .then(() => {
                expect(services.api('events').query.callCount).toBe(1)
                expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                    page: 1,
                    sort: '[("dates.start",1)]',
                    embedded: { files: 1 },
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [],
                                must_not: [
                                    { term: { state: ITEM_STATE.SPIKED } },
                                ],
                            },
                        },
                        filter: { range: { 'dates.end': { gte: 'now/d' } } },
                    }),
                })])

                done()
            })
        ))

        it('by list of ids', (done) => {
            store.test(done, eventsApi.query({ ids: ['e1', 'e2'] }))
            .then(() => {
                expect(services.api('events').query.callCount).toBe(1)
                expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                    page: 1,
                    sort: '[("dates.start",1)]',
                    embedded: { files: 1 },
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { terms: { _id: ['e1', 'e2'] } },
                                ],
                                must_not: [
                                    { term: { state: ITEM_STATE.SPIKED } },
                                ],
                            },
                        },
                        filter: {},
                    }),
                })])

                done()
            })
        })

        it('by fulltext', (done) => (
            store.test(done, eventsApi.query({ fulltext: 'Search Event*' }))
            .then(() => {
                expect(services.api('events').query.callCount).toBe(1)
                expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                    page: 1,
                    sort: '[("dates.start",1)]',
                    embedded: { files: 1 },
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { query_string: { query: 'Search Event*' } },
                                ],
                                must_not: [
                                    { term: { state: ITEM_STATE.SPIKED } },
                                ],
                            },
                        },
                        filter: {},
                    }),
                })])

                done()
            })
        ))

        it('by recurrence_id', (done) => {
            store.test(done, eventsApi.query({ recurrenceId: 'rec1' }))
            .then(() => {
                expect(services.api('events').query.callCount).toBe(1)
                expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                    page: 1,
                    sort: '[("dates.start",1)]',
                    embedded: { files: 1 },
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { term: { recurrence_id: 'rec1' } },
                                ],
                                must_not: [
                                    { term: { state: ITEM_STATE.SPIKED } },
                                ],
                            },
                        },
                        filter: {},
                    }),
                })])

                done()
            })
        })
    })

    describe('refetchEvents', () => {
        it('performs query', (done) => {
            restoreSinonStub(eventsApi.refetchEvents)
            restoreSinonStub(eventsApi.query)
            sinon.stub(eventsApi, 'query').callsFake(
                () => (Promise.resolve({ _items: data.events }))
            )

            return store.test(done, eventsApi.refetchEvents())
            .then((events) => {
                expect(events).toEqual(data.events)
                expect(eventsApi.query.callCount).toBe(1)
                expect(eventsApi.query.args[0]).toEqual([{ page: 1 }])

                expect(eventsApi.receiveEvents.callCount).toBe(1)
                expect(eventsApi.receiveEvents.args[0]).toEqual([data.events])

                done()
            })
        })
    })

    describe('loadRecurringEventsAndPlanningItems', () => {
        beforeEach(() => {
            data.events[0].recurrence_id = 'rec1'
        })

        it('returns Promise.reject if not a recurring event', (done) => {
            delete data.events[0].recurrence_id
            store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toBe('Supplied event is not a recurring event!')
                done()
            })
        })

        it('loads events and planning items', (done) => {
            store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
            .then((events) => {
                expect(events).toEqual({
                    ...data.events[0],
                    _recurring: {
                        events: data.events,
                        ids: ['e1', 'e2', 'e3'],
                        plannings: data.plannings,
                    },
                    _plannings: [data.plannings[1]],
                })

                expect(eventsApi.loadEventsByRecurrenceId.callCount).toBe(1)
                expect(eventsApi.loadEventsByRecurrenceId.args[0]).toEqual(['rec1'])

                expect(planningApi.loadPlanningByEventId.callCount).toBe(1)
                expect(planningApi.loadPlanningByEventId.args[0]).toEqual([['e1', 'e2', 'e3']])

                done()
            })
        })

        it('returns Promise.reject if failed to load event series', (done) => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId)
            sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })

        it('returns Promise.reject if failed to load planning items', (done) => {
            restoreSinonStub(planningApi.loadPlanningByEventId)
            sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })
    })

    it('receiveEvents', () => {
        restoreSinonStub(eventsApi.receiveEvents)
        expect(eventsApi.receiveEvents(data.events)).toEqual(jasmine.objectContaining({
            type: 'ADD_EVENTS',
            payload: data.events,
        }))
    })
})
