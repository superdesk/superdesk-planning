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
})
