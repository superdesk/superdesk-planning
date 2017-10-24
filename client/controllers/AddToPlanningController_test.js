import { AddToPlanningController } from './AddToPlanningController'
import sinon from 'sinon'

describe('AddToPlanningController', () => {
    let scope
    let newsItem

    beforeEach(() => {
        newsItem = {
            _id: 'item1',
            slugline: 'slugger',
            urgency: 2,
        }

        scope = {
            locals: { data: { item: newsItem } },
            resolve: sinon.stub().returns(Promise.resolve()),
            reject: sinon.stub().returns(Promise.reject()),
        }
    })

    beforeEach(window.module(($provide) => {
        $provide.constant(
            'api',
            { find: sinon.stub().callsFake(() => Promise.resolve(newsItem)) }
        )

        $provide.constant('notify', {
            success: sinon.spy(),
            error: sinon.spy(),
        })

        $provide.constant('lock', {
            lock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            unlock: sinon.stub().callsFake((item) => Promise.resolve(item)),
            isLockedInCurrentSession: sinon.stub().returns(false),
        })

        $provide.constant('session', { sessionId: 'session1' })

        $provide.constant('userList', { getUser: sinon.spy() })

        $provide.constant('sdPlanningStore', { getStore: sinon.spy() })

        $provide.constant('gettext', sinon.stub().callsFake((str) => str))
    }))

    beforeEach(inject(($q, $rootScope) => {
        spyOn($rootScope, '$broadcast').and.callThrough()
    }))

    it('notifies the user if failed to load the item', inject((
        $controller,
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
        api.find = sinon.stub().returns($q.reject({}))
        return AddToPlanningController(
            scope, $location, sdPlanningStore, $q, notify,
            gettext, api, lock, session, userList
        )
        .then(() => {}, () => {
            expect(api.find.callCount).toBe(1)
            expect(api.find.args[0]).toEqual(['archive', 'item1'])

            expect(notify.error.callCount).toBe(2)
            expect(notify.error.args[0]).toEqual(['Failed to load the item.'])
        })
    }))

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
        newsItem.assignment_id = 'as1'
        delete newsItem.slugline
        delete newsItem.urgency
        return AddToPlanningController(
            scope, $location, sdPlanningStore, $q, notify,
            gettext, api, lock, session, userList
        )
        .then(() => {}, () => {
            expect(notify.error.callCount).toBe(3)

            expect(notify.error.args[0]).toEqual(['Item already linked to a Planning item'])
            expect(notify.error.args[1]).toEqual(['[SLUGLINE] is a required field'])
            expect(notify.error.args[2]).toEqual(['[URGENCY] is a required field'])
        })
    }))

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
            AddToPlanningController(
                scope, $location, sdPlanningStore, $q, notify,
                gettext, api, lock, session, userList
            )
            .then(() => {
                expect(lock.isLockedInCurrentSession.callCount).toBe(1)
                expect(lock.isLockedInCurrentSession.args[0]).toEqual([newsItem])

                expect(lock.lock.callCount).toBe(1)
                expect(lock.lock.args[0]).toEqual([
                    newsItem,
                    false,
                    'add_to_planning',
                ])
            })
        )))
    })
})
