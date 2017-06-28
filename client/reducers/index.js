import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'
import vocabularies from './vocabularies'
import ingest from './ingest_providers'
import privileges from './privileges'
import agenda from './agenda'
import users from './users'
import desks from './desks'
import subjects from './subjects'
import session from './session'

const planningApp = combineReducers({
    modal,
    events,
    vocabularies,
    ingest,
    planning,
    privileges,
    agenda,
    subjects,
    form: forms,
    config: (state) => (state || {}),
    users,
    desks,
    session,
})

export default planningApp
