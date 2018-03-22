import planningUi from '../ui';
import planningApi from '../api';
import assignmentApi from '../../assignments/api';
import {main, locks} from '../../';
import sinon from 'sinon';
import {PRIVILEGES, MAIN, WORKSPACE} from '../../../constants';
import {getTestActionStore, restoreSinonStub, expectAccessDenied} from '../../../utils/testUtils';

describe('actions.planning.ui', () => {
    let store;
    let services;
    let data;

    const errorMessage = {data: {_message: 'Failed!'}};

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(planningApi, 'spike').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'unspike').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'refetch').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'save').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningApi, 'saveAndReloadCurrentAgenda').callsFake((item) => Promise.resolve(item));
        sinon.stub(planningApi, 'lock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningApi, 'unlock').callsFake(() => (Promise.resolve(data.plannings[0])));
        sinon.stub(planningUi, 'openEditor').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningUi, '_openEditor').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningUi, 'closeEditor').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'preview').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'requestPlannings').callsFake(() => (Promise.resolve()));

        sinon.stub(planningUi, 'clearList').callsFake(() => ({type: 'clearList'}));
        sinon.stub(planningUi, 'setInList').callsFake(() => ({type: 'setInList'}));
        sinon.stub(planningUi, 'addToList').callsFake(() => ({type: 'addToList'}));
        sinon.stub(planningUi, 'fetchToList').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'loadMore').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()));
        sinon.stub(assignmentApi, 'link').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'saveFromAuthoring').callsFake(() => (Promise.resolve()));

        sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
        sinon.stub(main, 'openEditor').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(locks, 'lock').callsFake((item) => (Promise.resolve(item)));
    });

    afterEach(() => {
        restoreSinonStub(planningApi.spike);
        restoreSinonStub(planningApi.unspike);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(planningApi.refetch);
        restoreSinonStub(planningApi.save);
        restoreSinonStub(planningApi.saveAndReloadCurrentAgenda);
        restoreSinonStub(planningApi.lock);
        restoreSinonStub(planningApi.unlock);

        restoreSinonStub(planningUi.openEditor);
        restoreSinonStub(planningUi._openEditor);
        restoreSinonStub(planningUi.closeEditor);
        restoreSinonStub(planningUi.preview);
        restoreSinonStub(planningUi.requestPlannings);
        restoreSinonStub(planningUi.clearList);
        restoreSinonStub(planningUi.setInList);
        restoreSinonStub(planningUi.addToList);
        restoreSinonStub(planningUi.fetchToList);
        restoreSinonStub(planningUi.refetch);
        restoreSinonStub(assignmentApi.link);
        restoreSinonStub(planningUi.saveFromAuthoring);
        restoreSinonStub(planningUi.loadMore);

        restoreSinonStub(main.closePreviewAndEditorForItems);
        restoreSinonStub(main.openEditor);
        restoreSinonStub(locks.lock);
    });

    describe('spike', () => {
        afterEach(() => {
            restoreSinonStub(planningApi.refetch);
            restoreSinonStub(planningUi.refetch);
        });

        it('ui.spike notifies end user on successful spike', (done) => (
            store.test(done, planningUi.spike(data.plannings[1]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[1]);

                    // Calls api.spike
                    expect(planningApi.spike.callCount).toBe(1);
                    expect(planningApi.spike.args[0]).toEqual([data.plannings[1]]);

                    // Doesn't close editor, as spiked item is not open
                    expect(planningUi.closeEditor.callCount).toBe(0);

                    // Notifies end user of success
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'The Planning Item(s) has been spiked.',
                    ]);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.spike closes editor if item is open', (done) => {
            store.initialState.planning.currentPlanningId = data.plannings[1]._id;
            return store.test(done, planningUi.spike(data.plannings[1]))
                .then(() => {
                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    done();
                });
        });

        it('ui.spike notifies end user on failure to spike', (done) => {
            restoreSinonStub(planningApi.spike);
            sinon.stub(planningApi, 'spike').callsFake(() => (Promise.reject(errorMessage)));
            return store.test(done, planningUi.spike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    // Notifies end user of failure
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(services.notify.success.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('unspike', () => {
        afterEach(() => {
            restoreSinonStub(planningUi.refetch);
        });

        it('ui.unspike notifies end user on successful unspike', (done) => (
            store.test(done, planningUi.unspike(data.plannings[1]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[1]);

                    // Calls api.unspike
                    expect(planningApi.unspike.callCount).toBe(1);
                    expect(planningApi.unspike.args[0]).toEqual([data.plannings[1]]);

                    // Notified end user of success
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'The Planning Item(s) has been unspiked.',
                    ]);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.unspike notifies end user on failure to unspike', (done) => {
            restoreSinonStub(planningApi.unspike);
            sinon.stub(planningApi, 'unspike').callsFake(() => (Promise.reject(errorMessage)));
            return store.test(done, planningUi.unspike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    // Notifies end user of failure
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(services.notify.success.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('saveAndReloadCurrentAgenda', () => {
        it('saves and reloads planning items', (done) => (
            store.test(done, planningUi.saveAndReloadCurrentAgenda(data.plannings[1]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[1]);

                    expect(planningApi.saveAndReloadCurrentAgenda.callCount).toBe(1);
                    expect(planningApi.saveAndReloadCurrentAgenda.args[0]).toEqual([
                        data.plannings[1],
                    ]);

                    done();
                })
        ));

        it('on save fail notifies the end user', (done) => {
            restoreSinonStub(planningApi.saveAndReloadCurrentAgenda);
            sinon.stub(planningApi, 'saveAndReloadCurrentAgenda').callsFake(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, planningUi.saveAndReloadCurrentAgenda(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                });
        });
    });

    it('preview', () => {
        store.initialState.planning.currentPlanningId = 'p1';
        restoreSinonStub(planningUi.preview);
        store.init();
        store.dispatch(planningUi.preview(data.plannings[1]._id));

        expect(store.dispatch.callCount).toBe(2);

        expect(planningUi.closeEditor.callCount).toBe(0);

        expect(store.dispatch.args[1]).toEqual([{
            type: 'PREVIEW_PLANNING',
            payload: 'p2',
        }]);
    });

    it('closeEditor', (done) => {
        store.initialState.planning.currentPlanningId = 'p1';
        data.plannings[0].lock_user = store.initialState.session.identity._id;
        data.plannings[0].lock_session = store.initialState.session.sessionId;

        restoreSinonStub(planningUi.closeEditor);
        store.init();
        store.dispatch(planningUi.closeEditor(data.plannings[0])).then(() => {
            expect(planningApi.unlock.callCount).toBe(1);
            expect(planningApi.unlock.args[0]).toEqual([data.plannings[0]]);
            expect(store.dispatch.args[1]).toEqual([{type: 'CLOSE_PLANNING_EDITOR'}]);

            done();
        });
    });

    it('unlockAndCloseEditor', (done) => {
        store.initialState.planning.currentPlanningId = 'p1';
        data.plannings[0].lock_user = store.initialState.session.identity._id;
        data.plannings[0].lock_session = store.initialState.session.sessionId;

        store.test(done, planningUi.unlockAndCloseEditor(data.plannings[0]))
            .then(() => {
                expect(planningApi.unlock.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(2);
                expect(store.dispatch.args[1]).toEqual([{type: 'CLOSE_PLANNING_EDITOR'}]);
                expect(services.notify.error.callCount).toBe(0);
                done();
            });
    });

    it('unlockAndOpenEditor', (done) => {
        store.init();
        const lock = data.locked_plannings[0];

        store.initialState.locks.planning = {
            p1: {
                action: lock.lock_action,
                user: lock.lock_user,
                session: lock.lock_session,
                item_id: data.plannings[0]._id,
                item_type: 'planning',
            },
        };
        store.test(done, planningUi.unlockAndOpenEditor(data.plannings[0]))
            .then(() => {
                expect(planningApi.unlock.callCount).toBe(1);
                expect(planningApi.unlock.args[0]).toEqual([{_id: data.plannings[0]._id}]);
                expect(planningUi.openEditor.callCount).toBe(1);
                expect(planningUi.openEditor.args[0]).toEqual([data.plannings[0]]);

                done();
            });
    });

    describe('openEditor', () => {
        it('opens the editor', (done) => {
            store.initialState.planning.currentPlanningId = 'p1';
            restoreSinonStub(planningUi.openEditor);
            restoreSinonStub(planningUi._openEditor);
            store.test(done, planningUi.openEditor(data.plannings[1]))
                .then((lockedItem) => {
                    expect(lockedItem).toEqual(data.plannings[1]);

                    expect(planningUi.closeEditor.callCount).toBe(0);

                    expect(store.dispatch.args[2]).toEqual([{
                        type: 'OPEN_PLANNING_EDITOR',
                        payload: lockedItem,
                    }]);

                    done();
                });
        });

        it('openEditor dispatches preview if insufficient privileges', (done) => {
            store.initialState.privileges.planning_planning_management = 0;
            store.initialState.planning.currentPlanningId = 'p1';
            restoreSinonStub(planningUi.openEditor);
            store.test(done, planningUi.openEditor(data.plannings[1]))
                .catch(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'PREVIEW_PLANNING',
                        payload: data.plannings[1],
                    }]);

                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.PLANNING_MANAGEMENT,
                        action: '_lockAndOpenEditor',
                        errorMessage: 'Unauthorised to edit a planning item!',
                        args: [data.plannings[1]],
                        argPos: 2,
                    });

                    done();
                });
        });

        it('sends error notification if lock failed', (done) => {
            store.initialState.planning.currentPlanningId = 'p1';
            restoreSinonStub(planningUi.openEditor);
            restoreSinonStub(planningApi.lock);
            sinon.stub(planningApi, 'lock').callsFake(() => (Promise.reject(errorMessage)));
            store.test(done, planningUi.openEditor(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    it('previewPlanningAndOpenAgenda', () => {
        store.init();
        store.dispatch(planningUi.previewPlanningAndOpenAgenda(data.plannings[0]._id,
            data.agendas[1]));

        expect(store.dispatch.args[2]).toEqual([{
            type: 'SELECT_AGENDA',
            payload: 'a2',
        }]);

        expect(services.$timeout.callCount).toBe(1);
        expect(services.$location.search.callCount).toBe(1);
        expect(services.$location.search.args[0]).toEqual(['agenda', 'a2']);

        expect(planningUi.preview.callCount).toBe(1);
        expect(planningUi.preview.args[0]).toEqual(['p1']);
    });

    it('clearList', () => {
        restoreSinonStub(planningUi.clearList);
        expect(planningUi.clearList()).toEqual({type: 'CLEAR_PLANNING_LIST'});
    });

    it('setInList', () => {
        restoreSinonStub(planningUi.setInList);
        expect(planningUi.setInList(['p1', 'p2', 'p3'])).toEqual({
            type: 'SET_PLANNING_LIST',
            payload: ['p1', 'p2', 'p3'],
        });
    });

    it('addToList', () => {
        restoreSinonStub(planningUi.addToList);
        expect(planningUi.addToList(['p4', 'p5'])).toEqual({
            type: 'ADD_TO_PLANNING_LIST',
            payload: ['p4', 'p5'],
        });
    });

    it('fetchToList', (done) => {
        restoreSinonStub(planningUi.fetchToList);
        restoreSinonStub(planningApi.fetch);
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        const params = store.initialState.planning.lastRequestParams;

        store.test(done, planningUi.fetchToList(params))
            .then(() => {
                expect(planningUi.requestPlannings.callCount).toBe(1);
                expect(planningUi.requestPlannings.args[0]).toEqual([params]);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([params]);

                expect(planningUi.setInList.callCount).toBe(1);
                expect(planningUi.setInList.args[0]).toEqual([['p1', 'p2']]);

                done();
            });
    });

    it('loadMore with data fetched less than page size', (done) => {
        store.initialState.main.filter = MAIN.FILTERS.PLANNING;
        store.initialState.main.search.PLANNING.totalItems = 50;
        store.initialState.main.search.PLANNING.lastRequestParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 1
        };

        restoreSinonStub(planningUi.loadMore);
        restoreSinonStub(planningApi.fetch);
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        const expectedParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 2
        };

        store.test(done, planningUi.loadMore())
            .then(() => {
                expect(planningUi.requestPlannings.callCount).toBe(0);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([expectedParams]);

                expect(planningUi.addToList.callCount).toBe(1);
                expect(planningUi.addToList.args[0]).toEqual([['p1', 'p2']]);

                done();
            });
    });

    it('loadMore with data fetched equal to page size', (done) => {
        store.initialState.main.filter = MAIN.FILTERS.PLANNING;
        store.initialState.main.search.PLANNING.totalItems = 50;
        store.initialState.main.search.PLANNING.lastRequestParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 1
        };

        restoreSinonStub(planningUi.loadMore);
        restoreSinonStub(planningApi.fetch);
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve([...Array(25).keys()]))
        );

        const expectedParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 2
        };

        store.test(done, planningUi.loadMore())
            .then(() => {
                expect(planningUi.requestPlannings.callCount).toBe(1);
                expect(planningUi.requestPlannings.args[0]).toEqual([expectedParams]);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([expectedParams]);

                expect(planningUi.addToList.callCount).toBe(1);

                done();
            });
    });

    it('requestPlannings', () => {
        restoreSinonStub(planningUi.requestPlannings);
        expect(planningUi.requestPlannings({page: 2})).toEqual({
            type: MAIN.ACTIONS.REQUEST,
            payload: {[MAIN.FILTERS.PLANNING]: {page: 2}},
        });
    });

    describe('onAddCoverageClick', () => {
        const newsItem = {
            _id: 'news1',
            slugline: 'slugger',
            ednote: 'Edit my note!',
            type: 'text',
        };

        beforeEach(() => {
            // Init the store so we can use initialState.planning.plannings
            // in the store.test function of each test
            store.init();
            store.initialState.workspace.currentDeskId = 'desk1';
            store.initialState.modal = {
                modalType: 'ADD_TO_PLANNING',
                modalProps: {newsItem},
            };

            sinon.stub(locks, 'unlock').callsFake((item) => (Promise.resolve(item)));
        });

        it('unlocks current planning opens the new planning', (done) => {
            store.initialState.forms.itemId = data.plannings[1]._id;
            store.initialState.forms.itemType = 'planning';
            store.test(done, planningUi.onAddCoverageClick(
                store.initialState.planning.plannings.p1
            ))
                .then(() => {
                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([
                        store.initialState.planning.plannings.p2,
                    ]);

                    expect(main.openEditor.callCount).toBe(1);
                    expect(main.openEditor.args[0]).toEqual([store.initialState.planning.plannings.p1]);
                    done();
                });
        });

        afterEach(() => {
            restoreSinonStub(locks.unlock);
        });
    });

    describe('save', () => {
        it('calls saveAndReloadCurrentAgenda if in the Planning UI', () => {
            sinon.stub(planningUi, 'saveAndReloadCurrentAgenda').callsFake(() => (Promise.resolve()));
            store.dispatch(planningUi.save(data.plannings[0]));

            expect(planningUi.saveAndReloadCurrentAgenda.callCount).toBe(1);
            expect(planningUi.saveAndReloadCurrentAgenda.args[0]).toEqual([data.plannings[0]]);

            restoreSinonStub(planningUi.saveAndReloadCurrentAgenda);
        });

        it('calls saveFromAuthoring if in AUTHORING workspace', () => {
            store.initialState.workspace.currentWorkspace = WORKSPACE.AUTHORING;
            store.dispatch(planningUi.save(data.plannings[0]));

            expect(planningUi.saveFromAuthoring.callCount).toBe(1);
            expect(planningUi.saveFromAuthoring.args[0][0]).toEqual(data.plannings[0]);
        });
    });

    describe('saveFromAuthoring', () => {
        let modalProps;

        beforeEach(() => {
            restoreSinonStub(planningUi.saveFromAuthoring);

            modalProps = {
                newsItem: {
                    _id: 'news1',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    type: 'picture',
                    state: 'draft',
                },
                $scope: {
                    resolve: sinon.spy(),
                    reject: sinon.spy(),
                },
            };

            store.initialState.modal = {
                modalType: 'ADD_TO_PLANNING',
                modalProps: modalProps,
            };

            data.plannings[0].coverages.pop();
        });

        it('calls save', () => {
            store.dispatch(planningUi.saveFromAuthoring(data.plannings[0], {publish: false, unpublish: false}));
            expect(planningApi.save.callCount).toBe(1);
            expect(planningApi.save.args[0]).toEqual([data.plannings[0]]);
        });

        it('notifies user if save fails', (done) => {
            restoreSinonStub(planningApi.save);
            sinon.stub(planningApi, 'save').callsFake(() => Promise.reject(errorMessage));

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0]))
                .then(() => { /* no-op */ }, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(modalProps.$scope.resolve.callCount).toBe(0);
                    expect(modalProps.$scope.reject.callCount).toBe(1);

                    done();
                });
        });

        it('notifies user if link fails', (done) => {
            restoreSinonStub(assignmentApi.link);
            sinon.stub(assignmentApi, 'link').callsFake(
                () => (Promise.reject(errorMessage))
            );

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], {publish: false, unpublish: false}))
                .then(() => { /* no-op */ }, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(modalProps.$scope.resolve.callCount).toBe(0);
                    expect(modalProps.$scope.reject.callCount).toBe(1);

                    done();
                });
        });

        it('calls link and notifies user of success', (done) => (
            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], {publish: false, unpublish: false}))
                .then(() => {
                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([data.plannings[0]]);

                    expect(assignmentApi.link.callCount).toBe(1);
                    expect(assignmentApi.link.args[0]).toEqual([
                        {
                            user: 'ident1',
                            desk: 'desk2',
                            assignment_id: 'as2',
                        },
                        {
                            _id: 'news1',
                            slugline: 'slug',
                            ednote: 'edit my note',
                            type: 'picture',
                            state: 'draft',
                        },
                    ]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'Content linked to the planning item.',
                    ]);

                    expect(modalProps.$scope.resolve.callCount).toBe(1);
                    expect(modalProps.$scope.reject.callCount).toBe(0);

                    done();
                })
        ));
    });

    describe('duplicate', () => {
        beforeEach(() => {
            sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(main.lockAndEdit);
            restoreSinonStub(planningApi.duplicate);
        });

        it('duplicate calls planning.api.duplicate and notifies the user of success', (done) => {
            sinon.stub(planningApi, 'duplicate').callsFake((item) => Promise.resolve(item));
            store.test(done, planningUi.duplicate(data.plannings[0]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(planningApi.duplicate.callCount).toBe(1);
                    expect(planningApi.duplicate.args[0]).toEqual([data.plannings[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Planning duplicated']);

                    expect(main.lockAndEdit.callCount).toBe(1);
                    expect(main.lockAndEdit.args[0]).toEqual([data.plannings[0]]);

                    done();
                });
        });

        it('on duplicate error notify the user of the failure', (done) => {
            sinon.stub(planningApi, 'duplicate').callsFake(() => Promise.reject(errorMessage));
            store.test(done, planningUi.duplicate(data.plannings[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });
});
