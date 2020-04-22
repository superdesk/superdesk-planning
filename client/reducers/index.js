import {combineReducers} from 'redux';
import events from './events';
import modal from './modal';
import forms from './forms';
import planning from './planning';
import vocabularies from './vocabularies';
import agenda from './agenda';
import assignment from './assignment';
import locks from './locks';
import session from './session';
import workspace from './workspace';
import templates from './templates';
import main from './main';
import eventsPlanning from './eventsplanning';
import multiSelect from './multiSelect';
import selected from './publishQueuePreview';
import featuredPlanning from './featuredPlanning';
import files from './files';
import contacts from './contacts';
import locations from './locations';

const returnState = (state) => state || {};

const planningApp = combineReducers({
    modal: modal,
    events: events,
    vocabularies: vocabularies,
    planning: planning,
    agenda: agenda,
    assignment: assignment,
    forms: forms,
    locks: locks,
    session: session,
    workspace: workspace,
    templates: templates,
    main: main,
    eventsPlanning: eventsPlanning,
    multiSelect: multiSelect,
    selected: selected,
    featuredPlanning: featuredPlanning,
    files: files,
    contacts: contacts,

    // The following doesn't require reducers as they are loaded using sdPlanningService
    ingest: returnState,
    privileges: returnState,
    subjects: returnState,
    genres: returnState,
    users: returnState,
    desks: returnState,
    urgency: returnState,
    customVocabularies: returnState,
    userDesks: returnState,
    locations: locations,
    exportTemplates: returnState,
});

export default planningApp;
