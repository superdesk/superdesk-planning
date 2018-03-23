import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import {main} from '../';
import {AGENDA, MAIN} from '../../constants';
import eventsUi from '../events/ui';
import eventsApi from '../events/api';
import planningUi from '../planning/ui';
import planningApi from '../planning/api';
import eventsPlanningUi from '../eventsPlanning/ui';
import {locks} from '../';

describe('actions.main', () => {
    let store;
    let services;
    let data;
    const errorMessage = {data: {_message: 'Failed!'}};

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
    });

    it('openEditor', () => {
        store.test(null, main.openEditor(data.events[0]));
        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{
            type: 'MAIN_OPEN_EDITOR',
            payload: data.events[0]
        }]);

        expect(services.$location.search.callCount).toBe(1);
        expect(services.$location.search.args[0]).toEqual([
            'edit',
            JSON.stringify({id: 'e1', type: 'event'})
        ]);
    });

    it('closeEditor', () => {
        store.test(null, main.closeEditor());

        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_CLOSE_EDITOR'}]);

        expect(services.$location.search.callCount).toBe(1);
        expect(services.$location.search.args[0]).toEqual([
            'edit',
            null
        ]);
    });

    describe('filter', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'fetchEvents').returns(Promise.resolve());
            sinon.stub(eventsUi, 'clearList');
            sinon.stub(planningUi, 'clearList');
            sinon.stub(eventsPlanningUi, 'clearList');
            sinon.stub(eventsPlanningUi, 'fetch').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.fetchEvents);
            restoreSinonStub(eventsUi.clearList);
            restoreSinonStub(planningUi.clearList);
            restoreSinonStub(eventsPlanningUi.clearList);
            restoreSinonStub(eventsPlanningUi.fetch);
        });

        it('filter combined', (done) => (
            store.test(done, main.filter(MAIN.FILTERS.COMBINED))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MAIN_FILTER',
                        payload: 'COMBINED'
                    }]);
                    expect(store.dispatch.callCount).toBe(7);
                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(3);
                    expect(services.$location.search.args).toEqual(
                        [[], [], ['filter', 'COMBINED']]
                    );

                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(planningUi.clearList.callCount).toBe(1);
                    expect(eventsUi.clearList.callCount).toBe(1);
                    done();
                })
        ));

        it('filter events', (done) => (
            store.test(done, main.filter(MAIN.FILTERS.EVENTS))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MAIN_FILTER',
                        payload: 'EVENTS'
                    }]);

                    expect(store.dispatch.callCount).toBe(7);
                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(3);
                    expect(services.$location.search.args).toEqual(
                        [[], [], ['filter', 'EVENTS']]
                    );

                    expect(planningUi.clearList.callCount).toBe(1);
                    expect(eventsPlanningUi.clearList.callCount).toBe(1);
                    expect(eventsUi.fetchEvents.callCount).toBe(1);

                    done();
                })
        ));

        it('filter planning', (done) => (
            store.test(done, main.filter(MAIN.FILTERS.PLANNING))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MAIN_FILTER',
                        payload: 'PLANNING'
                    }]);

                    expect(store.dispatch.callCount).toBe(15);
                    expect(services.$location.search.args).toEqual(
                        [[], [], ['filter', 'PLANNING'], [], ['searchParams', '{}']]
                    );

                    expect(eventsUi.clearList.callCount).toBe(1);
                    expect(eventsPlanningUi.clearList.callCount).toBe(1);

                    done();
                })
        ));
    });

    describe('unpublish', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'unpublish').returns(Promise.resolve(data.events[0]));
            sinon.stub(planningApi, 'unpublish').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.unpublish);
            restoreSinonStub(planningApi.unpublish);
        });

        it('calls events.ui.unpublish', (done) => (
            store.test(done, main.unpublish(data.events[0], false))
                .then(() => {
                    expect(eventsApi.unpublish.callCount).toBe(1);
                    expect(eventsApi.unpublish.args[0]).toEqual([data.events[0]]);

                    done();
                })
        ));

        it('calls planning.ui.unpublish', (done) => (
            store.test(done, main.unpublish(data.plannings[0]))
                .then(() => {
                    expect(planningApi.unpublish.callCount).toBe(1);
                    expect(planningApi.unpublish.args[0]).toEqual([data.plannings[0]]);

                    done();
                })
        ));

        it('raises an error if the item type was not found', (done) => (
            store.test(done, main.unpublish({}))
                .then(null, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual([
                        'Failed to unpublish, could not find the item type!'
                    ]);

                    done();
                })
        ));
    });

    describe('lockAndEdit', () => {
        beforeEach(() => {
            sinon.spy(main, 'openEditor');
            sinon.spy(main, 'closePreview');
            sinon.stub(locks, 'lock').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(main.openEditor);
            restoreSinonStub(main.closePreview);
            restoreSinonStub(locks.lock);
        });

        it('calls main.openEditor when called with a new item', (done) => (
            store.test(done, main.lockAndEdit({test: 'data'}))
                .then((item) => {
                    expect(item).toEqual({test: 'data'});

                    expect(locks.lock.callCount).toBe(0);
                    expect(main.openEditor.callCount).toBe(1);
                    expect(main.openEditor.args[0]).toEqual([{test: 'data'}]);

                    done();
                })
        ));

        it('calls locks.lock then main.openEditor when called with an existing item', (done) => (
            store.test(done, main.lockAndEdit(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(locks.lock.callCount).toBe(1);
                    expect(locks.lock.args[0]).toEqual([data.events[0]]);

                    expect(main.closePreview.callCount).toBe(0);

                    expect(main.openEditor.callCount).toBe(1);
                    expect(main.openEditor.args[0]).toEqual([data.events[0]]);

                    done();
                })
        ));

        it('closes the preview panel if item being edited is open for preview', (done) => {
            store.init();
            store.initialState.main.previewId = data.events[1]._id;
            store.initialState.main.previewType = data.events[1].type;
            store.test(done, main.lockAndEdit(data.events[1]))
                .then((item) => {
                    expect(item).toEqual(data.events[1]);

                    expect(locks.lock.callCount).toBe(1);
                    expect(locks.lock.args[0]).toEqual([data.events[1]]);

                    expect(main.closePreview.callCount).toBe(1);

                    expect(main.openEditor.callCount).toBe(1);
                    expect(main.openEditor.args[0]).toEqual([data.events[1]]);

                    done();
                });
        });

        it('notifies the user if locking failed', (done) => {
            restoreSinonStub(locks.lock);
            sinon.stub(locks, 'lock').returns(Promise.reject(errorMessage));
            store.test(done, main.lockAndEdit(data.events[2]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);
                    done();
                });
        });
    });

    describe('loadmore', () => {
        beforeEach(() => {
            restoreSinonStub(planningUi.loadMore);
            sinon.stub(eventsUi, 'loadMore').returns(Promise.resolve());
            sinon.stub(planningUi, 'loadMore').returns(Promise.resolve());
            sinon.stub(eventsPlanningUi, 'loadMore').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.loadMore);
            restoreSinonStub(planningUi.loadMore);
            restoreSinonStub(eventsPlanningUi.loadMore);
        });

        it('load more events', (done) => {
            store.test(done, main.loadMore('EVENTS'))
                .then(() => {
                    expect(eventsUi.loadMore.callCount).toBe(1);
                    done();
                });
        });

        it('load more planning', (done) => {
            store.test(done, main.loadMore('PLANNING'))
                .then(() => {
                    expect(planningUi.loadMore.callCount).toBe(1);
                    done();
                });
        });

        it('load more combined', (done) => {
            store.test(done, main.loadMore('COMBINED'))
                .then(() => {
                    expect(eventsPlanningUi.loadMore.callCount).toBe(1);
                    done();
                });
        });
    });

    describe('search', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'fetchEvents').returns(Promise.resolve());
            sinon.stub(planningUi, 'fetchToList').returns(Promise.resolve());
            sinon.stub(eventsPlanningUi, 'fetch').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.fetchEvents);
            restoreSinonStub(planningUi.fetchToList);
            restoreSinonStub(eventsPlanningUi.fetch);
        });

        it('search events', (done) => {
            store.initialState.main.filter = 'EVENTS';
            store.test(done, main.search('EVENTS'))
                .then(() => {
                    expect(eventsUi.fetchEvents.callCount).toBe(1);
                    expect(eventsUi.fetchEvents.args[0]).toEqual([{page: 1, fulltext: 'EVENTS'}]);
                    done();
                });
        });

        it('search planning', (done) => {
            store.initialState.main.filter = 'PLANNING';
            store.test(done, main.search('PLANNING'))
                .then(() => {
                    expect(planningUi.fetchToList.callCount).toBe(1);
                    expect(planningUi.fetchToList.args[0][0].page).toBe(1);
                    expect(planningUi.fetchToList.args[0][0].fulltext).toBe('PLANNING');
                    done();
                });
        });

        it('search combined', (done) => {
            store.initialState.main.filter = 'COMBINED';
            store.test(done, main.search('COMBINED'))
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(eventsPlanningUi.fetch.args[0]).toEqual([{page: 1, fulltext: 'COMBINED'}]);
                    done();
                });
        });
    });

    describe('clearSearch', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'fetchEvents').returns(Promise.resolve());
            sinon.stub(planningUi, 'fetchToList').returns(Promise.resolve());
            sinon.stub(eventsPlanningUi, 'fetch').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.fetchEvents);
            restoreSinonStub(planningUi.fetchToList);
            restoreSinonStub(eventsPlanningUi.fetch);
        });

        it('clear search events', (done) => {
            store.initialState.main.filter = 'EVENTS';
            store.test(done, main.clearSearch())
                .then(() => {
                    expect(eventsUi.fetchEvents.callCount).toBe(1);
                    expect(eventsUi.fetchEvents.args[0]).toEqual([{}]);
                    done();
                });
        });

        it('clear search planning', (done) => {
            store.initialState.main.filter = 'PLANNING';
            store.initialState.agenda.currentAgendaId = AGENDA.FILTER.ALL_PLANNING;
            store.test(done, main.clearSearch())
                .then(() => {
                    expect(planningUi.fetchToList.callCount).toBe(1);
                    expect(planningUi.fetchToList.args[0]).toEqual([{
                        noAgendaAssigned: false,
                        agendas: null,
                        advancedSearch: {},
                        spikeState: 'draft',
                        fulltext: '',
                        page: 1}]);
                    done();
                });
        });

        it('clear search event planning', (done) => {
            store.initialState.main.filter = 'COMBINED';
            store.test(done, main.clearSearch())
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(eventsPlanningUi.fetch.args[0]).toEqual([{}]);
                    done();
                });
        });
    });

    describe('loadItem', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'fetchById').returns(Promise.resolve(data.events[0]));
            sinon.stub(planningApi, 'fetchById').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.fetchById);
            restoreSinonStub(planningApi.fetchById);
        });

        it('loads an Event for preview', (done) => (
            store.test(done, main.loadItem('e1', 'event', 'preview'))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_PREVIEW_LOADING_START'}]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e1']);

                    expect(store.dispatch.args[2]).toEqual([{type: 'MAIN_PREVIEW_LOADING_COMPLETE'}]);

                    done();
                })
        ));

        it('loads an Event for editing', (done) => (
            store.test(done, main.loadItem('e1', 'event', 'edit'))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_EDIT_LOADING_START'}]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e1']);

                    expect(store.dispatch.args[2]).toEqual([{type: 'MAIN_EDIT_LOADING_COMPLETE'}]);

                    done();
                })
        ));

        it('loads an Planning for preview', (done) => (
            store.test(done, main.loadItem('p1', 'planning', 'preview'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_PREVIEW_LOADING_START'}]);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual(['p1']);

                    expect(store.dispatch.args[2]).toEqual([{type: 'MAIN_PREVIEW_LOADING_COMPLETE'}]);

                    done();
                })
        ));

        it('loads an Planning for editing', (done) => (
            store.test(done, main.loadItem('p1', 'planning', 'edit'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_EDIT_LOADING_START'}]);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual(['p1']);

                    expect(store.dispatch.args[2]).toEqual([{type: 'MAIN_EDIT_LOADING_COMPLETE'}]);

                    done();
                })
        ));

        it('fails if unknown action type supplied', (done) => (
            store.test(done, main.loadItem('e1', 'event', 'dummy'))
                .then(null, (error) => {
                    expect(error).toBe('Unknown action "dummy"');
                    expect(store.dispatch.callCount).toBe(0);
                    expect(eventsApi.fetchById.callCount).toBe(0);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Unknown action "dummy"']);

                    done();
                })
        ));

        it('fails if unknown item type supplied', (done) => (
            store.test(done, main.loadItem('e1', 'dummy', 'edit'))
                .then(null, (error) => {
                    expect(error).toBe('Unknown item type "dummy"');
                    expect(store.dispatch.callCount).toBe(0);
                    expect(eventsApi.fetchById.callCount).toBe(0);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Unknown item type "dummy"']);

                    done();
                })
        ));
    });

    describe('openFromURLOrRedux', () => {
        beforeEach(() => {
            sinon.stub(main, 'openPreview');
            sinon.stub(main, 'openEditor');
        });

        afterEach(() => {
            restoreSinonStub(main.openPreview);
            restoreSinonStub(main.openEditor);
        });

        it('loads the preview item from the URL', () => {
            store.init();
            services.$location.search('preview', JSON.stringify({id: 'e1', type: 'event'}));
            store.test(null, main.openFromURLOrRedux('preview'));
            expect(main.openPreview.callCount).toBe(1);
            expect(main.openPreview.args[0]).toEqual([{_id: 'e1', type: 'event'}]);
        });

        it('loads the preview item from the Redux store', () => {
            store.init();
            store.initialState.main.previewId = 'e1';
            store.initialState.main.previewType = 'event';
            store.test(null, main.openFromURLOrRedux('preview'));
            expect(main.openPreview.callCount).toBe(1);
            expect(main.openPreview.args[0]).toEqual([{_id: 'e1', type: 'event'}]);
        });

        it('loads the edit item from the URL', () => {
            store.init();
            services.$location.search('edit', JSON.stringify({id: 'e1', type: 'event'}));
            store.test(null, main.openFromURLOrRedux('edit'));
            expect(main.openEditor.callCount).toBe(1);
            expect(main.openEditor.args[0]).toEqual([{_id: 'e1', type: 'event'}]);
        });

        it('loads the edit item from the Redux store', () => {
            store.init();
            store.initialState.forms.itemId = 'e1';
            store.initialState.forms.itemType = 'event';
            store.test(null, main.openFromURLOrRedux('edit'));
            expect(main.openEditor.callCount).toBe(1);
            expect(main.openEditor.args[0]).toEqual([{_id: 'e1', type: 'event'}]);
        });
    });
});
