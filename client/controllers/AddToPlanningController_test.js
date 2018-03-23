import {AddToPlanningController} from './AddToPlanningController';
import sinon from 'sinon';

describe('AddToPlanningController', () => {
    let scope;
    let newsItem;

    beforeEach(() => {
        newsItem = {
            _id: 'item1',
            slugline: 'slugger',
            urgency: 2,
            subject: [{
                qcode: 'sub1',
                name: 'sub1',
            }],
            anpa_category: [{
                qcode: 'cat1',
                name: 'cat1',
            }],
        };

        scope = {
            locals: {data: {item: newsItem}},
            resolve: sinon.stub().returns(Promise.resolve()),
            reject: sinon.stub().returns(Promise.reject()),
        };
    });

    beforeEach(window.module(($provide) => {
        $provide.constant(
            'api',
            {find: sinon.stub().callsFake(() => Promise.resolve(newsItem))}
        );

        $provide.constant('notify', {
            success: sinon.spy(),
            error: sinon.spy(),
        });

        $provide.constant('lock', {
            lock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            unlock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            isLockedInCurrentSession: sinon.stub().returns(false),
        });

        $provide.constant('session', {sessionId: 'session1'});

        $provide.constant('userList', {getUser: sinon.spy()});

        $provide.constant('sdPlanningStore', {getStore: sinon.spy()});

        $provide.constant('gettext', sinon.stub().callsFake((str) => str));
    }));

    beforeEach(inject(($q, $rootScope) => {
        spyOn($rootScope, '$broadcast').and.callThrough();
    }));

    it('notifies the user if failed to load the item', inject((
        $location,
        sdPlanningStore,
        $q,
        notify,
        gettext,
        api,
        lock,
        session,
        userList
    ) => {
        api.find = sinon.stub().returns($q.reject({}));
        return AddToPlanningController(null,
            scope, $location, sdPlanningStore, $q, notify,
            gettext, api, lock, session, userList
        )
            .then(() => { /* no-op */ }, () => {
                expect(api.find.callCount).toBe(1);
                expect(api.find.args[0]).toEqual(['archive', 'item1']);

                expect(notify.error.callCount).toBe(2);
                expect(notify.error.args[0]).toEqual(['Failed to load the item.']);
            });
    }));

    it('notifies the user if the item fails data validation', inject((
        $location,
        sdPlanningStore,
        $q,
        notify,
        gettext,
        api,
        lock,
        session,
        userList
    ) => {
        delete newsItem.slugline;
        delete newsItem.urgency;
        delete newsItem.subject;
        delete newsItem.anpa_category;

        return AddToPlanningController(null,
            scope, $location, sdPlanningStore, $q, notify,
            gettext, api, lock, session, userList
        )
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(4);
                expect(notify.error.args[0]).toEqual(['[SLUGLINE] is a required field']);
                expect(notify.error.args[1]).toEqual(['[URGENCY] is a required field']);
                expect(notify.error.args[2]).toEqual(['[SUBJECT] is a required field']);
                expect(notify.error.args[3]).toEqual(['[CATEGORY] is a required field']);
            });
    }));

    it('notifies the user if the item is already linked to an assignment', inject((
        $location,
        sdPlanningStore,
        $q,
        notify,
        gettext,
        api,
        lock,
        session,
        userList
    ) => {
        newsItem.assignment_id = 'as1';
        return AddToPlanningController(null,
            scope, $location, sdPlanningStore, $q, notify,
            gettext, api, lock, session, userList
        )
            .then(() => { /* no-op */ }, () => {
                expect(notify.error.callCount).toBe(1);
                expect(notify.error.args[0]).toEqual(['Item already linked to a Planning item']);
            });
    }));

    describe('locks the item', () => {
        it('if item not locked', inject((
            $location,
            sdPlanningStore,
            $q,
            notify,
            gettext,
            api,
            lock,
            session,
            userList
        ) => (
            AddToPlanningController(null,
                scope, $location, sdPlanningStore, $q, notify,
                gettext, api, lock, session, userList
            )
                .then(() => {
                    expect(lock.isLockedInCurrentSession.callCount).toBe(1);
                    expect(lock.isLockedInCurrentSession.args[0]).toEqual([newsItem]);

                    expect(lock.lock.callCount).toBe(1);
                    expect(lock.lock.args[0]).toEqual([
                        newsItem,
                        false,
                        'add_to_planning',
                    ]);
                })
        )));
    });
});