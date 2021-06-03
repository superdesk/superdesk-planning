import sinon from 'sinon';
import moment from 'moment';

import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import {removeAutosaveFields, modifyForClient} from '../../utils';
import {main} from '../';
import {AGENDA, POST_STATE} from '../../constants';
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

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
    });

    describe('closeEditor', () => {
        it('closes panel editor', () => {
            store.test(null, main.closeEditor());

            expect(store.dispatch.callCount).toBe(3);
            expect(store.dispatch.args[0]).toEqual([{
                type: 'MAIN_CLOSE_EDITOR',
                payload: false,
            }]);

            expect(services.$location.search.callCount).toBe(1);
            expect(services.$location.search.args[0]).toEqual([
                'edit',
                null,
            ]);
        });

        it('closes modal editor', () => {
            store.test(null, main.closeEditor(true));

            expect(store.dispatch.callCount).toBe(3);
            expect(store.dispatch.args[0]).toEqual([{
                type: 'MAIN_CLOSE_EDITOR',
                payload: true,
            }]);

            expect(services.$location.search.callCount).toBe(0);
        });
    });

    describe('post', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'post').returns(Promise.resolve(data.events[0]));
            sinon.stub(planningApi, 'post').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.post);
            restoreSinonStub(planningApi.post);
        });

        it('calls events.ui.post', (done) => (
            store.test(done, main.post(data.events[0], {}, false))
                .then(() => {
                    expect(eventsApi.post.callCount).toBe(1);
                    expect(eventsApi.post.args[0]).toEqual([
                        data.events[0],
                        {pubstatus: POST_STATE.USABLE},
                    ]);

                    done();
                })
                .catch(done.fail)
        ));

        it('calls planning.ui.post', (done) => (
            store.test(done, main.post(data.plannings[0]))
                .then(() => {
                    expect(planningApi.post.callCount).toBe(1);
                    expect(planningApi.post.args[0]).toEqual([
                        data.plannings[0],
                        {pubstatus: POST_STATE.USABLE},
                    ]);

                    done();
                })
                .catch(done.fail)
        ));

        it('raises an error on post if the item type was not found', (done) => (
            store.test(done, main.post({}))
                .then(null, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual([
                        'Failed to post, could not find the item type!',
                    ]);

                    done();
                })
                .catch(done.fail)
        ));
    });

    describe('unpost', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'unpost').returns(Promise.resolve(data.events[0]));
            sinon.stub(planningApi, 'unpost').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.unpost);
            restoreSinonStub(planningApi.unpost);
        });

        it('calls events.ui.unpost', (done) => (
            store.test(done, main.unpost(data.events[0], {}, false))
                .then(() => {
                    expect(eventsApi.unpost.callCount).toBe(1);
                    expect(eventsApi.unpost.args[0]).toEqual([
                        data.events[0],
                        {pubstatus: POST_STATE.CANCELLED},
                    ]);

                    done();
                })
                .catch(done.fail)
        ));

        it('calls planning.ui.unpost', (done) => (
            store.test(done, main.unpost(data.plannings[0]))
                .then(() => {
                    expect(planningApi.unpost.callCount).toBe(1);
                    expect(planningApi.unpost.args[0]).toEqual([
                        data.plannings[0],
                        {pubstatus: POST_STATE.CANCELLED},
                    ]);

                    done();
                })
                .catch(done.fail)
        ));

        it('raises an error on unpost if the item type was not found', (done) => (
            store.test(done, main.unpost({}))
                .then(null, () => {
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual([
                        'Failed to unpost, could not find the item type!',
                    ]);

                    done();
                })
                .catch(done.fail)
        ));
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
                })
                .catch(done.fail);
        });

        it('load more planning', (done) => {
            store.test(done, main.loadMore('PLANNING'))
                .then(() => {
                    expect(planningUi.loadMore.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('load more combined', (done) => {
            store.test(done, main.loadMore('COMBINED'))
                .then(() => {
                    expect(eventsPlanningUi.loadMore.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('search planning', (done) => {
            store.initialState.main.filter = 'PLANNING';
            store.test(done, main.search('PLANNING'))
                .then(() => {
                    expect(planningUi.fetchToList.callCount).toBe(1);
                    expect(planningUi.fetchToList.args[0][0].page).toBe(1);
                    expect(planningUi.fetchToList.args[0][0].fulltext).toBe('PLANNING');
                    done();
                })
                .catch(done.fail);
        });

        it('search combined', (done) => {
            store.initialState.main.filter = 'COMBINED';
            store.test(done, main.search('COMBINED'))
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(eventsPlanningUi.fetch.args[0]).toEqual([{page: 1, fulltext: 'COMBINED'}]);
                    done();
                })
                .catch(done.fail);
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
                    expect(eventsUi.fetchEvents.args[0]).toEqual([{
                        noCalendarAssigned: false,
                        calendars: null,
                        advancedSearch: {},
                        spikeState: 'draft',
                        fulltext: '',
                        filter_id: undefined,
                        page: 1,
                    }]);
                    done();
                })
                .catch(done.fail);
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
                        excludeRescheduledAndCancelled: false,
                        page: 1,
                        filter_id: undefined,
                    }]);
                    done();
                })
                .catch(done.fail);
        });

        it('clear search event planning', (done) => {
            store.initialState.main.filter = 'COMBINED';
            store.test(done, main.clearSearch())
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(eventsPlanningUi.fetch.args[0]).toEqual([{
                        advancedSearch: {},
                        page: 1,
                        fulltext: '',
                        spikeState: 'draft',
                        filter_id: null,
                    }]);
                    done();
                })
                .catch(done.fail);
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

                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_PREVIEW_LOADING_START'}]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e1', {force: false}]);

                    expect(store.dispatch.args[3]).toEqual([{type: 'MAIN_PREVIEW_LOADING_COMPLETE'}]);

                    done();
                }, done.fail)
        ));

        it('loads an Event for editing', (done) => (
            store.test(done, main.loadItem('e1', 'event', 'edit'))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_EDIT_LOADING_START'}]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e1', {force: false}]);

                    expect(store.dispatch.args[3]).toEqual([{type: 'MAIN_EDIT_LOADING_COMPLETE'}]);

                    done();
                }, done.fail)
        ));

        it('loads an Planning for preview', (done) => (
            store.test(done, main.loadItem('p1', 'planning', 'preview'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_PREVIEW_LOADING_START'}]);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual(['p1', {force: false}]);

                    expect(store.dispatch.args[3]).toEqual([{type: 'MAIN_PREVIEW_LOADING_COMPLETE'}]);

                    done();
                }, done.fail)
        ));

        it('loads an Planning for editing', (done) => (
            store.test(done, main.loadItem('p1', 'planning', 'edit'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_EDIT_LOADING_START'}]);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual(['p1', {force: false}]);

                    expect(store.dispatch.args[3]).toEqual([{type: 'MAIN_EDIT_LOADING_COMPLETE'}]);

                    done();
                }, done.fail)
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
        ).catch(done.fail));

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
        ).catch(done.fail));
    });

    describe('openFromURLOrRedux', () => {
        beforeEach(() => {
            sinon.stub(main, 'openPreview');
            sinon.stub(main, 'openForEdit');
        });

        afterEach(() => {
            restoreSinonStub(main.openPreview);
            restoreSinonStub(main.openForEdit);
        });

        it('loads the preview item from the URL', (done) => {
            store.init();
            services.$location.search('preview', JSON.stringify({id: 'e1', type: 'event'}));
            store.test(done, main.openFromURLOrRedux('preview'))
                .then(() => {
                    expect(main.openPreview.callCount).toBe(1);
                    expect(main.openPreview.args[0]).toEqual([{
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    }]);

                    done();
                }, done.fail);
        });

        it('loads the preview item from the Redux store', (done) => {
            store.init();
            store.initialState.main.previewId = 'e1';
            store.initialState.main.previewType = 'event';
            store.test(done, main.openFromURLOrRedux('preview'))
                .then(() => {
                    expect(main.openPreview.callCount).toBe(1);
                    expect(main.openPreview.args[0]).toEqual([{
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    }]);

                    done();
                }, done.fail);
        });

        it('loads the edit item from the URL', (done) => {
            store.init();
            services.$location.search('edit', JSON.stringify({id: 'e1', type: 'event'}));
            store.test(done, main.openFromURLOrRedux('edit'))
                .then(() => {
                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([{
                        _id: 'e1',
                        type: 'event',
                    }]);

                    done();
                }, done.fail);
        });

        it('loads the edit item from the Redux store', (done) => {
            store.init();
            store.initialState.forms.editors.panel.itemId = 'e1';
            store.initialState.forms.editors.panel.itemType = 'event';
            store.test(done, main.openFromURLOrRedux('edit'))
                .then(() => {
                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([{
                        _id: 'e1',
                        type: 'event',
                    }]);

                    done();
                }, done.fail);
        });
    });

    describe('openActionModalFromEditor', () => {
        let actionCallback;

        beforeEach(() => {
            actionCallback = sinon.stub().returns(Promise.resolve());
            sinon.stub(locks, 'unlock').callsFake((item) => Promise.resolve(item));
            // sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
            sinon.stub(main, 'openForEdit');
            sinon.stub(main, 'saveAutosave').callsFake((item) => Promise.resolve(item));
            sinon.stub(main, 'openIgnoreCancelSaveModal').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(locks.unlock);
            // restoreSinonStub(main.lockAndEdit);
            restoreSinonStub(main.openForEdit);
            restoreSinonStub(main.saveAutosave);
            restoreSinonStub(main.openIgnoreCancelSaveModal);
        });

        it('directly runs the action if the item is not locked', (done) => (
            store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback))
                .then(() => {
                    expect(actionCallback.callCount).toBe(1);
                    expect(actionCallback.args[0]).toEqual([data.events[0], null, false, false]);

                    done();
                })
        ).catch(done.fail));

        it('unlocks and runs action if there is no autosave data', (done) => {
            store.init();
            // Test running action with a lock
            store.initialState.locks.event = {
                [data.events[0]._id]: {
                    item_id: data.events[0]._id,
                    user: 'ident1',
                    item_type: 'event',
                    action: 'edit',
                },
            };

            return store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback))
                .then(() => {
                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([data.events[0]]);

                    expect(actionCallback.callCount).toBe(1);
                    expect(actionCallback.args[0]).toEqual([
                        modifyForClient(data.events[0]),
                        store.initialState.locks.event.e1,
                        false,
                        false,
                    ]);

                    // Test running action with a lock and an empty autosave data
                    store.initialState.forms.autosaves.event = {
                        e1: removeAutosaveFields(store.initialState.events.events['e1']),
                    };
                    return store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback));
                })
                .then(() => {
                    expect(locks.unlock.callCount).toBe(2);
                    expect(locks.unlock.args[1]).toEqual([data.events[0]]);

                    expect(actionCallback.callCount).toBe(2);
                    expect(actionCallback.args[1]).toEqual([
                        modifyForClient(data.events[0]),
                        store.initialState.locks.event.e1,
                        false,
                        false,
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('runs openIgnoreCancelSaveModal when open in the Editor', (done) => {
            store.init();
            store.initialState.locks.event = {
                [data.events[0]._id]: {
                    item_id: data.events[0]._id,
                    user: 'ident1',
                    item_type: 'event',
                    action: 'edit',
                },
            };

            store.initialState.forms.autosaves.event = {
                e1: {
                    _id: 'e1',
                    slugline: 'New Slugline',
                },
            };

            store.initialState.forms.editors.panel.itemId = data.events[0]._id;

            return store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback))
                .then(() => {
                    expect(main.openIgnoreCancelSaveModal.callCount).toBe(1);
                    expect(main.openIgnoreCancelSaveModal.args[0]).toEqual([{
                        itemId: data.events[0]._id,
                        itemType: data.events[0].type,
                        onCancel: jasmine.any(Function),
                        onIgnore: jasmine.any(Function),
                        onGoTo: null,
                        onSave: null,
                        onSaveAndPost: null,
                        autoClose: false,
                        title: 'title',
                    }]);

                    done();
                })
                .catch(done.fail);
        });

        it('runs openIgnoreCancelSaveModal when open in the EditorModal', (done) => {
            store.init();
            store.initialState.locks.event = {
                [data.events[0]._id]: {
                    item_id: data.events[0]._id,
                    user: 'ident1',
                    item_type: 'event',
                    action: 'edit',
                },
            };

            store.initialState.forms.autosaves.event = {
                e1: {
                    _id: 'e1',
                    slugline: 'New Slugline',
                },
            };

            store.initialState.forms.editors.panel.itemId = null;
            store.initialState.forms.editors.modal.itemId = data.events[0]._id;

            return store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback))
                .then(() => {
                    expect(main.openIgnoreCancelSaveModal.callCount).toBe(1);
                    expect(main.openIgnoreCancelSaveModal.args[0]).toEqual([{
                        itemId: data.events[0]._id,
                        itemType: data.events[0].type,
                        onCancel: jasmine.any(Function),
                        onIgnore: jasmine.any(Function),
                        onGoTo: null,
                        onSave: null,
                        onSaveAndPost: null,
                        autoClose: false,
                        title: 'title',
                    }]);

                    done();
                })
                .catch(done.fail);
        });

        it('runs openIgnoreCancelSaveModal when item minimised', (done) => {
            store.init();
            store.initialState.locks.event = {
                [data.events[0]._id]: {
                    item_id: data.events[0]._id,
                    user: 'ident1',
                    item_type: 'event',
                    action: 'edit',
                },
            };

            store.initialState.forms.autosaves.event = {
                e1: {
                    _id: 'e1',
                    slugline: 'New Slugline',
                },
            };

            store.initialState.forms.editors.panel.itemId = null;
            store.initialState.forms.editors.modal.itemId = null;

            return store.test(done, main.openActionModalFromEditor(data.events[0], 'title', actionCallback))
                .then(() => {
                    expect(main.openIgnoreCancelSaveModal.callCount).toBe(1);
                    expect(main.openIgnoreCancelSaveModal.args[0]).toEqual([{
                        itemId: data.events[0]._id,
                        itemType: data.events[0].type,
                        onCancel: jasmine.any(Function),
                        onIgnore: jasmine.any(Function),
                        onGoTo: jasmine.any(Function),
                        onSave: null,
                        onSaveAndPost: null,
                        autoClose: false,
                        title: 'title',
                    }]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('saveAutosave', () => {
        beforeEach(() => {
            sinon.stub(main, 'save').callsFake((original, updates) => Promise.resolve({...original, ...updates}));
        });

        afterEach(() => {
            restoreSinonStub(main.save);
        });

        it('Does not save if there are no unsaved changes', (done) => (
            store.test(done, main.saveAutosave(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);
                    expect(main.save.callCount).toBe(0);

                    done();
                })
                .catch(done.fail))
        );

        it('Autosaves a Planning item', (done) => {
            store.init();
            store.initialState.forms.autosaves.planning = {
                p1: {
                    _id: 'p1',
                    slugline: 'New Slugline',
                },
            };

            return store.test(done, main.saveAutosave(data.plannings[0]))
                .then((item) => {
                    expect(item).toEqual({
                        ...data.plannings[0],
                        slugline: 'New Slugline',
                    });

                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        data.plannings[0],
                        {
                            ...data.plannings[0],
                            slugline: 'New Slugline',
                        },
                        true,
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('Autosaves an Event', (done) => {
            store.init();
            store.initialState.forms.autosaves.event = {
                e1: {
                    _id: 'e1',
                    slugline: 'New Slugline',
                },
            };

            return store.test(done, main.saveAutosave(data.events[0], false, 'all'))
                .then((item) => {
                    expect(item).toEqual({
                        ...data.events[0],
                        slugline: 'New Slugline',
                        update_method: 'all',
                    });

                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        data.events[0],
                        {
                            ...data.events[0],
                            slugline: 'New Slugline',
                            update_method: 'all',
                        },
                        false,
                    ]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('publishqueuePreview', () => {
        beforeEach(() => {
            sinon.stub(main, 'openPreview').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(main.openPreview);
        });

        it('fetch planning version', (done) => {
            const queueItem = {
                _id: 123,
                item_id: 'e1',
                item_version: 12,
                content_type: 'event',
            };

            store.init();

            return store.test(done, main.fetchQueueItem(queueItem))
                .then((item) => {
                    expect(item._id).toEqual('queueitem--e1--12');
                    expect(store.spies.api.published_planning.query.callCount).toBe(1);
                    expect(store.dispatch.args[0][0].type).toEqual('ADD_EVENTS');
                    done();
                })
                .catch(done.fail);
        });

        it('fetch planning version and open preview', (done) => {
            const queueItem = {
                _id: 123,
                item_id: 'e1',
                item_version: 12,
                content_type: 'event',
            };

            store.init();
            store.test(done, main.fetchQueueItemAndPreview(queueItem))
                .then(() => {
                    expect(main.openPreview.callCount).toBe(1);
                    expect(store.spies.api.published_planning.query.callCount).toBe(1);
                    expect(store.dispatch.args[1][0].type).toEqual('ADD_EVENTS');
                    done();
                })
                .catch(done.fail);
        });

        it('fetch planning version for store and open preview', (done) => {
            const queueItem = {
                _id: 123,
                item_id: 'e1',
                item_version: 12,
                content_type: 'event',
            };

            store.init();
            store.initialState.events.events['queueitem--e1--12'] = data.events[0];
            store.test(done, main.fetchQueueItemAndPreview(queueItem))
                .then(() => {
                    expect(main.openPreview.callCount).toBe(1);
                    expect(store.spies.api.published_planning.query.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('saveAndUnlockItem', () => {
        beforeEach(() => {
            sinon.stub(planningUi, 'save').callsFake((item) => (Promise.resolve(item)));
            sinon.stub(eventsUi, 'saveWithConfirmation').callsFake((item) => (Promise.resolve(item)));
            sinon.stub(locks, 'unlock').callsFake((item) => (Promise.resolve(item)));
        });

        it('saves and unlocks planning item', (done) =>
            store.test(done, main.saveAndUnlockItem(data.plannings[0], {
                ...data.plannings[0],
                slugline: 'New Slugger',
            }))
                .then(() => {
                    expect(planningUi.save.callCount).toBe(1);
                    expect(planningUi.save.args[0]).toEqual([
                        data.plannings[0],
                        {...data.plannings[0], slugline: 'New Slugger'},
                    ]);

                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([modifyForClient(data.plannings[0])]);

                    done();
                })
                .catch(done.fail)
        );

        it('saves and unlocks event', (done) =>
            store.test(done, main.saveAndUnlockItem(data.events[0], {slugline: 'New Slugger'}))
                .then(() => {
                    expect(eventsUi.saveWithConfirmation.callCount).toBe(1);
                    expect(eventsUi.saveWithConfirmation.args[0]).toEqual([
                        data.events[0],
                        {slugline: 'New Slugger'},
                        false,
                        false,
                    ]);

                    expect(locks.unlock.callCount).toBe(1);
                    expect(locks.unlock.args[0]).toEqual([modifyForClient(data.events[0])]);

                    done();
                })
                .catch(done.fail)
        );

        afterEach(() => {
            restoreSinonStub(planningUi.save);
            restoreSinonStub(locks.unlock);
            restoreSinonStub(eventsUi.saveWithConfirmation);
        });
    });
});
