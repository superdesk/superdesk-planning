import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'

const planningApp = combineReducers({
    modal,
    events,
    config: (state) => ( state || {} ),
    form: forms
})

export default planningApp
