import planningApi from '../api'
import sinon from 'sinon'
import moment from 'moment'
import { cloneDeep } from 'lodash'
import {
    getTestActionStore,
    restoreSinonStub,
    convertEventDatesToMoment,
} from '../../../utils/testUtils'

describe('actions.planning.api', () => {
    let errorMessage
    let store
    let services
    let data

    beforeEach(() => {
        errorMessage = { data: { _message: '' } }
        store = getTestActionStore()
        services = store.services
        data = store.data

        sinon.stub(planningApi, 'save').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve([])))
        sinon.stub(planningApi, 'query').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'receivePlannings').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'receiveCoverage').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'fetchPlanningsEvents').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'requestPlannings').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'saveAndDeleteCoverages').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'fetchPlanningById').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'fetchPlanningHistory').callsFake(() => (Promise.resolve()))
    })

    afterEach(() => {
        restoreSinonStub(planningApi.save)
        restoreSinonStub(planningApi.fetch)
        restoreSinonStub(planningApi.query)
        restoreSinonStub(planningApi.receivePlannings)
        restoreSinonStub(planningApi.receiveCoverage)
        restoreSinonStub(planningApi.fetchPlanningsEvents)
        restoreSinonStub(planningApi.requestPlannings)
        restoreSinonStub(planningApi.saveAndDeleteCoverages)
        restoreSinonStub(planningApi.fetchPlanningById)
        restoreSinonStub(planningApi.fetchPlanningHistory)
    })

    describe('spike', () => {
        it('api.spike calls `planning_spike` endpoint', (done) => (
            store.test(done, planningApi.spike(data.plannings[1]))
            .then(() => {
                expect(services.api.update.callCount).toBe(1)
                expect(services.api.update.args[0]).toEqual([
                    'planning_spike',
                    data.plannings[1],
                    {},
                ])

                expect(store.dispatch.args[0]).toEqual([{
                    type: 'SPIKE_PLANNING',
                    payload: data.plannings[1],
                }])

                done()
            })
        ))

        it('api.spike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')))
            return store.test(done, planningApi.spike(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')
                done()
            })
        })
    })

    describe('unspike', () => {
        it('api.unspike calls `planning_unspike` endpoint', (done) => (
            store.test(done, planningApi.unspike(data.plannings[1]))
            .then(() => {
                expect(services.api.update.callCount).toBe(1)
                expect(services.api.update.args[0]).toEqual([
                    'planning_unspike',
                    data.plannings[1],
                    {},
                ])

                expect(store.dispatch.args[0]).toEqual([{
                    type: 'UNSPIKE_PLANNING',
                    payload: data.plannings[1],
                }])

                done()
            })
        ))

        it('api.unspike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')))
            return store.test(done, planningApi.unspike(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')
                done()
            })
        })
    })

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.query)
        })

        it('by list of agendas', (done) => (
            store.test(done, planningApi.query({ agendas: ['a1', 'a2'] }))
            .then(() => {
                expect(services.api('planning').query.callCount).toBe(1)
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { terms: { agendas: ['a1', 'a2'] } },
                                ],
                                must_not: [],
                            },
                        },
                    }),
                    embedded: { original_creator: 1 },
                })])

                done()
            })
        ))

        it('by list of planning not in any agendas', (done) => (
            store.test(done, planningApi.query({ noAgendaAssigned: true }))
            .then(() => {
                expect(services.api('planning').query.callCount).toBe(1)
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [],
                                must_not: [
                                    { exists: { field: 'agendas' } },
                                ],
                            },
                        },
                    }),
                    embedded: { original_creator: 1 },
                })])

                done()
            })
        ))

        it('by event_item', (done) => (
            store.test(done, planningApi.query({ eventIds: 'e1' }))
            .then(() => {
                expect(services.api('planning').query.callCount).toBe(1)
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { term: { event_item: 'e1' } },
                                ],
                                must_not: [],
                            },
                        },
                    }),
                    embedded: { original_creator: 1 },
                })])

                done()
            })
        ))

        it('by spiked item state', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                state: 'spiked',
            }))
            .then(() => {
                expect(services.api('planning').query.callCount).toBe(1)
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { terms: { agendas: ['a1', 'a2'] } },
                                    { term: { state: 'spiked' } },
                                ],
                                must_not: [],
                            },
                        },
                    }),
                    embedded: { original_creator: 1 },
                })])

                done()
            })
        ))

        it('by non-spiked item state', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                state: 'active',
            }))
            .then(() => {
                expect(services.api('planning').query.callCount).toBe(1)
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { terms: { agendas: ['a1', 'a2'] } },
                                ],
                                must_not: [
                                    { term: { state: 'spiked' } },
                                ],
                            },
                        },
                    }),
                    embedded: { original_creator: 1 },
                })])

                done()
            })
        ))
    })

    describe('fetch', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetch)
            restoreSinonStub(planningApi.query)
            sinon.spy(planningApi, 'query')
        })

        it('fetches planning items and linked events', (done) => {
            const params = {
                agendas: ['a1'],
                state: 'active',
            }
            return store.test(done, planningApi.fetch(params))
            .then((items) => {
                expect(planningApi.requestPlannings.callCount).toBe(1)

                expect(planningApi.query.callCount).toBe(1)
                expect(planningApi.query.args[0]).toEqual([params])

                expect(planningApi.fetchPlanningsEvents.callCount).toBe(1)
                expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([data.plannings])

                expect(planningApi.receivePlannings.callCount).toBe(1)
                expect(planningApi.receivePlannings.args[0]).toEqual([data.plannings])

                expect(data.plannings).toEqual(items)
                done()
            })
        })

        it('returns Promise.reject on query error', (done) => {
            services.api('planning').query = sinon.spy(() => (Promise.reject('Failed!')))
            return store.test(done, planningApi.fetch())
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')
                expect(planningApi.query.callCount).toBe(1)
                expect(planningApi.fetchPlanningsEvents.callCount).toBe(0)

                expect(planningApi.receivePlannings.callCount).toBe(1)
                expect(planningApi.receivePlannings.args[0]).toEqual([[]])
                done()
            })
        })
    })

    describe('fetchPlanningsEvents', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningsEvents)
        })

        it('returns if no linked events', (done) => (
            store.test(done, planningApi.fetchPlanningsEvents(data.plannings))
            .then((items) => {
                // When actions.events has been upgraded to use named exports like planning
                // Then we can mock actions.events.silentlyFetchEventsById
                // and check the callCount & args of that function
                expect(items).toEqual([])

                // The API should not have been called
                expect(services.api('events').query.callCount).toBe(0)

                done()
            })
        ))

        it('fetches and returns linked events', (done) => (
            // Run store.test() first to construct initialValues
            store.test(done, () => {
                // Then remove events from the store, so that fetchPlanningsEvents
                // fetches the events from the mocked API
                store.initialState.events.events = {}
                return store.dispatch(planningApi.fetchPlanningsEvents(data.plannings))
            })
            .then((items) => {
                expect(items).toEqual(convertEventDatesToMoment(data.events))

                // The API should have been called
                expect(services.api('events').query.callCount).toBe(1)
                expect(services.api('events').query.args[0]).toEqual([{
                    page: 1,
                    max_results: 25,
                    sort: '[("dates.start",1)]',
                    embedded: { files: 1 },
                    source: JSON.stringify({
                        query: {
                            bool: {
                                must: [
                                    { terms: { _id: ['e1'] } },
                                ],
                                must_not: [],
                            },
                        },
                        filter: {},
                    }),
                }])

                done()
            })
        ))
    })

    describe('fetchPlanningById', () => {

        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningById)
        })

        it('fetches using planning id', (done) => (
            store.test(done, () => {
                store.initialState.planning.plannings = {}
                return store.dispatch(planningApi.fetchPlanningById('p1'))
            })
            .then((item) => {
                expect(item).toEqual(data.plannings[0])
                expect(planningApi.requestPlannings.callCount).toBe(1)

                expect(services.api('planning').getById.callCount).toBe(1)
                expect(services.api('planning').getById.args[0]).toEqual(['p1'])

                expect(planningApi.fetchPlanningsEvents.callCount).toBe(1)
                expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                    [data.plannings[0]],
                ])

                expect(planningApi.receivePlannings.callCount).toBe(1)
                expect(planningApi.receivePlannings.args[0]).toEqual([
                    [data.plannings[0]],
                ])

                done()
            })
        ))

        it('fetches using force=true', (done) => (
            store.test(done, planningApi.fetchPlanningById('p1', true))
            .then((item) => {
                expect(item).toEqual(data.plannings[0])
                expect(planningApi.requestPlannings.callCount).toBe(1)

                expect(services.api('planning').getById.callCount).toBe(1)
                expect(services.api('planning').getById.args[0]).toEqual(['p1'])

                expect(planningApi.fetchPlanningsEvents.callCount).toBe(1)
                expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                    [data.plannings[0]],
                ])

                expect(planningApi.receivePlannings.callCount).toBe(1)
                expect(planningApi.receivePlannings.args[0]).toEqual([
                    [data.plannings[0]],
                ])

                done()
            })
        ))

        it('returns Promise.reject on error', (done) => {
            services.api('planning').getById = sinon.spy(() => (Promise.reject('Failed!')))
            store.test(done, () => {
                store.initialState.planning.plannings = {}
                return store.dispatch(planningApi.fetchPlanningById('p1'))
            })
            .then(() => {}, (error) => {
                expect(planningApi.requestPlannings.callCount).toBe(1)

                expect(planningApi.fetchPlanningsEvents.callCount).toBe(0)

                expect(planningApi.receivePlannings.callCount).toBe(1)
                expect(planningApi.receivePlannings.args[0]).toEqual([[]])

                expect(error).toBe('Failed!')
                done()
            })
        })

        it('returns store instance when already loaded', (done) => (
            store.test(done, planningApi.fetchPlanningById('p1'))
            .then((item) => {
                expect(item).toEqual(data.plannings[0])

                expect(planningApi.requestPlannings.callCount).toBe(0)
                expect(services.api('planning').getById.callCount).toBe(0)
                expect(planningApi.fetchPlanningsEvents.callCount).toBe(0)
                expect(planningApi.receivePlannings.callCount).toBe(0)

                done()
            })
        ))
    })

    describe('fetchCoverageById', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchCoverageById)
        })

        it('fetches using coverage id', (done) => (
            store.test(done, planningApi.fetchCoverageById('c1'))
            .then((item) => {
                expect(item).toEqual(data.coverages[0])

                expect(services.api('coverage').getById.callCount).toBe(1)
                expect(services.api('coverage').getById.args[0]).toEqual(['c1'])

                expect(planningApi.receiveCoverage.callCount).toBe(1)
                expect(planningApi.receiveCoverage.args[0]).toEqual([data.coverages[0]])

                done()
            })
        ))

        it('returns Promise.reject on get error', (done) => {
            services.api('coverage').getById = sinon.spy(() => (Promise.reject('Failed!')))
            return store.test(done, planningApi.fetchCoverageById('c1'))
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')
                done()
            })
        })
    })

    describe('save', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.save)
            restoreSinonStub(planningApi.fetchPlanningById)
        })

        it('creates new planning item', (done) => {
            let planningItem = {
                slugline: 'Planning3',
                headline: 'Some Plan 3',
                coverages: [],
            }

            sinon.stub(planningApi, 'fetchPlanningById').callsFake(() => (Promise.resolve()))

            return store.test(done, planningApi.save(planningItem))
            .then((item) => {
                expect(item).toEqual(jasmine.objectContaining({
                    slugline: 'Planning3',
                    headline: 'Some Plan 3',
                }))

                expect(planningApi.fetchPlanningById.callCount).toBe(0)

                expect(services.api('planning').save.callCount).toBe(1)
                expect(services.api('planning').save.args[0]).toEqual([
                    {},
                    {
                        slugline: 'Planning3',
                        headline: 'Some Plan 3',
                    },
                ])

                expect(planningApi.saveAndDeleteCoverages.callCount).toBe(1)
                expect(planningApi.saveAndDeleteCoverages.args[0]).toEqual([
                    [],
                    {
                        _id: 'p3',
                        slugline: 'Planning3',
                        headline: 'Some Plan 3',
                    },
                    [],
                ])

                done()
            })
        })

        it('saves existing item and runs saveAndDeleteCoverages', (done) => {
            let planningItem

            sinon.stub(planningApi, 'fetchPlanningById').callsFake((id) => (Promise.resolve(
                store.initialState.planning.plannings[id]
            )))

            return store.test(done, () => {
                planningItem = cloneDeep(data.plannings[0])
                planningItem.slugline = 'New Slugger'
                return store.dispatch(planningApi.save(planningItem))
            })
            .then((item) => {
                expect(item).toEqual(planningItem)

                expect(planningApi.fetchPlanningById.callCount).toBe(1)
                expect(planningApi.fetchPlanningById.args[0]).toEqual([
                    planningItem._id,
                ])

                expect(services.api('planning').save.callCount).toBe(1)
                expect(services.api('planning').save.args[0]).toEqual([
                    data.plannings[0],
                    {
                        slugline: 'New Slugger',
                        headline: 'Some Plan 1',
                        agendas: [],
                    },
                ])

                expect(planningApi.saveAndDeleteCoverages.callCount).toBe(1)
                expect(planningApi.saveAndDeleteCoverages.args[0]).toEqual([
                    planningItem.coverages,
                    planningItem,
                    data.plannings[0].coverages,
                ])

                done()
            })
        })

        it('returns Promise.reject on fetchPlanningById error', (done) => {
            sinon.stub(planningApi, 'fetchPlanningById').callsFake(
                () => (Promise.reject('Failed!'))
            )

            return store.test(done, planningApi.save({ _id: 'p3' }))
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')

                expect(planningApi.fetchPlanningById.callCount).toBe(1)
                expect(services.api('planning').save.callCount).toBe(0)
                expect(planningApi.saveAndDeleteCoverages.callCount).toBe(0)
                done()
            })
        })

        it('returns Promise.reject on api.save error', (done) => {
            let planningItem = {
                slugline: 'Plan 3',
                headline: 'Some Plan 3',
            }

            sinon.stub(planningApi, 'fetchPlanningById').callsFake((id) => (Promise.resolve(
                store.initialState.planning.plannings[id]
            )))

            services.api('planning').save = sinon.spy(() => (Promise.reject('Failed!')))

            return store.test(done, planningApi.save(planningItem))
            .then(() => {}, (error) => {
                expect(error).toBe('Failed!')

                expect(services.api('planning').getById.callCount).toBe(0)
                expect(services.api('planning').save.callCount).toBe(1)
                expect(planningApi.saveAndDeleteCoverages.callCount).toBe(0)
                done()
            })
        })
    })

    describe('saveAndDeleteCoverages', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.saveAndDeleteCoverages)
        })

        it('only saves new and modified coverages', (done) => {
            // Clone the original coverages and remove the last one
            // (the one that doesn't belong to the first Planning item
            const origCoverages = cloneDeep(data.coverages)
            origCoverages.pop()
            const newCoverages = cloneDeep(origCoverages)

            newCoverages[1].planning.ednote = 'Texting my coverage'
            newCoverages[1].planning.g2_content_type = 'text'
            newCoverages.push({
                planning: {
                    ednote: 'Video coverage',
                    scheduled: '2016-10-15T16:00:00',
                    g2_content_type: 'video',
                },
            })

            return store.test(done, planningApi.saveAndDeleteCoverages(
                newCoverages,
                { _id: 'p1' },
                origCoverages
            ))
            .then(() => {
                expect(services.api('coverage').save.callCount).toBe(2)
                expect(services.api('coverage').remove.callCount).toBe(0)

                expect(services.api('coverage').save.args[0]).toEqual([
                    {
                        _id: 'c2',
                        planning_item: 'p1',
                        planning: {
                            ednote: 'Photo coverage',
                            scheduled: moment('2016-10-15T14:01:11'),
                            g2_content_type: 'photo',
                        },
                    },
                    {
                        _id: 'c2',
                        planning_item: 'p1',
                        planning: {
                            ednote: 'Texting my coverage',
                            scheduled: moment('2016-10-15T14:01:11'),
                            g2_content_type: 'text',
                        },
                    },
                ])

                expect(services.api('coverage').save.args[1]).toEqual([
                    {},
                    {
                        planning_item: 'p1',
                        planning: {
                            ednote: 'Video coverage',
                            scheduled: moment('2016-10-15T16:00:00'),
                            g2_content_type: 'video',
                        },
                    },
                ])

                done()
            })
        })

        it('deletes coverages', (done) => {
            // Clone the original coverages and remove the last one
            // (the one that doesn't belong to the first Planning item
            const origCoverages = cloneDeep(data.coverages)
            origCoverages.pop()
            const newCoverages = cloneDeep(origCoverages)
            // Remove the last coverage
            newCoverages.pop()

            return store.test(done, planningApi.saveAndDeleteCoverages(
                newCoverages,
                { _id: 'p1' },
                origCoverages
            ))
            .then(() => {
                expect(services.api('coverage').save.callCount).toBe(0)
                expect(services.api('coverage').remove.callCount).toBe(1)

                expect(services.api('coverage').remove.args[0]).toEqual([origCoverages[2]])
                done()
            })
        })
    })

    describe('saveAndReloadCurrentAgenda', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.save)
        })

        it('creates a new planning item and add to the Agenda', (done) => {
            const newItem = { slugline: 'Planning3' }

            sinon.stub(planningApi, 'save').callsFake(() => (Promise.resolve({
                ...newItem,
                agendas: ['a1'],
                _id: 'p3',
            })))

            store.test(done, planningApi.saveAndReloadCurrentAgenda(newItem))
            .then((item) => {
                expect(item).toEqual({
                    ...newItem,
                    agendas: ['a1'],
                    _id: 'p3',
                })

                expect(planningApi.fetchPlanningById.callCount).toBe(0)

                expect(planningApi.save.callCount).toBe(1)
                expect(planningApi.save.args[0]).toEqual([newItem, {}])

                expect(planningApi.fetch.callCount).toBe(1)
                expect(planningApi.fetch.args[0]).toEqual([{
                    noAgendaAssigned: false,
                    agendas: ['a1'],
                }])

                done()
            })
        })

        it('saves an existing item', (done) => {
            restoreSinonStub(planningApi.fetchPlanningById)

            sinon.stub(planningApi, 'fetchPlanningById').callsFake(() => (
                Promise.resolve(data.plannings[0]))
            )

            sinon.stub(planningApi, 'save').callsFake(() => (
                Promise.resolve(data.plannings[0]))
            )

            data.agendas[0].planning_items = ['p1', 'p2']

            return store.test(done, planningApi.saveAndReloadCurrentAgenda(
                {
                    ...data.plannings[0],
                    headline: 'Some Planning 3',
                }
            ))
            .then((item) => {
                expect(item).toEqual(data.plannings[0])

                expect(planningApi.fetchPlanningById.callCount).toBe(1)
                expect(planningApi.fetchPlanningById.args[0]).toEqual(
                    [data.plannings[0]._id]
                )

                expect(planningApi.save.callCount).toBe(1)
                expect(planningApi.save.args[0]).toEqual([
                    {
                        ...data.plannings[0],
                        headline: 'Some Planning 3',
                    },
                    data.plannings[0],
                ])

                done()
            })
        })

        it('returns Promise.reject if no Agenda is selected', (done) => {
            store.initialState.agenda.currentAgendaId = undefined
            errorMessage.data._message = 'No Agenda is currently selected.'

            return store.test(
                done,
                planningApi.saveAndReloadCurrentAgenda({ slugline: 'Planning3' })
            )
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })

        it('returns Promise.reject if no current Agenda is disabled', (done) => {
            data.agendas[0].is_enabled = false
            errorMessage.data._message = 'Cannot create a new planning item in a disabled Agenda.'

            return store.test(
                done,
                planningApi.saveAndReloadCurrentAgenda({ slugline: 'Planning3' })
            )
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })
    })

    it('receivePlannings', () => {
        restoreSinonStub(planningApi.receivePlannings)
        expect(planningApi.receivePlannings(data.plannings)).toEqual({
            type: 'RECEIVE_PLANNINGS',
            payload: data.plannings,
        })
    })

    it('receiveCoverage', () => {
        restoreSinonStub(planningApi.receiveCoverage)
        expect(planningApi.receiveCoverage(data.coverages[0])).toEqual({
            type: 'RECEIVE_COVERAGE',
            payload: data.coverages[0],
        })
    })

    it('requestPlannings', () => {
        restoreSinonStub(planningApi.requestPlannings)
        expect(planningApi.requestPlannings()).toEqual({ type: 'REQUEST_PLANNINGS' })
    })

    describe('fetchPlanningHistory', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningHistory)
        })

        it('calls planning_history api and runs dispatch', (done) => (
            store.test(done, planningApi.fetchPlanningHistory('p2'))
            .then((items) => {
                expect(items).toEqual({ _items: data.planning_history })

                expect(services.api('planning_history').query.callCount).toBe(1)
                expect(services.api('planning_history').query.args[0]).toEqual([{
                    where: { planning_id: 'p2' },
                    max_results: 200,
                    sort: '[(\'_created\', 1)]',
                }])

                expect(store.dispatch.callCount).toBe(1)
                expect(store.dispatch.args[0]).toEqual([{
                    type: 'RECEIVE_PLANNING_HISTORY',
                    payload: data.planning_history,
                }])

                done()
            })
        ))

        it('returns Promise.reject is planning_history query fails', (done) => {
            services.api('planning_history').query = sinon.spy(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, planningApi.fetchPlanningHistory('p2'))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                done()
            })
        })
    })
})
