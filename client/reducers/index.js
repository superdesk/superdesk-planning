import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'
import vocabularies from './vocabularies'
import ingest from './ingest_providers'
import privileges from './privileges'
import agenda from './agenda'
import assignment from './assignment'
import users from './users'
import desks from './desks'
import subjects from './subjects'
import session from './session'
import genres from './genres'
import urgency from './urgency'

const planningApp = combineReducers({
    modal,
    events,
    vocabularies,
    ingest,
    planning,
    privileges,
    agenda,
    assignment,
    subjects,
    form: forms,
    config: (state) => (state || {}),
    users,
    desks,
    session,
    urgency,
    deployConfig: (state) => (state || {}),
    genres,
})

export default planningApp
