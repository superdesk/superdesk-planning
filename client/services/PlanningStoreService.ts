import {isNil, zipObject, get} from 'lodash';

import {ITemplate} from 'superdesk-api';
import {IEditorProfile} from '../interfaces';
import {createStore} from '../utils';
import {COVERAGES, ITEM_TYPE, ASSIGNMENTS} from '../constants';
import * as selectors from '../selectors';
import * as actions from '../actions';
import {planningApi, superdeskApi} from '../superdeskApi';
import {isCustomVocabulary} from '../helpers';
import {PLANNING_EXPORT_TEMPLATES_RESOURCE} from '../constants/exportTemplates';

export class PlanningStoreService {
    constructor(
        $rootScope,
        api,
        $location,
        $timeout,
        vocabularies,
        superdesk,
        upload,
        notify,
        privileges,
        notifyConnectionService,
        userList,
        desks,
        templates,
        metadata,
        session,
        gettext,
        authoringWorkspace,
        gettextCatalog,
        $q,
        $interpolate,
        search,
        modal,
        preferencesService
    ) {
        this.$rootScope = $rootScope;
        this.api = api;
        this.$location = $location;
        this.$timeout = $timeout;
        this.vocabularies = vocabularies;
        this.superdesk = superdesk;
        this.upload = upload;
        this.notify = notify;
        this.privileges = privileges;
        this.notifyConnectionService = notifyConnectionService;
        this.userList = userList;
        this.desks = desks;
        this.templates = templates;
        this.metadata = metadata;
        this.session = session;
        this.gettext = gettext;
        this.authoringWorkspace = authoringWorkspace;
        this.gettextCatalog = gettextCatalog;
        this.$q = $q;
        this.$interpolate = $interpolate;
        this.search = search;
        this.modal = modal;
        this.preferencesService = preferencesService;

        this.onSessionChanged = this.onSessionChanged.bind(this);
        this.onDeskChanged = this.onDeskChanged.bind(this);
        this._reloadVocabularies = this._reloadVocabularies.bind(this);
        this.onNotificationClick = this.onNotificationClick.bind(this);

        this.store = null;
        this.loading = false;

        $rootScope.$watch(() => this.session.sessionId, this.onSessionChanged);
        $rootScope.$watch(() => this.desks.active, this.onDeskChanged);
        $rootScope.$on('vocabularies:updated', this._reloadVocabularies);
        $rootScope.$on('notification:click', this.onNotificationClick);
    }

    initWorkspace(workspaceName, onLoadWorkspace = null) {
        return new Promise((resolve, reject) => {
            const isStoreAvailable = () => {
                if (!this.loading) {
                    // Mark the store as loading, and clear the timer callback
                    // As we will resolve the store and load the workspace here
                    this.loading = true;
                    clearInterval(interval);

                    if (this.store) {
                        resolve();
                    } else {
                        // No Redux store exists, so create it now
                        this.createStore()
                            .then((store) => {
                                planningApi.redux = {store: store};

                                this.store = store;
                                resolve();
                            });
                    }

                    return true;
                }

                // The store is currently loading,
                // check back again once loading has been completed
                return false;
            };

            let interval;

            if (isStoreAvailable()) {
                // Make sure it doesn't register an interval if the store is already available
                return;
            }

            interval = setInterval(isStoreAvailable, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject('Timed out while waiting for the Planning service');
            }, 1000 * 60);
        })
            .then(() => {
                const workspaceChanged = selectors.general.currentWorkspace(this.store.getState()) !== workspaceName;

                if (workspaceChanged) {
                    this.store.dispatch(actions.initStore(workspaceName));
                }

                return onLoadWorkspace ?
                    onLoadWorkspace(this.store, workspaceChanged) :
                    Promise.resolve();
            })
            .finally(() => {
                this.loading = false;
                return Promise.resolve();
            });
    }

    createStore() {
        return this.getInitialState()
            .then((initialState) => {
                const _notify = {
                    pop: () => this.$timeout(() => this.notify.pop()),
                    error: (msg, ttl, options) => this.$timeout(() => this.notify.error(msg, ttl, options)),
                    success: (msg, ttl, options) => this.$timeout(() => this.notify.success(msg, ttl, options)),
                    warning: (msg, ttl, options) => this.$timeout(() => this.notify.warning(msg, ttl, options)),
                };

                const store = createStore({
                    initialState: initialState,
                    extraArguments: {
                        api: this.api,
                        $location: this.$location,
                        $timeout: this.$timeout,
                        vocabularies: this.vocabularies,
                        superdesk: this.superdesk,
                        upload: this.upload,
                        notify: _notify,
                        privileges: this.privileges,
                        notifyConnectionService: this.notifyConnectionService,
                        userList: this.userList,
                        desks: this.desks,
                        templates: this.templates,
                        metadata: this.metadata,
                        session: this.session,
                        gettextCatalog: this.gettextCatalog,
                        gettext: this.gettext,
                        authoringWorkspace: this.authoringWorkspace,
                        $interpolate: this.$interpolate,
                        search: this.search,
                        modal: this.modal,
                        preferencesService: this.preferencesService,
                        $rootScope: this.$rootScope,
                    },
                });

                this.registerUserPreferences();

                return Promise.resolve(store);
            });
    }

    fetchData() {
        return Promise.all([
            this.vocabularies.getAllActiveVocabularies(),
            this.api('ingest_providers').getAll(),
            this.privileges.loaded,
            this.metadata.initialize(),
            this.userList.getAll(),
            this.desks.initialize(),
            this.getAllCreateTemplates(),
            planningApi.contentProfiles.getAll(),
            this.desks.fetchCurrentUserDesks(),
            this.api(PLANNING_EXPORT_TEMPLATES_RESOURCE).query({
                max_results: 200,
                page: 1,
            }),
        ]);
    }

    private getAllCreateTemplates(): Promise<Array<ITemplate>> {
        return superdeskApi.dataApi.query<ITemplate>(
            'content_templates',
            1,
            {field: 'template_name', direction: 'ascending'},
            {template_type: 'create'},
            200,
        )
            .then((response) => (response._items));
    }

    getInitialState() {
        return this.fetchData()
            .then(([
                voc = [],
                ingest = [],
                privileges = [],
                _metadata,
                users = [],
                _desks,
                all_templates = [],
                formsProfile = [],
                userDesks = [],
                exportTemplates = [],
            ]) => {
                const genres = this.metadata.values.genre_custom ?
                    this.metadata.values.genre_custom.map(
                        (item) => Object.assign({scheme: 'genre_custom'}, item)
                    ) :
                    this.metadata.values.genre;

                const initialState = {
                    vocabularies: zipObject(
                        voc.map((cv) => cv._id),
                        voc.map((cv) => cv.items)
                    ),
                    ingest: {
                        providers: ingest
                            .filter((p) => (
                                get(p, 'content_types', []).indexOf(ITEM_TYPE.EVENT) !== -1 ||
                                get(p, 'content_types', []).indexOf(ITEM_TYPE.PLANNING) !== -1)
                            )
                            .map((provider) => ({
                                name: provider.name,
                                id: provider._id,
                            })),
                    },
                    privileges: privileges,
                    subjects: this.metadata.values.subjectcodes,
                    genres: genres,
                    users: users,
                    desks: this.desks.desks._items,
                    templates: all_templates,
                    workspace: {
                        currentDeskId: get(this.desks, 'active.desk'),
                        currentStageId: get(this.desks, 'active.stage'),
                    },
                    session: {
                        sessionId: this.session.sessionId,
                        identity: this.session.identity,
                        userPreferences: {},
                    },
                    urgency: {
                        urgency: this.metadata.values.urgency,
                        label: this.gettextCatalog.getString('Urgency'),
                    },
                    coverageProfiles: {},
                    forms: {profiles: {}},
                    customVocabularies: this.metadata.cvs.filter(isCustomVocabulary),
                    userDesks: userDesks,
                    exportTemplates: get(exportTemplates, '_items', []),
                };

                // use custom cvs if any
                angular.extend(initialState.vocabularies, {
                    genre: genres,
                });

                formsProfile.forEach((profile: IEditorProfile) => {
                    if (profile.type === 'coverage') {
                        initialState.coverageProfiles.profiles = profile;
                    } else {
                        initialState.forms.profiles[profile.type] = profile;
                    }
                });

                return Promise.resolve(initialState);
            });
    }

    onNotificationClick(event, data) {
        // If the notification has an assignment related to it, open that item
        if (!get(data, 'notification.data.assignment_id')) {
            return;
        }

        const currentPath = this.$location.path();

        this.$location
            .path('/workspace/assignments')
            .search('assignment', data.notification.data.assignment_id);

        if (currentPath.startsWith('/workspace/assignments') && !isNil(this.store)) {
            this.store.dispatch(
                actions.assignments.ui.updatePreviewItemOnRouteUpdate()
            );
        }
    }

    _reloadVocabularies() {
        if (isNil(this.store)) {
            return;
        }

        this.vocabularies.getAllActiveVocabularies()
            .then((voc) => {
                this.store.dispatch({
                    type: 'RECEIVE_VOCABULARIES',
                    payload: voc,
                });
            });
    }

    onSessionChanged() {
        if (this.store) {
            this.store.dispatch({
                type: 'RECEIVE_SESSION',
                payload: {
                    sessionId: this.session.sessionId,
                    identity: this.session.identity,
                },
            });
        }
    }

    onDeskChanged() {
        // Update the store with workspace
        if (this.store) {
            this.store.dispatch({
                type: 'WORKSPACE_CHANGE',
                payload: {
                    currentDeskId: get(this.desks, 'active.desk'),
                    currentStageId: get(this.desks, 'active.stage'),
                },
            });
        }
    }

    registerUserPreferences() {
        this.preferencesService.registerUserPreference(COVERAGES.DEFAULT_DESK_PREFERENCE);
        this.preferencesService.registerUserPreference(COVERAGES.ADD_ADVANCED_MODE_PREFERENCE);
        this.preferencesService.registerUserPreference(ASSIGNMENTS.DEFAULT_SORT_PREFERENCE);
    }
}

PlanningStoreService.$inject = [
    '$rootScope',
    'api',
    '$location',
    '$timeout',
    'vocabularies',
    'superdesk',
    'upload',
    'notify',
    'privileges',
    'notifyConnectionService',
    'userList',
    'desks',
    'templates',
    'metadata',
    'session',
    'gettext',
    'authoringWorkspace',
    'gettextCatalog',
    '$q',
    '$interpolate',
    'search',
    'modal',
    'preferencesService',
];
