import sinon from 'sinon'
import * as actions from '../agenda'

describe('agenda', () => {
    describe('action', () => {
        let agendas = [
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
        let plannings = []
        const initialState = {
            agenda: {
                agendas,
                currentAgendaId: 'a2',
            },
            planning: { plannings },
        }
        const getState = () => (initialState)
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const notify = {
            error: sinon.spy(),
            success: sinon.spy(),
        }

        let apiSpy = {
            query: sinon.spy(() => (Promise.resolve())),
            remove: sinon.spy(() => (Promise.resolve())),
            save: sinon.spy((ori, item) => (Promise.resolve({
                _id: 'a3',
                ...ori,
                ...item,
            }))),
        }

        const api = () => (apiSpy)

        beforeEach(() => {
            apiSpy.save.reset()
            notify.error.reset()
            notify.success.reset()
            dispatch.reset()
        })

        it('createAgenda', () => {
            const action = actions.createAgenda({ name: 'TestAgenda3' })
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.save.args[0]).toEqual([{}, { name: 'TestAgenda3' }])
                expect(notify.success.args[0]).toEqual(['An agenda has been added.'])

                expect(dispatch.callCount).toBe(3)
                expect(dispatch.args[0]).toEqual([{ type: 'HIDE_MODAL' }])
                expect(dispatch.args[1]).toEqual([{
                    type: 'ADD_OR_REPLACE_AGENDA',
                    payload: {
                        _id: 'a3',
                        name: 'TestAgenda3',
                    },
                }])

                // Cannot check dispatch(selectAgenda(agenda._id)) using spy on dispatch
                // As selectAgenda is a thunk function
            })
        })

        it('deleteAgenda', () => {
            const action = actions.deleteAgenda(agendas[1])
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.remove.args[0]).toEqual([agendas[1]])
                expect(notify.success.args[0]).toEqual(['The agenda has been deleted.'])

                expect(dispatch.callCount).toBe(1)
                // Cannot check dispatch(fetchAgendas()) using a spy on dispatch
                // As fetchAgendas is a thunk function
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

        it('selectAgenda', () => {
            const action = actions.selectAgenda('a1')
            const $timeout = sinon.spy((func) => func())
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

        it('addToCurrentAgenda', () => {
            const item = { _id: 'p1' }
            const action = actions.addToCurrentAgenda(item)
            return action(dispatch, getState, { notify })
            .then((planning) => {
                expect(planning).toEqual(item)
                expect(dispatch.callCount).toBe(1)
                // Cannot check dispatch(addPlanningToAgenda()) using a spy on dispatch
                // As addPlanningToAgenda is a thunk function

                expect(notify.success.args[0]).toEqual([
                    'The planning has been added to the agenda',
                ])
            })
        })

        it('addEventToCurrentAgenda', () => {
            const event = {
                _id: 'e1',
                name: 'Event1',
                definition_short: 'Some event',
            }
            const action = actions.addEventToCurrentAgenda(event)
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.callCount).toBe(3)
            })
        })

        it('fetchSelectedAgendaPlannings', () => {
            const action = actions.fetchSelectedAgendaPlannings()
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.callCount).toBe(1)
            })
        })
    })
})
