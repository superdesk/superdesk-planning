import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import { reducer as formReducer } from 'redux-form'

const planningApp = combineReducers({
    modal,
    events,
    form: formReducer
})

export default planningApp
