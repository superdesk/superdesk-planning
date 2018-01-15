import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';

import {main} from '../';
import {MAIN} from '../../constants';

import eventsUi from '../events/ui';
import planningUi from '../planning/ui';
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
        store.dispatch(main.openEditor(data.events[0]));

        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{
            type: 'MAIN_OPEN_EDITOR',
            payload: data.events[0]
        }]);
    });

    it('closeEditor', () => {
        store.dispatch(main.closeEditor());

        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{type: 'MAIN_CLOSE_EDITOR'}]);
    });

    describe('filter', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'fetchEvents').returns(Promise.resolve());
            sinon.stub(eventsUi, 'clearList');
            sinon.stub(planningUi, 'clearList');
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.fetchEvents);
            restoreSinonStub(eventsUi.clearList);
            restoreSinonStub(planningUi.clearList);
        });

        it('filter combined', (done) => (
            store.test(done, main.filter(MAIN.FILTERS.COMBINED))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MAIN_FILTER',
                        payload: 'COMBINED'
                    }]);

                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(1);
                    expect(services.$location.search.args[0]).toEqual(['filter', 'COMBINED']);

                    done();
                })
        ));

        it('filter events', (done) => (
            store.test(done, main.filter(MAIN.FILTERS.EVENTS))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MAIN_FILTER',
                        payload: 'EVENTS'
                    }]);

                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(2);
                    expect(services.$location.search.args).toEqual([
                        ['filter', 'EVENTS'],
                        []
                    ]);

                    expect(planningUi.clearList.callCount).toBe(1);
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

                    expect(eventsUi.clearList.callCount).toBe(1);

                    done();
                })
        ));
    });

    describe('unpublish', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'unpublish').returns(Promise.resolve(data.events[0]));
            sinon.stub(planningUi, 'unpublish').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.unpublish);
            restoreSinonStub(planningUi.unpublish);
        });

        it('calls events.ui.unpublish', (done) => (
            store.test(done, main.unpublish(data.events[0]))
                .then(() => {
                    expect(eventsUi.unpublish.callCount).toBe(1);
                    expect(eventsUi.unpublish.args[0]).toEqual([data.events[0]]);

                    done();
                })
        ));

        it('calls planning.ui.unpublish', (done) => (
            store.test(done, main.unpublish(data.plannings[0]))
                .then(() => {
                    expect(planningUi.unpublish.callCount).toBe(1);
                    expect(planningUi.unpublish.args[0]).toEqual([data.plannings[0]]);

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
            store.initialState.main.previewItem = data.events[1];
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
});
