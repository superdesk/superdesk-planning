import planningUi from '../ui';
import planningApi from '../api';
import assignmentApi from '../../assignments/api';
import {main, locks} from '../../';
import sinon from 'sinon';
import {MAIN, WORKSPACE} from '../../../constants';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {planningUtils} from '../../../utils';

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
        sinon.stub(planningApi, 'lock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningApi, 'unlock').callsFake(() => (Promise.resolve(data.plannings[0])));
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
        sinon.stub(main, 'openForEdit');
        sinon.stub(locks, 'lock').callsFake((item) => (Promise.resolve(item)));
    });

    afterEach(() => {
        restoreSinonStub(planningApi.spike);
        restoreSinonStub(planningApi.unspike);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(planningApi.refetch);
        restoreSinonStub(planningApi.save);
        restoreSinonStub(planningApi.lock);
        restoreSinonStub(planningApi.unlock);

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
        restoreSinonStub(main.openForEdit);
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

                    // Notifies end user of success
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'The Planning Item(s) has been spiked.',
                    ]);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));

        it('ui.spike closes editor if item is open', (done) => {
            store.initialState.planning.currentPlanningId = data.plannings[1]._id;
            return store.test(done, planningUi.spike(data.plannings[1]))
                .then(() => {
                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
        ).catch(done.fail));

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
                })
                .catch(done.fail);
        });
    });

    describe('save', () => {
        it('saves and reloads planning items', (done) => (
            store.test(done, planningUi.save(
                data.plannings[1],
                {slugline: 'New Slugger'}
            ))
                .then((item) => {
                    expect(item).toEqual(data.plannings[1]);

                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([
                        data.plannings[1],
                        {slugline: 'New Slugger'},
                    ]);

                    done();
                })
                .catch(done.fail))
        );

        it('on save fail notifies the end user', (done) => {
            restoreSinonStub(planningApi.save);
            sinon.stub(planningApi, 'save').callsFake(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, planningUi.save(data.plannings[1], {}))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                })
                .catch(done.fail);
        });

        it('calls saveFromAuthoring if in AUTHORING workspace', () => {
            store.initialState.workspace.currentWorkspace = WORKSPACE.AUTHORING;
            store.dispatch(planningUi.save(data.plannings[0]));

            expect(planningUi.saveFromAuthoring.callCount).toBe(1);
            expect(planningUi.saveFromAuthoring.args[0][0]).toEqual(data.plannings[0]);
        });
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
            })
            .catch(done.fail);
    });

    it('loadMore with data fetched less than page size', (done) => {
        store.initialState.main.filter = MAIN.FILTERS.PLANNING;
        store.initialState.main.search.PLANNING.totalItems = 50;
        store.initialState.main.search.PLANNING.lastRequestParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 1,
        };

        restoreSinonStub(planningUi.loadMore);
        restoreSinonStub(planningApi.fetch);
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        const expectedParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 2,
        };

        store.test(done, planningUi.loadMore())
            .then(() => {
                expect(planningUi.requestPlannings.callCount).toBe(0);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([expectedParams]);

                expect(planningUi.addToList.callCount).toBe(1);
                expect(planningUi.addToList.args[0]).toEqual([['p1', 'p2']]);

                done();
            })
            .catch(done.fail);
    });

    it('loadMore with data fetched equal to page size', (done) => {
        store.initialState.main.filter = MAIN.FILTERS.PLANNING;
        store.initialState.main.search.PLANNING.totalItems = MAIN.PAGE_SIZE * 2;
        store.initialState.main.search.PLANNING.lastRequestParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 1,
        };

        restoreSinonStub(planningUi.loadMore);
        restoreSinonStub(planningApi.fetch);
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(Array.from(Array(MAIN.PAGE_SIZE).keys())))
        );

        const expectedParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 2,
        };

        store.test(done, planningUi.loadMore())
            .then(() => {
                expect(planningUi.requestPlannings.callCount).toBe(1);
                expect(planningUi.requestPlannings.args[0]).toEqual([expectedParams]);

                expect(planningApi.fetch.callCount).toBe(1);
                expect(planningApi.fetch.args[0]).toEqual([expectedParams]);

                expect(planningUi.addToList.callCount).toBe(1);

                done();
            })
            .catch(done.fail);
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
            store.initialState.forms.editors.panel.itemId = 'p2';
            store.initialState.forms.editors.panel.itemType = 'planning';
            store.test(done, planningUi.onAddCoverageClick(
                store.initialState.planning.plannings.p1
            ))
                .then(() => {
                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([
                        store.initialState.planning.plannings.p2,
                    ]);

                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([store.initialState.planning.plannings.p1]);
                    done();
                })
                .catch(done.fail);
        });

        afterEach(() => {
            restoreSinonStub(locks.unlock);
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
            store.dispatch(planningUi.saveFromAuthoring(
                data.plannings[0],
                {...data.plannings[0], slugline: 'New Slugger'}
            ));

            expect(planningApi.save.callCount).toBe(1);
            expect(planningApi.save.args[0]).toEqual([
                data.plannings[0],
                {...data.plannings[0], slugline: 'New Slugger'},
            ]);
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
                })
                .catch(done.fail);
        });

        it('notifies user if link fails', (done) => {
            restoreSinonStub(assignmentApi.link);
            sinon.stub(assignmentApi, 'link').callsFake(
                () => (Promise.reject(errorMessage))
            );

            store.test(done, planningUi.saveFromAuthoring(data.plannings[0]))
                .then(() => { /* no-op */ }, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    expect(modalProps.$scope.resolve.callCount).toBe(0);
                    expect(modalProps.$scope.reject.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });

        it('calls link and notifies user of success', (done) => (
            store.test(done, planningUi.saveFromAuthoring(
                data.plannings[0],
                {...data.plannings[0], slugline: 'New Slugger'}
            ))
                .then(() => {
                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([
                        data.plannings[0],
                        {...data.plannings[0], slugline: 'New Slugger'},
                    ]);

                    expect(assignmentApi.link.callCount).toBe(1);
                    expect(assignmentApi.link.args[0]).toEqual([
                        {
                            user: 'ident1',
                            desk: 'desk2',
                            assignment_id: 'as2',
                            state: 'draft',
                        },
                        {
                            _id: 'news1',
                            slugline: 'slug',
                            ednote: 'edit my note',
                            type: 'picture',
                            state: 'draft',
                        },
                        false,
                    ]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual([
                        'Content linked to the planning item.',
                    ]);

                    expect(modalProps.$scope.resolve.callCount).toBe(1);
                    expect(modalProps.$scope.reject.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));
    });

    describe('duplicate', () => {
        afterEach(() => {
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

                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0][0]).toEqual(data.plannings[0]);

                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });
    });

    describe('assignToAgenda', () => {
        beforeEach(() => {
            sinon.stub(planningUi, 'save').callsFake(
                (item, updates) => Promise.resolve({...item, ...updates})
            );
            sinon.stub(locks, 'unlock').callsFake((item) => (Promise.resolve(item)));
        });

        afterEach(() => {
            restoreSinonStub(planningUi.save);
            restoreSinonStub(locks.unlock);
        });

        it('assignToAgenda adds and agenda to planning item and calls save and unlocks item', (done) => {
            const planningWithAgenda = {
                ...data.plannings[0],
                agendas: ['a1'],
            };

            return store.test(done, planningUi.assignToAgenda(data.plannings[0], data.agendas[0]))
                .then(() => {
                    expect(planningUi.save.callCount).toBe(1);
                    expect(planningUi.save.args[0]).toEqual([
                        data.plannings[0],
                        planningWithAgenda,
                    ]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(
                        ['Agenda assigned to the planning item.']);

                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([planningUtils.modifyForClient(planningWithAgenda)]);

                    done();
                })
                .catch(done.fail);
        });
    });

    it('addCoverageToWorkflow', (done) => {
        const modifiedPlanning = planningUtils.modifyForClient(data.plannings[0]);
        const coverage = {
            ...modifiedPlanning.coverages[0],
            news_coverage_status: {
                name: 'Coverage intended',
                label: 'Planned',
                qcode: 'ncostat:int',
            },
        };

        store.test(done, planningUi.addCoverageToWorkflow(
            data.plannings[0],
            {
                ...coverage,
                planning: {
                    ...coverage.planning,
                    internal_note: 'Please cover this',
                    g2_content_type: 'photo',
                },
            },
            0
        ))
            .then(() => {
                expect(planningApi.save.callCount).toBe(1);
                expect(planningApi.save.args[0]).toEqual([
                    data.plannings[0],
                    {
                        coverages: [
                            {
                                ...coverage,
                                planning: {
                                    ...coverage.planning,
                                    internal_note: 'Please cover this',
                                    g2_content_type: 'photo',
                                },
                                workflow_status: 'active',
                                assigned_to: {
                                    ...coverage.assigned_to,
                                    state: 'assigned',
                                },
                            },
                            modifiedPlanning.coverages[1],
                            modifiedPlanning.coverages[2],
                        ],
                    },
                ]);

                done();
            })
            .catch(done.fail);
    });
});
