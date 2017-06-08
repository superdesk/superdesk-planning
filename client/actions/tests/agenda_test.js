import sinon from 'sinon'
import * as actions from '../agenda'
import { PRIVILEGES } from '../../constants'
import { registerNotifications } from '../../controllers/PlanningController'
import { createTestStore } from '../../utils'
import { cloneDeep } from 'lodash'
import * as selectors from '../../selectors'

describe('agenda', () => {
    describe('actions', () => {
        let agendas
        let plannings
        let events
        let initialState
        const getState = () => (initialState)
        const dispatch = sinon.spy((action) =>  {
            if (typeof action === 'function') {
                return action(dispatch, getState, {
                    notify,
                    api,
                    $timeout,
                })
            }

            return action
        })
        const notify = {
            error: sinon.spy(),
            success: sinon.spy(),
        }
        const $timeout = sinon.spy((func) => func())

        let apiSpy = {
            query: sinon.spy(() => (Promise.resolve())),
            remove: sinon.spy(() => (Promise.resolve())),
            save: sinon.spy((ori, item) => (Promise.resolve({
                _id: 'a3',
                ...ori,
                ...item,
            }))),
        }

        let api

        beforeEach(() => {
            apiSpy.save.reset()
            notify.error.reset()
            notify.success.reset()
            dispatch.reset()
            $timeout.reset()

            api = () => (apiSpy)

            agendas = [
                {
                    _id: 'a1',
                    name: 'TestAgenda',
                    planning_type: 'agenda',
                },
                {
                    _id: 'a2',
                    name: 'TestAgenda2',
                    planning_type: 'agenda',
                    planning_items: [],
                },
            ]

            plannings = [{
                _id: 'p1',
                slugline: 'Planning 1',
            }]

            events = [{
                _id: 'e1',
                name: 'Event1',
                definition_short: 'Some event',
            }]

            initialState = {
                agenda: {
                    agendas,
                    currentAgendaId: 'a2',
                },
                planning: { plannings },
                events: { events },
                privileges: {
                    planning: 1,
                    planning_agenda_management: 1,
                    planning_agenda_spike: 1,
                    planning_agenda_unspike: 1,
                    planning_planning_management: 1,
                },
            }
        })

        describe('createOrUpdateAgenda', () => {
            const item = { name: 'TestAgenda3' }
            const action = actions.createOrUpdateAgenda({ name: item.name })
            it('createOrUpdateAgenda saves and executes dispatches', () => {
                initialState.privileges.planning_agenda_management = 1
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(apiSpy.save.args[0]).toEqual([{}, item])
                    expect(notify.success.args[0]).toEqual(['The agenda has been created/updated.'])

                    expect(dispatch.callCount).toBe(3)
                    expect(dispatch.args[0]).toEqual([{ type: 'HIDE_MODAL' }])
                    expect(dispatch.args[1]).toEqual([{
                        type: 'ADD_OR_REPLACE_AGENDA',
                        payload: {
                            _id: 'a3',
                            name: item.name,
                        },
                    }])

                    // Cannot check dispatch(selectAgenda(agenda._id)) using spy on dispatch
                    // As selectAgenda is a thunk function
                })
            })

            it('createOrUpdateAgenda raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_agenda_management = 0
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0][0]).toBe(
                        'Unauthorised to create or update an agenda'
                    )
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_createOrUpdateAgenda',
                            permission: PRIVILEGES.AGENDA_MANAGEMENT,
                            errorMessage: 'Unauthorised to create or update an agenda',
                            args: [item],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })

        describe('spikeAgenda', () => {
            it('spikeAgenda calls `agenda_spike` endpoint', () => {
                initialState.privileges.planning_agenda_spike = 1
                api.update = sinon.spy(() => (Promise.resolve()))

                const action = actions.spikeAgenda(agendas[1])
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(api.update.args[0]).toEqual([
                        'agenda_spike',
                        agendas[1],
                        {},
                    ])
                    expect(dispatch.args[1]).toEqual([{
                        type: 'SPIKE_AGENDA',
                        payload: agendas[1],
                    }])

                    // Cannot check dispatch(fetchAgendas()) using a spy on dispatch
                    // As fetchAgendas is a thunk function

                    expect(dispatch.callCount).toBe(4)
                    expect($timeout.callCount).toBe(0)
                    expect(notify.error.callCount).toBe(0)
                    expect(notify.success.args[0]).toEqual(['The Agenda has been spiked.'])
                })
            })

            it('spikeAgenda raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_agenda_spike = 0

                const action = actions.spikeAgenda(agendas[1])
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0]).toEqual(['Unauthorised to spike an Agenda.'])
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_spikeAgenda',
                            permission: PRIVILEGES.SPIKE_AGENDA,
                            errorMessage: 'Unauthorised to spike an Agenda.',
                            args: [agendas[1]],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })

        describe('unspikeAgenda', () => {
            it('unspikeAgenda calls `agenda_unspike` endpoint', () => {
                initialState.privileges.planning_agenda_unspike = 1
                api.update = sinon.spy(() => (Promise.resolve()))

                const action = actions.unspikeAgenda(agendas[1])
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(api.update.args[0]).toEqual([
                        'agenda_unspike',
                        agendas[1],
                        {},
                    ])
                    expect(dispatch.args[1]).toEqual([{
                        type: 'UNSPIKE_AGENDA',
                        payload: agendas[1],
                    }])

                    // Cannot check dispatch(fetchAgendas()) using a spy on dispatch
                    // As fetchAgendas is a thunk function

                    expect(dispatch.callCount).toBe(4)
                    expect($timeout.callCount).toBe(0)
                    expect(notify.error.callCount).toBe(0)
                    expect(notify.success.args[0]).toEqual(['The Agenda has been unspiked.'])
                })
            })

            it('unspikeAgenda raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_agenda_unspike = 0

                const action = actions.unspikeAgenda(agendas[1])
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0]).toEqual(['Unauthorised to unspike an Agenda.'])
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_unspikeAgenda',
                            permission: PRIVILEGES.UNSPIKE_AGENDA,
                            errorMessage: 'Unauthorised to unspike an Agenda.',
                            args: [agendas[1]],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })

        it('fetchAgendas', () => {
            const action = actions.fetchAgendas()
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.query.callCount).toBe(1)
                expect(dispatch.callCount).toBe(2)
                expect(dispatch.args[0]).toEqual([{ type: 'REQUEST_AGENDAS' }])
                expect(dispatch.args[1]).toEqual([{
                    type: 'RECEIVE_AGENDAS',
                    payload: agendas,
                }])
            })
        })

        describe('fetchAgendaById', () => {
            it('calls api.getById and runs dispatches', () => {
                apiSpy.getById = sinon.spy(() => Promise.resolve(agendas[1]))
                const action = actions.fetchAgendaById('a2')
                return action(dispatch, getState, {
                    api,
                    notify,
                })
                .then((agenda) => {
                    expect(agenda).toEqual(agendas[1])
                    expect(apiSpy.getById.callCount).toBe(1)
                    expect(apiSpy.getById.args[0]).toEqual(['a2'])
                    expect(dispatch.callCount).toBe(1)
                    expect(dispatch.args[0]).toEqual([{
                        type: 'ADD_OR_REPLACE_AGENDA',
                        payload: agendas[1],
                    }])
                    expect(notify.error.callCount).toBe(0)
                })
            })

            it('notifies end user if an error occurred', () => {
                apiSpy.getById = sinon.spy(() => Promise.reject())
                const action = actions.fetchAgendaById('a2')
                return action(dispatch, getState, {
                    api,
                    notify,
                })
                .then(() => {
                    expect(dispatch.callCount).toBe(0)
                    expect(notify.error.callCount).toBe(1)
                    expect(notify.error.args[0]).toEqual(['Failed to fetch an Agenda!'])
                })
            })
        })

        it('selectAgenda', () => {
            const action = actions.selectAgenda('a1')
            const $location = { search: sinon.spy() }

            return action(dispatch, getState, {
                $timeout,
                $location,
            })
            .then(() => {
                expect(dispatch.callCount).toBe(3)
                expect(dispatch.args[0]).toEqual([{
                    type: 'SELECT_AGENDA',
                    payload: 'a1',
                }])
                expect(dispatch.args[1]).toEqual([{ type: 'CLOSE_PLANNING_EDITOR' }])

                // Cannot check dispatch(fetchSelectedAgendaPlannings()) using a spy on dispatch
                // As fetchSelectedAgendaPlannings is a thunk function

                expect($location.args[0]).toEqual(['agenda', 'a1'])
            })
        })

        describe('addToCurrentAgenda', () => {
            it('addToCurrentAgenda executes dispatches', () => {
                initialState.privileges.planning_planning_management = 1

                const action = actions.addToCurrentAgenda(plannings[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then((planning) => {
                    expect(planning).toEqual(plannings[0])
                    // Cannot check dispatch(addPlanningToAgenda()) using a spy on dispatch
                    // As addPlanningToAgenda is a thunk function

                    expect(notify.success.args[0]).toEqual([
                        'The planning has been added to the agenda',
                    ])
                })
            })

            it('addToCurrentAgenda raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_planning_management = 0

                const action = actions.addToCurrentAgenda(plannings[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0][0]).toBe(
                        'Unauthorised to add a Planning Item to an Agenda'
                    )
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_addToCurrentAgenda',
                            permission: PRIVILEGES.PLANNING_MANAGEMENT,
                            errorMessage: 'Unauthorised to add a Planning Item to an Agenda',
                            args: [plannings[0]],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })

        describe('addEventToCurrentAgenda', () => {
            it('addEventToCurrentAgenda executes dispatches', () => {
                const action = actions.addEventToCurrentAgenda(events[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(dispatch.callCount).toBe(3)
                })
            })

            it('addEventToCurrentAgenda raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_planning_management = 0
                const action = actions.addEventToCurrentAgenda(events[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0][0]).toBe(
                        'Unauthorised to create a new planning item!'
                    )
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_addEventToCurrentAgenda',
                            permission: PRIVILEGES.PLANNING_MANAGEMENT,
                            errorMessage: 'Unauthorised to create a new planning item!',
                            args: [event],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })

            it('addEventToCurrentAgenda raises error if no Agenda is selected', () => {
                initialState.agenda.currentAgendaId = null
                const action = actions.addEventToCurrentAgenda(events[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(notify.error.args[0]).toEqual(['No Agenda selected.'])
                    expect(dispatch.callCount).toBe(1)
                })
            })

            it('addEventToCurrentAgenda raises error if current Agenda is spiked', () => {
                agendas[1].state = 'spiked'
                const action = actions.addEventToCurrentAgenda(events[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(notify.error.args[0]).toEqual(['Current Agenda is spiked.'])
                    expect(dispatch.callCount).toBe(1)
                })
            })

            it('addEventToCurrentAgenda raises error if the Event is spiked', () => {
                events[0].state = 'spiked'
                const action = actions.addEventToCurrentAgenda(events[0])
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                .then(() => {
                    expect(notify.error.args[0]).toEqual([
                        'Cannot create a Planning item from a spiked event!',
                    ])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })

        it('fetchSelectedAgendaPlannings', () => {
            const action = actions.fetchSelectedAgendaPlannings()
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.callCount).toBe(1)
            })
        })

        describe('addPlanningToAgenda', () => {
            it('addPlanningToAgenda saves and executes dispatches', () => {
                const action = actions.addPlanningToAgenda({
                    planning: plannings[0],
                    agenda: agendas[0],
                })
                initialState.privileges.planning_planning_management = 1
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                    api,
                })
                .then((agenda) => {
                    let newAgenda = {
                        ...agendas[0],
                        planning_items: ['p1'],
                    }
                    expect(apiSpy.save.args[0]).toEqual([
                        agendas[0],
                        { planning_items: ['p1'] },
                    ])
                    expect(agenda).toEqual(newAgenda)

                    expect(dispatch.args[1]).toEqual([{
                        type: 'ADD_OR_REPLACE_AGENDA',
                        payload: newAgenda,
                    }])
                })
            })

            it('addPlanningToAgenda raises ACCESS_DENIED without permission', () => {
                const action = actions.addPlanningToAgenda({
                    planning: plannings[0],
                    agenda: agendas[0],
                })
                initialState.privileges.planning_planning_management = 0
                return action(dispatch, getState, {
                    notify,
                    $timeout,
                    api,
                })
                .then(() => {
                    expect($timeout.callCount).toBe(1)
                    expect(notify.error.args[0][0]).toBe(
                        'Unauthorised to add a Planning Item to an Agenda'
                    )
                    expect(dispatch.args[0]).toEqual([{
                        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                        payload: {
                            action: '_addPlanningToAgenda',
                            permission: PRIVILEGES.PLANNING_MANAGEMENT,
                            errorMessage: 'Unauthorised to add a Planning Item to an Agenda',
                            args: [{
                                planning: plannings[0],
                                agenda: agendas[0],
                            }],
                        },
                    }])
                    expect(dispatch.callCount).toBe(1)
                })
            })
        })
    })

    describe('websocket', () => {
        const initialState = {
            agenda: {
                agendas: [{
                    _id: '1',
                    name: 'agenda',
                }],
            },
        }
        const newAgenda = {
            _id: '2',
            name: 'NewAgenda',
        }

        let store
        let spyGetById
        let $rootScope

        beforeEach(inject((_$rootScope_) => {
            $rootScope = _$rootScope_

            spyGetById = sinon.spy(() => newAgenda)
            store = createTestStore({
                initialState: cloneDeep(initialState),
                extraArguments: { apiGetById: spyGetById },
            })

            registerNotifications($rootScope, store)
            $rootScope.$digest()
        }))

        it('`agenda:created` adds the Agenda to the store', (done) => {
            $rootScope.$broadcast('agenda:created', { item: '2' })

            // Expects run in setTimeout to give the event listeners a chance to execute
            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1)
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '2',
                ])

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'agenda',
                    },
                    {
                        _id: '2',
                        name: 'NewAgenda',
                    },
                ])
                done()
            }, 0)
        })

        it('`agenda:updated` updates the Agenda in the store', (done) => {
            newAgenda._id = '1'
            $rootScope.$broadcast('agenda:created', { item: '1' })

            // Expects run in setTimeout to give the event listeners a chance to execute
            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1)
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '1',
                ])

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'NewAgenda',
                    },
                ])

                done()
            }, 0)
        })

        it('`agenda:spiked` updates the Agenda in the store', (done) => {
            newAgenda._id = '1'
            newAgenda.name = 'agenda'
            newAgenda.state = 'spiked'
            $rootScope.$broadcast('agenda:spiked', { item: '1' })

            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1)
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '1',
                ])

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'agenda',
                        state: 'spiked',
                    },
                ])
                done()
            })
        })

        it('`agenda:unspiked` updates the Agenda in the store', (done) => {
            newAgenda._id = '1'
            newAgenda.name = 'agenda'
            newAgenda.state = 'active'
            $rootScope.$broadcast('agenda:unspiked', { item: '1' })

            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1)
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '1',
                ])

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'agenda',
                        state: 'active',
                    },
                ])
                done()
            })
        })
    })
})
