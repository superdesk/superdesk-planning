import { createStore, applyMiddleware } from 'redux'
import planningApp from '../../reducers'
import * as actions from '../../actions'
import thunkMiddleware from 'redux-thunk'

describe('<PlanningPanelContainer />', () => {
    it('addEventToCurrentAgenda', (done) => {
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
        const store = createStore(
            planningApp,
            initialState,
            applyMiddleware(thunkMiddleware.withExtraArgument(
                {
                    api: () => ({
                        query: () => (Promise.resolve({ _items: [EVENT] })),
                        save: (ori, item) => {
                            let response = {}
                            Object.assign(response, ori, item)
                            // if there is no id we add one
                            if (!response._id) {
                                const randId =  Math.random().toString(36).substr(2, 10)
                                Object.assign(response, item, { _id: randId })
                            }
                            // reponse as a promise
                            return Promise.resolve(response)
                        },
                    })
                }
            ))
        )

        store.dispatch(actions.addEventToCurrentAgenda(EVENT)).then(() => {
            expect(store.getState().planning.plannings).toEqual({ 2: EVENT })
            done()
        })
    })
})
