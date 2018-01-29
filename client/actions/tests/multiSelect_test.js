import multiSelect from '../multiSelect';
import {getTestActionStore} from '../../utils/testUtils';

describe('actions.events.ui', () => {
    let store;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        data = store.data;
    });

    describe('itemBulkSpikeModal', () => {
        it('shows the spike modal', (done) => (
            store.test(done, multiSelect.itemBulkSpikeModal(data.events))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'CONFIRMATION',
                        modalProps: jasmine.objectContaining(
                            {body: 'Do you want to spike 3 item(s) ?'}
                        ),
                    }]);

                    done();
                })
        ));
    });

    describe('itemBulkUnSpikeModal', () => {
        it('shows the unspike modal', (done) => (
            store.test(done, multiSelect.itemBulkUnSpikeModal(data.events))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'CONFIRMATION',
                        modalProps: jasmine.objectContaining(
                            {body: 'Do you want to unspike 3 item(s) ?'}
                        ),
                    }]);

                    done();
                })
        ));
    });
});