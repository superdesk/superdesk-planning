import planningUi from '../ui';
import planningApi from '../api';
import assignmentApi from '../../assignments/api';
import main from '../../main';
import sinon from 'sinon';
import {PRIVILEGES, ASSIGNMENTS, MAIN} from '../../../constants';
import {getTestActionStore, restoreSinonStub, expectAccessDenied} from '../../../utils/testUtils';
import moment from 'moment';

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
        sinon.stub(planningApi, 'saveAndReloadCurrentAgenda').callsFake(
            (item) => (Promise.resolve(item))
        );
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
        sinon.stub(planningApi, 'publish').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'unpublish').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'saveAndPublish').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningApi, 'saveAndUnpublish').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()));
        sinon.stub(assignmentApi, 'link').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'saveFromAuthoring').callsFake(() => (Promise.resolve()));
        sinon.stub(planningUi, 'saveFromPlanning').callsFake(() => (Promise.resolve()));

        sinon.stub(main, 'closePreview').callsFake(() => (Promise.resolve()));
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
        restoreSinonStub(planningApi.publish);
        restoreSinonStub(planningApi.unpublish);
        restoreSinonStub(planningApi.saveAndPublish);
        restoreSinonStub(planningApi.saveAndUnpublish);

        restoreSinonStub(planningUi.openEditor);
        restoreSinonStub(planningUi._openEditor);
        restoreSinonStub(planningUi.closeEditor);
        restoreSinonStub(planningUi.preview);
        restoreSinonStub(planningUi.requestPlannings);
        restoreSinonStub(planningUi.clearList);
        restoreSinonStub(planningUi.setInList);
        restoreSinonStub(planningUi.addToList);
        restoreSinonStub(planningUi.fetchToList);
        restoreSinonStub(planningUi.fetchMoreToList);
        restoreSinonStub(planningUi.refetch);
        restoreSinonStub(assignmentApi.link);
        restoreSinonStub(planningUi.saveFromAuthoring);
        restoreSinonStub(planningUi.saveFromPlanning);
        restoreSinonStub(main.closePreview);
        restoreSinonStub(planningUi.loadMore);
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
                        'The Planning Item has been spiked.',
                    ]);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.spike closes editor if item is open', (done) => {
            store.initialState.planning.currentPlanningId = data.plannings[1]._id;
            return store.test(done, planningUi.spike(data.plannings[1]))
                .then(() => {
                    expect(main.closePreview.callCount).toBe(1);
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

        it('ui.spike raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_spike = 0;
            return store.test(done, planningUi.spike(data.plannings[1]))
                .catch(() => {
                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.SPIKE_PLANNING,
                        action: '_spike',
                        errorMessage: 'Unauthorised to spike a planning item!',
                        args: [data.plannings[1]],
                    });
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
                        'The Planning Item has been unspiked.',
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

        it('ui.unspike raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_unspike = 0;
            return store.test(done, planningUi.unspike(data.plannings[1]))
                .catch(() => {
                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.UNSPIKE_PLANNING,
                        action: '_unspike',
                        errorMessage: 'Unauthorised to unspike a planning item!',
                        args: [data.plannings[1]],
                    });
                    done();
                });
        });
    });

    describe('save', () => {
        it('saves and notifies end user', (done) => (
            store.test(done, planningUi.save(data.plannings[1]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[1]);

                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([data.plannings[1]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'The planning item has been saved.',
                    ]);

                    done();
                })
        ));

        it('on fail notifies the end user', (done) => {
            restoreSinonStub(planningApi.save);
            sinon.stub(planningApi, 'save').callsFake(() => (Promise.reject(errorMessage)));
            return store.test(done, planningUi.save(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

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

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'The Planning item has been saved.',
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

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

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

    it('loadMore', (done) => {
        store.initialState.main.filter = MAIN.FILTERS.PLANNING;
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
                expect(planningUi.requestPlannings.callCount).toBe(1);
                expect(planningUi.requestPlannings.args[0]).toEqual([expectedParams]);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([expectedParams]);

                expect(planningUi.addToList.callCount).toBe(1);
                expect(planningUi.addToList.args[0]).toEqual([['p1', 'p2']]);

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

    describe('ui.publish', () => {
        it('ui.publish notifies user on successful publish', (done) => (
            store.test(done, planningUi.publish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.publish.callCount).toBe(1);
                    expect(planningApi.publish.args[0]).toEqual([data.plannings[1]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Planning item published!']);
                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.publish notifies user on failure to publish', (done) => {
            restoreSinonStub(planningApi.publish);
            sinon.stub(planningApi, 'publish').callsFake(() => (Promise.reject(errorMessage)));
            store.test(done, planningUi.publish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.publish.callCount).toBe(1);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('ui.unpublish', () => {
        it('ui.unpublish notifies user on successful unpublish', (done) => (
            store.test(done, planningUi.unpublish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.unpublish.callCount).toBe(1);
                    expect(planningApi.unpublish.args[0]).toEqual([data.plannings[1]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Planning item unpublished!']);
                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.unpublish notifies user on failure to unpublish', (done) => {
            restoreSinonStub(planningApi.unpublish);
            sinon.stub(planningApi, 'unpublish').callsFake(() => (Promise.reject(errorMessage)));
            store.test(done, planningUi.unpublish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.unpublish.callCount).toBe(1);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('ui.saveAndPublish', () => {
        it('ui.saveAndPublish notifies user on successful save and publish', (done) => (
            store.test(done, planningUi.saveAndPublish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.saveAndPublish.callCount).toBe(1);
                    expect(planningApi.saveAndPublish.args[0]).toEqual([data.plannings[1]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Planning item published!']);
                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.saveAndPublish notifies user on failulre to save and publish', (done) => {
            restoreSinonStub(planningApi.saveAndPublish);
            sinon.stub(planningApi, 'saveAndPublish').returns(Promise.reject(errorMessage));

            store.test(done, planningUi.saveAndPublish(data.plannings[1]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(planningApi.saveAndPublish.callCount).toBe(1);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('ui.saveAndUnpublish', () => {
        it('ui.saveAndUnpublish notifies user on successful save and unpublish', (done) => (
            store.test(done, planningUi.saveAndUnpublish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.saveAndUnpublish.callCount).toBe(1);
                    expect(planningApi.saveAndUnpublish.args[0]).toEqual([data.plannings[1]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Planning item unpublished!']);
                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('ui.saveAndUnpublish notifies user on failulre to save and publish', (done) => {
            restoreSinonStub(planningApi.saveAndUnpublish);
            sinon.stub(planningApi, 'saveAndUnpublish').callsFake(
                () => (Promise.reject(errorMessage))
            );
            store.test(done, planningUi.saveAndUnpublish(data.plannings[1]))
                .then(() => {
                    expect(planningApi.saveAndUnpublish.callCount).toBe(1);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('onAddCoverageClick', () => {
        const publishedNewsItem = {
            _id: 'news1',
            slugline: 'slugger',
            ednote: 'Edit my note!',
            state: 'published',
            _updated: moment('2099-10-13T13:26'),
            task: {
                desk: 'desk2',
                user: 'ident2',
            },
            type: 'picture',
        };

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
        });

        it('unlocks current planning opens the new planning', (done) => {
            store.initialState.planning.currentPlanningId = data.plannings[1]._id;
            store.test(done, planningUi.onAddCoverageClick(
                store.initialState.planning.plannings.p1
            ))
                .then(() => {
                    expect(planningApi.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.args[0]).toEqual([
                        store.initialState.planning.plannings.p2,
                    ]);

                    expect(planningUi.openEditor.callCount).toBe(1);
                    expect(planningUi.openEditor.args[0]).toEqual([
                        store.initialState.planning.plannings.p1,
                        false,
                    ]);

                    done();
                });
        });

        it('creates a new coverage for a non-published news item', (done) => (
            store.test(done, planningUi.onAddCoverageClick(
                store.initialState.planning.plannings.p1
            ))
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: '@@redux-form/CHANGE',
                        payload: {
                            news_coverage_status: {qcode: 'ncostat:int'},
                            assigned_to: {
                                desk: 'desk1',
                                user: 'ident1',
                                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                            },
                            planning: {
                                ednote: 'Edit my note!',
                                g2_content_type: 'text',
                                slugline: 'slugger',
                                scheduled: moment().endOf('day'),
                            },
                        },
                        meta: {
                            form: 'planning',
                            field: 'coverages[3]',
                            persistentSubmitErrors: undefined,
                            touch: undefined,
                        },
                    }]);

                    done();
                })
        ));

        it('creates a new coverage for a published new item', (done) => {
            store.initialState.modal.modalProps.newsItem = publishedNewsItem;
            store.test(done, planningUi.onAddCoverageClick(
                store.initialState.planning.plannings.p1
            ))
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: '@@redux-form/CHANGE',
                        payload: {
                            news_coverage_status: {qcode: 'ncostat:int'},
                            assigned_to: {
                                desk: 'desk2',
                                user: 'ident2',
                                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                            },
                            planning: {
                                ednote: 'Edit my note!',
                                g2_content_type: 'photo',
                                slugline: 'slugger',
                                scheduled: moment('2099-10-13T13:26'),
                            },
                        },
                        meta: {
                            form: 'planning',
                            field: 'coverages[3]',
                            persistentSubmitErrors: undefined,
                            touch: undefined,
                        },
                    }]);

                    done();
                });
        });
    });

    describe('onAddPlanningClick', () => {
        it('converts a news item to a planning item', (done) => {
            const newsItem = {
                _id: 'news1',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                type: 'text',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                abstract: '<p>some abstractions</p>',
                state: 'published',
                _updated: '2019-10-15T10:01:11',
                task: {
                    desk: 'desk3',
                    user: 'ident2',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            };

            store.init();
            store.initialState.workspace.currentDeskId = 'desk1';
            store.initialState.planning.currentPlanningId = 'p1';
            store.initialState.modal = {
                modalType: 'ADD_TO_PLANNING',
                modalProps: {newsItem},
            };
            store.test(done, planningUi.onAddPlanningClick())
                .then(() => {
                    expect(planningApi.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.args[0]).toEqual([data.plannings[0]]);

                    expect(planningUi._openEditor.callCount).toBe(1);
                    expect(planningUi._openEditor.args[0]).toEqual([{
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        subject: 'sub',
                        anpa_category: 'cat',
                        urgency: 3,
                        description_text: 'some abstractions',
                        coverages: [{
                            planning: {
                                g2_content_type: 'text',
                                slugline: 'slugger',
                                ednote: 'Edit my note!',
                                scheduled: '2019-10-15T10:01:11',
                            },
                            news_coverage_status: {qcode: 'ncostat:int'},
                            assigned_to: {
                                desk: 'desk3',
                                user: 'ident2',
                                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                            },
                        }],
                    }]);

                    done();
                });
        });

        it('perpetuate `marked_for_not_publication` flag', (done) => {
            const newsItem = {
                _id: 'news1',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                type: 'text',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                abstract: '<p>some abstractions</p>',
                state: 'published',
                _updated: '2019-10-15T10:01:11',
                task: {
                    desk: 'desk3',
                    user: 'ident2',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
                flags: {marked_for_not_publication: true},
            };

            store.init();
            store.initialState.workspace.currentDeskId = 'desk1';
            store.initialState.planning.currentPlanningId = 'p1';
            store.initialState.modal = {
                modalType: 'ADD_TO_PLANNING',
                modalProps: {newsItem},
            };
            store.test(done, planningUi.onAddPlanningClick())
                .then(() => {
                    expect(planningApi.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.args[0]).toEqual([data.plannings[0]]);

                    expect(planningUi._openEditor.callCount).toBe(1);
                    expect(planningUi._openEditor.args[0]).toEqual([{
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        subject: 'sub',
                        anpa_category: 'cat',
                        urgency: 3,
                        description_text: 'some abstractions',
                        coverages: [{
                            planning: {
                                g2_content_type: 'text',
                                slugline: 'slugger',
                                ednote: 'Edit my note!',
                                scheduled: '2019-10-15T10:01:11',
                            },
                            news_coverage_status: {qcode: 'ncostat:int'},
                            assigned_to: {
                                desk: 'desk3',
                                user: 'ident2',
                                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                            },
                        }],
                        flags: {marked_for_not_publication: true},
                    }]);

                    done();
                });
        });
    });

    describe('createCoverageFromNewsItem', () => {
        it('creates photo coverage from unpublished news item', () => {
            store.initialState.workspace.currentDeskId = 'desk1';
            store.initialState.workspace.currentUserId = 'ident1';
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'picture',
                state: 'draft',
            };

            const coverage = planningUi.createCoverageFromNewsItem(newsItem, store.getState);

            expect(coverage).toEqual({
                planning: {
                    g2_content_type: 'photo',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment().endOf('day'),
                },
                news_coverage_status: {qcode: 'ncostat:int'},
                assigned_to: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            });
        });

        it('creates text coverage from published news item', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'picture',
                state: 'published',
                _updated: '2019-10-15T14:01:11',
                task: {
                    desk: 'desk2',
                    user: 'ident2',
                },
            };

            const coverage = planningUi.createCoverageFromNewsItem(newsItem, store.getState);

            expect(coverage).toEqual({
                planning: {
                    g2_content_type: 'photo',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: '2019-10-15T14:01:11',
                },
                news_coverage_status: {qcode: 'ncostat:int'},
                assigned_to: {
                    desk: 'desk2',
                    user: 'ident2',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            });
        });
    });

    describe('onPlanningFormSave', () => {
        it('calls saveFromPlanning if in the Planning UI', () => {
            store.dispatch(planningUi.onPlanningFormSave(
                data.plannings[0],
                {
                    save: true,
                    publish: true,
                    unpublish: false,
                }
            ));

            expect(planningUi.saveFromPlanning.callCount).toBe(1);
            expect(planningUi.saveFromPlanning.args[0]).toEqual([
                data.plannings[0],
                {
                    save: true,
                    publish: true,
                    unpublish: false,
                },
            ]);
        });

        it('calls saveFromAuthoring if in MODALS.ADD_TO_PLANNING', () => {
            store.initialState.modal = {modalType: 'ADD_TO_PLANNING'};
            store.dispatch(planningUi.onPlanningFormSave(
                data.plannings[0],
                {
                    save: true,
                    publish: true,
                    unpublish: false,
                }
            ));

            expect(planningUi.saveFromAuthoring.callCount).toBe(1);
            expect(planningUi.saveFromAuthoring.args[0]).toEqual([
                data.plannings[0],
                true,
            ]);
        });
    });

    describe('saveFromPlanning', () => {
        beforeEach(() => {
            restoreSinonStub(planningUi.saveFromPlanning);
            sinon.stub(planningUi, 'saveAndPublish');
            sinon.stub(planningUi, 'saveAndUnpublish');
            sinon.stub(planningUi, 'saveAndReloadCurrentAgenda');
            sinon.stub(planningUi, 'publish');
            sinon.stub(planningUi, 'unpublish');
        });

        afterEach(() => {
            restoreSinonStub(planningUi.saveAndPublish);
            restoreSinonStub(planningUi.saveAndUnpublish);
            restoreSinonStub(planningUi.saveAndReloadCurrentAgenda);
            restoreSinonStub(planningUi.publish);
            restoreSinonStub(planningUi.unpublish);
        });

        it('calls appropriate save method', () => {
            store.dispatch(planningUi.saveFromPlanning(data.plannings[0], {
                save: true,
                publish: true,
                unpublish: false,
            }));
            expect(planningUi.saveAndPublish.callCount).toBe(1);
            expect(planningUi.saveAndPublish.args[0]).toEqual([data.plannings[0]]);

            store.dispatch(planningUi.saveFromPlanning(data.plannings[0], {
                save: true,
                publish: false,
                unpublish: true,
            }));
            expect(planningUi.saveAndUnpublish.callCount).toBe(1);
            expect(planningUi.saveAndUnpublish.args[0]).toEqual([data.plannings[0]]);

            store.dispatch(planningUi.saveFromPlanning(data.plannings[0], {
                save: true,
                publish: false,
                unpublish: false,
            }));
            expect(planningUi.saveAndReloadCurrentAgenda.callCount).toBe(1);
            expect(planningUi.saveAndReloadCurrentAgenda.args[0]).toEqual([data.plannings[0]]);

            store.dispatch(planningUi.saveFromPlanning(data.plannings[0], {
                save: false,
                publish: true,
                unpublish: false,
            }));
            expect(planningUi.publish.callCount).toBe(1);
            expect(planningUi.publish.args[0]).toEqual([data.plannings[0]]);

            store.dispatch(planningUi.saveFromPlanning(data.plannings[0], {
                save: false,
                publish: false,
                unpublish: true,
            }));
            expect(planningUi.unpublish.callCount).toBe(1);
            expect(planningUi.unpublish.args[0]).toEqual([data.plannings[0]]);
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

        it('calls either save or saveAndPublish based on args', () => {
            store.dispatch(planningUi.saveFromAuthoring(data.plannings[0], false));
            expect(planningApi.save.callCount).toBe(1);
            expect(planningApi.save.args[0]).toEqual([data.plannings[0]]);

            store.dispatch(planningUi.saveFromAuthoring(data.plannings[0], true));
            expect(planningApi.saveAndPublish.callCount).toBe(1);
            expect(planningApi.saveAndPublish.args[0]).toEqual([data.plannings[0]]);
        });

        it('notifies user if save fails', (done) => {
            restoreSinonStub(planningApi.save);
            sinon.stub(planningApi, 'save').callsFake(() => (Promise.reject(errorMessage)));

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], false))
                .then(() => { /* no-op */ }, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(modalProps.$scope.resolve.callCount).toBe(0);
                    expect(modalProps.$scope.reject.callCount).toBe(1);

                    done();
                });
        });

        it('notifies user if saveAndPublish fails', (done) => {
            restoreSinonStub(planningApi.saveAndPublish);
            sinon.stub(planningApi, 'saveAndPublish').callsFake(
                () => (Promise.reject(errorMessage))
            );

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], true))
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

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], false))
                .then(() => { /* no-op */ }, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(modalProps.$scope.resolve.callCount).toBe(0);
                    expect(modalProps.$scope.reject.callCount).toBe(1);

                    done();
                });
        });

        it('calls link and notifies user of success', (done) => (
            store.test(done, planningUi.saveFromAuthoring(data.plannings[0], false))
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
});
