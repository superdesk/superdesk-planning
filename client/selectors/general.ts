import {get, keyBy} from 'lodash';
import {createSelector} from 'reselect';
import {getEnabledAgendas, getDisabledAgendas, getItemInArrayById} from '../utils';
import {ITEM_TYPE, COVERAGES, ASSIGNMENTS} from '../constants/index';

export const currentWorkspace = (state) => get(state, 'workspace.currentWorkspace', null);
export const ingestProviders = (state) => get(state, 'ingest.providers');
export const privileges = (state) => get(state, 'privileges');
export const users = (state) => get(state, 'users', []);
export const keywords = (state) => get(state, 'vocabularies.keywords', []);
export const newsCoverageStatus = (state) => get(state, 'vocabularies.newscoveragestatus', []);
export const regions = (state) => get(state, 'vocabularies.regions', []);
export const countries = (state) => get(state, 'vocabularies.countries', []);

export const contentTypes = (state) => get(state, 'vocabularies.g2_content_type', []);
export const preferredVocabularies = (state) => get(state, 'session.userPreferences.cvs:preferred_items.value');

export const currentDeskId = (state) => get(state, 'workspace.currentDeskId', null);
export const desks = (state) => get(state, 'desks', []);
export const getDesksById = (state) => get(state, 'desks', []).reduce(
    (deskList, desk) => {
        deskList[desk._id] = desk;

        return deskList;
    },
    {}
);
export const templates = (state) => get(state, 'templates', []);
export const userDesks = (state) => get(state, 'userDesks', []);


export const modalType = (state) => get(state, 'modal.modalType');
export const modalProps = (state) => get(state, 'modal.modalProps');
export const previousModalType = (state) => get(state, 'modal.previousState.modalType');
export const previousModalProps = (state) => get(state, 'modal.previousState.modalProps') || {};
export const modalActionInProgress = (state) => !!get(state, 'modal.actionInProgress', false);

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const enabledAgendas = createSelector(
    [agendas],
    (agendas) => getEnabledAgendas(agendas)
);

export const disabledAgendas = createSelector(
    [agendas],
    (agendas) => getDisabledAgendas(agendas)
);

export const preferredCountry = createSelector(
    [preferredVocabularies],
    (vocab) => get(vocab, 'countries[0]', null)
);

export const session = (state) => get(state, 'session');
export const sessionId = (state) => get(state, 'session.sessionId');
export const userPreferences = (state) => get(state, 'session.userPreferences') || {};
export const defaultPlaceList = (state) => get(state, 'session.userPreferences.article:default:place.place', []);
export const defaultDesk = createSelector(
    [desks, session],
    (deskList, sessionDetails) => (!get(sessionDetails, 'identity.desk') ? null :
        getItemInArrayById(deskList, sessionDetails.identity.desk))
);

export const preferredCoverageDesks = (state) => (
    get(userPreferences(state), COVERAGES.DEFAULT_DESK_PREFERENCE) || {}
);
export const preferredAssignmentSort = (state) => (
    get(userPreferences(state), ASSIGNMENTS.DEFAULT_SORT_PREFERENCE) || {}
);
export const coverageAddAdvancedMode = (state) => (
    !!get(userPreferences(state), COVERAGES.ADD_ADVANCED_MODE_PREFERENCE + '.enabled')
);

export const currentUserId = createSelector(
    [session],
    (session) => get(session, 'identity._id')
);

export const files = (state) => get(state, 'files.files');

export const contacts = (state) => get(state, 'contacts.contacts') || [];
export const contactsLoading = (state) => get(state, 'contacts.loading', false);
export const contactsTotal = (state) => get(state, 'contacts.total', 0);
export const contactsPage = (state) => get(state, 'contacts.page', 1);

export const contactsById = createSelector(
    [contacts],
    (contacts) => keyBy(contacts, '_id')
);
export const contactIds = createSelector(
    [contacts],
    (contacts) => contacts.map((contact) => contact._id)
);

export const getPlanningExportTemplates = (state) => get(state, 'exportTemplates', []).filter(
    (e) => e.type === ITEM_TYPE.PLANNING);
export const getEventExportTemplates = (state) => get(state, 'exportTemplates', []).filter(
    (e) => e.type === ITEM_TYPE.EVENT);
export const getExportTemplates = (state) => get(state, 'exportTemplates', []);
