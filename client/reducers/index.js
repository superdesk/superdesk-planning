import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'

const planningApp = combineReducers({
    modal,
    events,
    planning,
    form: forms,
    config: (state) => (state || {}),
})

export default planningApp
