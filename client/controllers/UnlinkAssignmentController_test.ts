import {UnlinkAssignmentController} from './UnlinkAssignmentController';
import {getTestActionStore} from '../utils/testUtils';
import sinon from 'sinon';

describe('UnlinkAssignmentController', () => {
    let store;
    let services;
    let data;

    let scopeData;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
        data.archive[0].assignment_id = 'as1';

        scopeData = {item: data.archive[0]};
    });

    beforeEach(window.module(($provide) => {
        $provide.constant('api', services.api);
        $provide.constant('notify', services.notify);

        $provide.constant('lock', {
            lock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            unlock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            isLockedInCurrentSession: sinon.stub().returns(false),
            isLocked: sinon.stub().returns(false),
        });

        $provide.constant('gettext', sinon.stub().callsFake((str) => str));
    }));

    it('notifies user if failed to load the item', inject((notify, gettext, api, lock) => {
        api('archive').getById = sinon.stub().returns(Promise.reject({}));
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => { /* no-op */ }, () => {
                expect(api('archive').getById.callCount).toBe(1);
                expect(api('archive').getById.args[0]).toEqual([data.archive[0]._id]);

                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Failed to load the item.']);
            });
    }));

    it('notifies user if the item isnt linked to an assignment',
        inject((notify, gettext, api, lock) => {
            delete data.archive[0].assignment_id;
            UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
                .then(() => { /* no-op */ }, () => {
                    expect(notify.error.callCount).toBe(1);
                    expect(notify.error.args[0]).toEqual(['Item not linked to a Planning item.']);
                });
        }
        ));

    it('notifies user if failed to load the assignment', inject((notify, gettext, api, lock) => {
        api('assignments').getById = sinon.stub().returns(Promise.reject({}));
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Failed to load the assignment.']);
            });
    }));

    it('unlinks the item from the assignment', inject((notify, gettext, api, lock) => {
        expect(scopeData.item.assignment_id).toBe('as1');
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => {
                expect(api('archive').getById.callCount).toBe(1);
                expect(api('archive').getById.args[0]).toEqual([data.archive[0]._id]);

                expect(api('assignments').getById.callCount).toBe(1);
                expect(api('assignments').getById.args[0]).toEqual(['as1']);

                expect(lock.lock.callCount).toBe(1);
                expect(lock.lock.args[0]).toEqual([
                    data.archive[0],
                    false,
                    'unlink_assignment',
                ]);

                expect(api('assignments_unlink').save.callCount).toBe(1);
                expect(api('assignments_unlink').save.args[0]).toEqual([
                    {},
                    {
                        assignment_id: 'as1',
                        item_id: data.archive[0]._id,
                    },
                ]);

                expect(scopeData.item.assignment_id).toBe(null);
                expect(notify.success.callCount).toBe(1);
                expect(notify.success.args[0]).toEqual(['Item unlinked from coverage.']);

                expect(lock.unlock.callCount).toBe(1);
                expect(lock.unlock.args[0]).toEqual([data.archive[0]]);
            });
    }));

    it('notifies user if failed to obtain item lock', inject((notify, gettext, api, lock) => {
        lock.lock = sinon.stub().returns(Promise.reject({}));
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Failed to lock the item.']);
            });
    }));

    it('notifies user if unlink failed', inject((notify, gettext, api, lock) => {
        api('assignments_unlink').save = sinon.stub().returns(Promise.reject({}));
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Failed to unlink the item.']);

                expect(lock.unlock.callCount).toBe(1);
                expect(lock.unlock.args[0]).toEqual([data.archive[0]]);
            });
    }));

    it('notifies user if unlock failed', inject((notify, gettext, api, lock) => {
        lock.unlock = sinon.stub().returns(Promise.reject({}));
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Failed to unlock the item.']);
            });
    }));

    it('lock/unlock is not called if the user acts on the locked item', inject((notify, gettext, api, lock) => {
        expect(scopeData.item.assignment_id).toBe('as1');
        lock.isLockedInCurrentSession = sinon.stub().returns(true);
        return UnlinkAssignmentController(scopeData, notify, gettext, api, lock)
            .then(() => {
                expect(api('archive').getById.callCount).toBe(1);
                expect(api('archive').getById.args[0]).toEqual([data.archive[0]._id]);

                expect(api('assignments').getById.callCount).toBe(1);
                expect(api('assignments').getById.args[0]).toEqual(['as1']);

                expect(lock.lock.callCount).toBe(0);
                expect(api('assignments_unlink').save.callCount).toBe(1);
                expect(api('assignments_unlink').save.args[0]).toEqual([
                    {},
                    {
                        assignment_id: 'as1',
                        item_id: data.archive[0]._id,
                    },
                ]);

                expect(scopeData.item.assignment_id).toBe(null);
                expect(notify.success.callCount).toBe(1);
                expect(notify.success.args[0]).toEqual(['Item unlinked from coverage.']);

                expect(lock.unlock.callCount).toBe(0);
            });
    }));
});
