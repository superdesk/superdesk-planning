import {isNil, zipObject, get, isEmpty} from 'lodash';
import {createStore} from '../utils';
import {ITEM_TYPE} from '../constants';
import * as selectors from '../selectors';
import * as actions from '../actions';

export class PlanningStoreService {
    constructor(
        $rootScope,
        api,
        config,
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
        deployConfig,
        gettext,
        authoringWorkspace,
        gettextCatalog,
        $q,
        $interpolate,
        search,
        preferencesService
    ) {
        this.$rootScope = $rootScope;
        this.api = api;
        this.config = config;
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
        this.deployConfig = deployConfig;
        this.gettext = gettext;
        this.authoringWorkspace = authoringWorkspace;
        this.gettextCatalog = gettextCatalog;
        this.$q = $q;
        this.$interpolate = $interpolate;
        this.search = search;
        this.preferencesService = preferencesService;

        this.onSessionChanged = this.onSessionChanged.bind(this);
        this.onDeskChanged = this.onDeskChanged.bind(this);
        this._reloadVocabularies = this._reloadVocabularies.bind(this);

        this.store = null;
        this.loading = false;

        $rootScope.$watch(() => this.session.sessionId, this.onSessionChanged);
        $rootScope.$watch(() => this.desks.active, this.onDeskChanged);
        $rootScope.$on('vocabularies:updated', this._reloadVocabularies);
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
                        deployConfig: this.deployConfig,
                        gettextCatalog: this.gettextCatalog,
                        gettext: this.gettext,
                        authoringWorkspace: this.authoringWorkspace,
                        $interpolate: this.$interpolate,
                        search: this.search,
                        config: this.config,
                        preferencesService: this.preferencesService,
                        $rootScope: this.$rootScope,
                    },
                });

                return Promise.resolve(store);
            });
    }

    fetchData() {
        return this.$q.all({
            voc: this.vocabularies.getAllActiveVocabularies(),
            ingest: this.api('ingest_providers').getAll(),
            privileges: this.privileges.loaded,
            metadata: this.metadata.initialize(),
            users: this.userList.getAll(),
            desks: this.desks.initialize(),
            all_templates: this.templates.fetchAllTemplates(1, 50, 'create'),
            formsProfile: this.api('planning_types').query({
                max_results: 200,
                page: 1,
            }),
            userDesks: this.desks.fetchCurrentUserDesks(),
            exportTemplates: this.api('planning_export_templates').query({
                max_results: 200,
                page: 1,
            }),
        });
    }

    getInitialState() {
        return this.fetchData()
            .then((data) => {
                const genres = this.metadata.values.genre_custom ?
                    this.metadata.values.genre_custom.map(
                        (item) => Object.assign({scheme: 'genre_custom'}, item)
                    ) :
                    this.metadata.values.genre;

                const initialState = {
                    config: this.config,
                    deployConfig: this.deployConfig.config,
                    vocabularies: zipObject(
                        get(data, 'voc', []).map((cv) => cv._id),
                        get(data, 'voc', []).map((cv) => cv.items)
                    ),
                    ingest: {
                        providers: get(data, 'ingest', [])
                            .filter((p) => get(p, 'content_types', []).indexOf(ITEM_TYPE.EVENT) !== -1)
                            .map((provider) => ({
                                name: provider.name,
                                id: provider._id,
                            })),
                    },
                    privileges: data.privileges,
                    subjects: this.metadata.values.subjectcodes,
                    genres: genres,
                    users: data.users,
                    desks: this.desks.desks._items,
                    templates: data.all_templates._items,
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
                    forms: {profiles: {}},
                    customVocabularies: this.metadata.cvs.filter((cv) =>
                        !isEmpty(cv.service) &&
                        isEmpty(cv.field_type)
                    ),
                    userDesks: data.userDesks,
                    exportTemplates: get(data.exportTemplates, '_items', []),
                };

                // use custom cvs if any
                angular.extend(initialState.vocabularies, {
                    genre: genres,
                });

                data.formsProfile._items.forEach((p) => {
                    initialState.forms.profiles[p.name] = p;
                });

                return Promise.resolve(initialState);
            });
    }

    _reloadVocabularies() {
        if (isNil(this.store)) {
            return;
        }

        this.vocabularies.getAllActiveVocabularies()
            .then((voc) => {
                this.store.dispatch({
                    type: 'RECEIVE_VOCABULARIES',
                    payload: voc._items,
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
}

PlanningStoreService.$inject = [
    '$rootScope',
    'api',
    'config',
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
    'deployConfig',
    'gettext',
    'authoringWorkspace',
    'gettextCatalog',
    '$q',
    '$interpolate',
    'search',
    'preferencesService',
];
