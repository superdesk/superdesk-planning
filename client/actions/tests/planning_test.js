import sinon from 'sinon'
import * as actions from '../planning'

describe('planning', () => {
    describe('actions', () => {
        let plannings = [
            {
                _id: 'p1',
                slugline: 'Planning1',
                headline: 'Some Plan 1',
            },
            {
                _id: 'p2',
                slugline: 'Planning2',
                headline: 'Some Plan 2',
            },
        ]

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
                planning_items: [plannings[1]._id],
            },
        ]

        const initialState = {
            agenda: {
                agendas,
                currentAgendaId: agendas[1]._id,
            },
            planning: {
                plannings,
                currentPlanningId: plannings[1]._id,
                editorOpened: false,
                planningsAreLoading: false,
                onlyFuture: true,
            },
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
                _id: 'p3',
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

        it('deletePlanning', () => {
            const action = actions.deletePlanning(plannings[1])
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.remove.args[0]).toEqual([plannings[1]])
                expect(notify.success.args[0]).toEqual(['The planning has been deleted.'])

                expect(dispatch.args[0]).toEqual([{ type: 'CLOSE_PLANNING_EDITOR' }])

                // Cannot check dispatch(fetchAgendas()) using a spy on dispatch
                // As fetchAgendas is a thunk function

                expect(dispatch.args[2]).toEqual([{
                    type: 'DELETE_PLANNING',
                    payload: plannings[1]._id,
                }])

                expect(dispatch.callCount).toBe(3)
            })
        })

        it('savePlanning', () => {
            const item = { slugline: 'TestAgenda3' }
            const action = actions.savePlanning(item)
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.save.args[0]).toEqual([{}, item])
                expect(notify.success.args[0]).toEqual(['The planning has been saved'])

                // Cannot check dispatch(saveAndDeleteCoverages()) using a spy on dispatch
                // As saveAndDeleteCoverages is a thunk function

                expect(dispatch.callCount).toBe(1)
            })
        })

        it('savePlanningAndReloadCurrentAgenda', () => {
            const item = { slugline: 'TestAgenda3' }
            const action = actions.savePlanningAndReloadCurrentAgenda(item)
            return action(dispatch)
            .then(() => {
                expect(dispatch.callCount).toBe(3)
                // Cannot check dispatch(savePlanning()) using a spy on dispatch
                // As savePlanning is a thunk function

                // Cannot check dispatch(addToCurrentAgenda()) using a spy on dispatch
                // As addToCurrentAgenda is a thunk function

                // Cannot check dispatch(fetchSelectedAgendaPlannings()) using a spy on dispatch
                // As fetchSelectedAgendaPlannings is a thunk function
            })
        })

        it('fetchPlannings', () => {
            const action = actions.fetchPlannings({})
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.args[0]).toEqual([{ type: 'REQUEST_PLANINGS' }])

                // Cannot check dispatch(performFetchRequest()) using a spy on dispatch
                // As performFetchRequest is a thunk function

                // Cannot check dispatch(silentlyFetchEventsById()) using a spy on dispatch
                // As silentlyFetchEventsById is a thunk function

                expect(dispatch.args[3]).toEqual([{
                    type: 'RECEIVE_PLANNINGS',
                    payload: plannings,
                }])

                expect(dispatch.callCount).toBe(4)
            })
        })

        it('openPlanningEditor', () => {
            const action = actions.openPlanningEditor(plannings[0]._id)
            expect(action).toEqual({
                type: 'OPEN_PLANNING_EDITOR',
                payload: plannings[0]._id,
            })
        })

        it('closePlanningEditor', () => {
            const action = actions.closePlanningEditor()
            expect(action).toEqual({ type: 'CLOSE_PLANNING_EDITOR' })
        })

        it('openPlanningEditorAndAgenda', () => {
            const action = actions.openPlanningEditorAndAgenda(plannings[0]._id)
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.args[0]).toEqual([{
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: plannings[0]._id,
                }])

                expect(dispatch.callCount).toBe(1)
            })
        })

        it('toggleOnlyFutureFilter', () => {
            const action = actions.toggleOnlyFutureFilter()
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.args[0]).toEqual([{
                    type: 'SET_ONLY_FUTURE',
                    payload: false,
                }])

                expect(dispatch.callCount).toBe(1)
            })
        })
    })
})
