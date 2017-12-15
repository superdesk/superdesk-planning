import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';

import {main} from '../';
import {MAIN} from '../../constants';

import eventsUi from '../events/ui';
import planningUi from '../planning/ui';

describe('actions.main', () => {
    let store;
    let services;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
    });

    it('edit', () => {
        store.dispatch(main.edit(data.events[0]));

        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{
            type: 'MAIN_EDIT',
            payload: data.events[0]
        }]);
    });

    it('cancel', () => {
        store.dispatch(main.cancel());

        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{
            type: 'MAIN_EDIT',
            payload: null
        }]);
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
});
