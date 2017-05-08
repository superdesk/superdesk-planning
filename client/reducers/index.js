import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'
import vocabularies from './vocabularies'
import ingest from './ingest_providers'
import privileges from './privileges'
import agenda from './agenda'

const planningApp = combineReducers({
    modal,
    events,
    planning,
    vocabularies,
    ingest,
    privileges,
    agenda,
    form: forms,
    config: (state) => (state || {}),
})

export default planningApp
