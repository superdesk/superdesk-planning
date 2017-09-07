import { isNil } from 'lodash'
import { createStore } from '../utils'
import { zipObject } from 'lodash'

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
    $q
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
            success: (msg) => $timeout(() => notify.success(msg)),
            error: (msg) => $timeout(() => notify.error(msg)),
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

    $rootScope.$on('vocabularies:updated', angular.bind(this, this._reloadVocabularies))
}
