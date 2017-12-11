import sinon from 'sinon';
import moment from 'moment';
import {get, map, cloneDeep} from 'lodash';
import {PRIVILEGES} from '../constants';
import {ItemActionsMenu} from '../components/index';
import * as testData from './testData';

export const getTestActionStore = () => {
    let store = {
        spies: {
            api: {
                planning: {
                    query: sinon.spy(() => (store.spies.api._query('plannings'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('plannings', ori, item))),
                    getById: sinon.spy((id) => {
                        const planning = store.data.plannings.find((p) => (p._id === id));

                        if (!planning) {
                            return Promise.reject(`Planning '${id}' not found!`);
                        }

                        return Promise.resolve(planning);
                    }),
                },
                agenda: {
                    query: sinon.spy(() => (store.spies.api._query('agendas'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('agendas', ori, item))),
                    getById: sinon.spy((id) => {
                        const agenda = store.data.agendas.find((a) => (a._id === id));

                        if (!agenda) {
                            return Promise.reject(`Agenda '${id}' not found!`);
                        }

                        return Promise.resolve(agenda);
                    }),
                },
                events: {
                    query: sinon.spy(() => (store.spies.api._query('events'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('events', ori, item))),
                    getById: sinon.spy((id) => {
                        const event = store.data.events.find((e) => (e._id === id));

                        if (!event) {
                            return Promise.reject(`Event '${id}' not found!`);
                        }




                        return Promise.resolve(event);
                    }),
                },
                events_history: {
                    query: sinon.spy(
                        () => (store.spies.api._query('events_history'))
                    ),
                },
                planning_history: {
                    query: sinon.spy(
                        () => (store.spies.api._query('planning_history'))
                    ),
                },
                assignments: {
                    query: sinon.spy(() => (store.spies.api._query('assignments'))),
                    save: sinon.spy((ori, item) => (
                        store.spies.api._save('assignments', ori, item
                        ))),
                    getById: sinon.spy((id) => {
                        const assignment = store.data.assignments.find((p) => (p._id === id));

                        if (!assignment) {
                            return Promise.reject(`Assignment '${id}' not found!`);
                        }

                        return Promise.resolve(assignment);
                    }),
                    remove: sinon.spy((item) => store.spies.api._remove('assignments', item)),
                },
                archive: {
                    getById: sinon.spy((id) => {
                        const item = store.data.archive.find((i) => i._id === id);

                        if (!item) {
                            return Promise.reject(`Item '${id}' not found!`);
                        }

                        return Promise.resolve(item);
                    }),
                },

                assignments_link: {save: sinon.stub().returns(Promise.resolve({}))},
                assignments_lock: {save: sinon.stub().returns(Promise.resolve())},
                assignments_unlock: {save: sinon.stub().returns(Promise.resolve())},
                assignments_unlink: {save: sinon.stub().returns(Promise.resolve())},

                update: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy(() => (Promise.resolve())),

                _query: (resource) => (Promise.resolve({_items: store.data[resource]})),
                _save: (resource, ori, item) => (Promise.resolve({
                    _id: resource[0] + '3',
                    ...ori,
                    ...item,
                })),
                _remove: () => Promise.resolve(),
            },
        },

        data: cloneDeep(testData.items),

        initialState: {
            ...cloneDeep(testData.initialState),
            agenda: {
                agendas: [],
                currentAgendaId: 'a1',
            },
            planning: {
                plannings: {},
                currentPlanningId: undefined,
                editorOpened: false,
                planningsAreLoading: false,
                onlyFuture: true,
                onlyActive: false,
                lastRequestParams: {
                    agendas: ['a1'],
                    noAgendaAssigned: false,
                    page: 1,
                },
                search: {currentSearch: undefined},
            },
        },

        getState: sinon.spy(() => (store.initialState)),

        dispatch: sinon.spy((action) => {
            if (typeof action === 'function') {
                return action(
                    store.dispatch,
                    store.getState,
                    store.services
                );
            }

            return action;
        }),

        services: {
            notify: {
                error: sinon.spy(),
                success: sinon.spy(),
                pop: sinon.spy(),
            },
            $timeout: sinon.spy((func) => func()),
            api: sinon.spy((resource) => (store.spies.api[resource])),
            $location: {search: sinon.spy(() => (Promise.resolve()))},
            desks: {getCurrentDeskId: sinon.spy(() => 'desk1')},
            superdesk: {intent: sinon.spy(() => (Promise.resolve()))},
            lock: {
                isLocked: (item) => {
                    if (!item) {
                        return false;
                    }

                    return !!item.lock_user && !store.services.lock.isLockedInCurrentSession(item);
                },

                isLockedInCurrentSession: (item) => (
                    !!item.lock_session &&
                    item.lock_session === store.initialState.session.sessionId
                ),
            },

            archiveService: {
                isPersonal: (item) => (get(item, 'task.user') && !get(item, 'task.desk'))
            },
            authoring: {itemActions: () => ({edit: true})},

            authoringWorkspace: {
                edit: sinon.stub(),
                view: sinon.stub(),
            }
        },

        test: (done, action) => {
            if (!store._ready) store.init();
            return action(store.dispatch, store.getState, store.services)
                .catch((error) => {
                // If this is from a Promise.reject, then pass that on
                    if (get(error, 'stack', null) === null) return Promise.reject(error);
                    // Otherwise this is a js exception
                    expect(error).toBe(null);
                    expect(error.stack).toBe(null);
                    done();
                    throw error;
                });
        },

        init: () => {
            // Construct store.initialValues from store.data as it would be in
            // the redux store
            store.data.plannings.forEach((item) => {
                store.initialState.planning.plannings[item._id] = item;
            });
            store.data.events.forEach((item) => {
                store.initialState.events.events[item._id] = {
                    ...item,
                    dates: {
                        ...item.dates,
                        start: moment(item.dates.start),
                        end: moment(item.dates.end),
                    },
                };
            });
            store.initialState.agenda.agendas = store.data.agendas;

            store.data.assignments.forEach((item) => {
                store.initialState.assignment.assignments[item._id] = {
                    ...item,
                    planning: {
                        ...item.planning,
                        scheduled: moment(item.planning.scheduled),
                    },
                };
            });
            store._ready = true;
        },

        _ready: false,
    };

    store.services.api.update = store.spies.api.update;
    store.services.api.save = store.spies.api.save;

    return store;
};

export const restoreSinonStub = (obj) => {
    if (typeof obj === 'function' && typeof obj.restore === 'function' && obj.restore.sinon) {
        obj.restore();
    }
};

export const convertEventDatesToMoment = (events) => {
    events.forEach((e) => {
        e.dates.start = moment(e.dates.start);
        e.dates.end = moment(e.dates.end);
    });
    return events;
};

export const expectAccessDenied = ({store, permission, action, errorMessage, args, argPos = 0}) => {
    expect(store.services.$timeout.callCount).toBe(1);

    expect(store.services.notify.error.callCount).toBe(1);
    expect(store.services.notify.error.args[0]).toEqual([errorMessage]);

    expect(store.dispatch.args[argPos]).toEqual([{
        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
        payload: {
            action,
            permission,
            errorMessage,
            args,
        },
    }]);
};

export const itemActionExists = (wrapper, label) => {
    if (wrapper.find('.icon-dots-vertical').length === 0) return false;
    const itemActions = wrapper.find(ItemActionsMenu);

    return !!itemActions.props().actions.find((a) => a.label === label);
};

export const clickItemAction = (wrapper, icon) => {
    const itemActions = wrapper.find(ItemActionsMenu);

    itemActions.find('.dropdown__toggle').simulate('click');
    itemActions.find(icon).parent()
        .simulate('click');
};

export const expectActions = (itemActions, expectedActions) => {
    expect(itemActions.length).toBe(
        expectedActions.length,
        `\n\t[${map(itemActions, 'label')}]\n\t[${expectedActions}]`
    );

    for (let i = 0; i < expectedActions.length; i++) {
        expect(expectedActions[i]).toBe(itemActions[i].label);
    }
};