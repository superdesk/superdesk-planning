import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'
import vocabularies from './vocabularies'
import ingest from './ingest_providers'

const planningApp = combineReducers({
    modal,
    events,
    planning,
    vocabularies,
    ingest,
    form: forms,
    config: (state) => (state || {}),
})

export default planningApp
