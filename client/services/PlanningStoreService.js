import { isNil, zipObject, get } from 'lodash'
import { createStore } from '../utils'

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
    'metadata',
    'session',
    'deployConfig',
    'gettext',
    'gettextCatalog',
    '$q',
    '$interpolate',
]
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
    metadata,
    session,
    deployConfig,
    gettext,
    gettextCatalog,
    $q,
    $interpolate
) {
    let self = this

    self.store = null

    this.getStore = function() {
        if (isNil(self.store)) {
            return this.createStore()
        }

        return Promise.resolve(self.store)
    }

    this.createStore = function() {
        const _notify = {
            pop: () => $timeout(() => notify.pop()),
            error: (msg, ttl, options) => $timeout(() => notify.error(msg, ttl, options)),
            success: (msg, ttl, options) => $timeout(() => notify.success(msg, ttl, options)),
            warning: (msg, ttl, options) => $timeout(() => notify.warning(msg, ttl, options)),
        }

        return $q.all({
            voc: vocabularies.getAllActiveVocabularies(),
            ingest: api('ingest_providers').query({
                max_result: 200,
                page: 1,
            }),
            privileges: privileges.loaded,
            metadata: metadata.initialize(),
            users: userList.getAll(),
            desks: desks.initialize(),
            formsProfile: api('planning_types').query({
                max_results: 200,
                page: 1,
            }),
        }).then((data) => {
            const initialState = {
                config,
                deployConfig: deployConfig.config,
                vocabularies: zipObject(
                    data.voc._items.map((cv) => cv._id),
                    data.voc._items.map((cv) => cv.items)
                ),
                ingest: {
                    providers: data.ingest._items.map((provider) => ({
                        name: provider.name,
                        id: provider._id,
                    })),
                },
                privileges: data.privileges,
                subjects: metadata.values.subjectcodes,
                genres: metadata.values.genre,
                users: data.users,
                desks: desks.desks._items,
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
                formsProfile: {},
            }

            data.formsProfile._items.forEach((p) => {
                initialState.formsProfile[p.name] = p
            })

            // create the application store
            self.store = createStore({
                initialState,
                extraArguments: {
                    api,
                    $location,
                    $timeout,
                    vocabularies,
                    superdesk,
                    upload,
                    notify: _notify,
                    privileges,
                    notifyConnectionService,
                    userList,
                    desks,
                    metadata,
                    session,
                    deployConfig,
                    gettextCatalog,
                    gettext,
                    $interpolate,
                },
            })
            return self.store
        })
    }

    this._reloadVocabularies = function () {
        if (isNil(self.store)) {
            return
        }

        vocabularies.getAllActiveVocabularies()
        .then((voc) => {
            self.store.dispatch({
                type: 'RECEIVE_VOCABULARIES',
                payload: voc._items,
            })
        })
    }

    $rootScope.$watch(
        () => session.sessionId,
        () => self.store && self.store.dispatch({
            type: 'RECEIVE_SESSION',
            payload: {
                sessionId: session.sessionId,
                identity: session.identity,
            },
        })
    )

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
            })
        }
    )

    $rootScope.$on('vocabularies:updated', angular.bind(this, this._reloadVocabularies))
}
