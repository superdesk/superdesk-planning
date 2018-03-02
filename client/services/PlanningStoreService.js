import {isNil, zipObject, get} from 'lodash';
import {createStore} from '../utils';
import {ITEM_TYPE} from '../constants';

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
    'contacts',
];
export function PlanningStoreService(
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
    contacts
) {
    let self = this;

    self.store = null;

    this.getStore = function() {
        if (isNil(self.store)) {
            return this.createStore();
        }

        return Promise.resolve(self.store);
    };

    this.createStore = function() {
        const _notify = {
            pop: () => $timeout(() => notify.pop()),
            error: (msg, ttl, options) => $timeout(() => notify.error(msg, ttl, options)),
            success: (msg, ttl, options) => $timeout(() => notify.success(msg, ttl, options)),
            warning: (msg, ttl, options) => $timeout(() => notify.warning(msg, ttl, options)),
        };

        return $q.all({
            voc: vocabularies.getAllActiveVocabularies(),
            ingest: api('ingest_providers').query({
                max_results: 200,
                page: 1,
            }),
            privileges: privileges.loaded,
            metadata: metadata.initialize(),
            users: userList.getAll(),
            desks: desks.initialize(),
            all_templates: templates.fetchAllTemplates(1, 50, 'create'),
            formsProfile: api('planning_types').query({
                max_results: 200,
                page: 1,
            }),
            contacts: contacts.query({
                max_results: 200,
                page: 1,
                all: true,
                default_operator: 'AND',
                q: 'public:(1) is_active:(1)',
            }).then((items) => items),
        }).then((data) => {
            const initialState = {
                config: config,
                deployConfig: deployConfig.config,
                vocabularies: zipObject(
                    data.voc._items.map((cv) => cv._id),
                    data.voc._items.map((cv) => cv.items)
                ),
                ingest: {
                    providers: data.ingest._items.filter((p) =>
                        p.content_types.indexOf(ITEM_TYPE.EVENT) !== -1)
                        .map((provider) => ({
                            name: provider.name,
                            id: provider._id,
                        })),
                },
                privileges: data.privileges,
                subjects: metadata.values.subjectcodes,
                genres: metadata.values.genre,
                users: data.users,
                desks: desks.desks._items,
                templates: data.all_templates._items,
                workspace: {
                    currentDeskId: desks.getCurrentDeskId(),
                    currentStageId: desks.getCurrentStageId(),
                },
                session: {
                    sessionId: session.sessionId,
                    identity: session.identity,
                },
                urgency: {
                    urgency: metadata.values.urgency,
                    label: gettextCatalog.getString('Urgency'),
                },
                forms: {profiles: {}},
                contacts: data.contacts._items,
            };

            data.formsProfile._items.forEach((p) => {
                initialState.forms.profiles[p.name] = p;
            });

            // create the application store
            self.store = createStore({
                initialState: initialState,
                extraArguments: {
                    api: api,
                    $location: $location,
                    $timeout: $timeout,
                    vocabularies: vocabularies,
                    superdesk: superdesk,
                    upload: upload,
                    notify: _notify,
                    privileges: privileges,
                    notifyConnectionService: notifyConnectionService,
                    userList: userList,
                    desks: desks,
                    templates: templates,
                    metadata: metadata,
                    session: session,
                    deployConfig: deployConfig,
                    gettextCatalog: gettextCatalog,
                    gettext: gettext,
                    authoringWorkspace: authoringWorkspace,
                    $interpolate: $interpolate,
                    search: search,
                    config: config,
                    contacts: contacts,
                },
            });
            return self.store;
        });
    };

    this._reloadVocabularies = function() {
        if (isNil(self.store)) {
            return;
        }

        vocabularies.getAllActiveVocabularies()
            .then((voc) => {
                self.store.dispatch({
                    type: 'RECEIVE_VOCABULARIES',
                    payload: voc._items,
                });
            });
    };

    $rootScope.$watch(
        () => session.sessionId,
        () => self.store && self.store.dispatch({
            type: 'RECEIVE_SESSION',
            payload: {
                sessionId: session.sessionId,
                identity: session.identity,
            },
        })
    );

    $rootScope.$watch(
        () => desks.active,
        () => {
            // Update the store with workspace
            self.store && self.store.dispatch({
                type: 'WORKSPACE_CHANGE',
                payload: {
                    currentDeskId: get(desks, 'active.desk'),
                    currentStageId: get(desks, 'active.stage'),
                },
            });
        }
    );

    $rootScope.$on('vocabularies:updated', angular.bind(this, this._reloadVocabularies));
}
