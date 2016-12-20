import { createStore } from '../../utils'
import * as actions from '../../actions'

describe('<PlanningPanelContainer />', () => {
    it('addEventToCurrentAgenda', () => {
        const initialState = {
            planning: {
                plannings: {},
                agendas: [{
                    _id: '1',
                    name: 'agenda'
                }],
                currentAgendaId: '1',
            }
        }
        const EVENT = {
            _id: '2',
            name: 'event'
        }
        const store = createStore({
            testMode: {
                apiQuery: () => ({ _items: [EVENT] })
            },
            initialState,
        })
        store.dispatch(actions.addEventToCurrentAgenda(EVENT)).then(() => {
            expect(store.getState().planning.plannings).toEqual({ 2: EVENT })
        })
    })
    it('Create a planning in the current agenda', (done) => {
        const initialState = {
            planning: {
                plannings: {},
                agendas: [{
                    _id: 'agenda1',
                    name: 'agenda'
                }],
                currentAgendaId: 'agenda1',
            }
        }
        const store = createStore({
            testMode: {
                // Mock what the api will return when the planning list will be refreshed
                apiQuery: () => ({ _items: [{ _id: 'RefreshedplanningId', slugline: 'coucou' }] }),
            },
            initialState,
        })
        expect(store.getState().planning.currentPlanningId).toBe(undefined)
        store.dispatch(actions.savePlanningAndReloadCurrentAgenda({ slugline: 'coucou' }))
        .then((planningCreated) => {
            // the planning has been added to the current agenda
            expect(store.getState().planning.agendas[0].planning_items[0])
                .toEqual(planningCreated._id)
            // the planning editor has been opened with the saved planning
            expect(store.getState().planning.editorOpened).toBe(true)
            expect(store.getState().planning.currentPlanningId).toEqual(planningCreated._id)
            // the planning list has been refreshed
            expect(store.getState().planning.plannings.RefreshedplanningId)
                .toEqual({ _id: 'RefreshedplanningId', slugline: 'coucou' })
            done()
        })
    })
})
