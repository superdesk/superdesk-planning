import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';
import moment from 'moment';
import {get, map, cloneDeep} from 'lodash';
import {appConfig} from 'appConfig';
import {ItemActionsMenu} from '../components/index';
import * as testData from './testData';
import {planningApi} from '../superdeskApi';

// configure enzyme
Enzyme.configure({adapter: new Adapter()});

Object.assign(appConfig, {
    server: {url: 'http://server.com'},
    model: {dateformat: 'DD/MM/YYYY'},
    shortTimeFormat: 'HH:mm',
    defaultTimezone: 'Australia/Sydney',
});

export const getTestActionStore = () => {
    let store = {
        spies: {
            api: {
                planning: {
                    query: sinon.spy(() => (store.spies.api._query('plannings'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('plannings', ori, item))),
                    getById: sinon.spy((id) => store.spies.api._getById('plannings', id)),
                },
                events_planning_filters: {
                    query: sinon.spy(() => (store.spies.api._query('events_planning_filters'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('events_planning_filters', ori, item))),
                    getById: sinon.spy((id) => store.spies.api._getById('events_planning_filters', id)),
                    getAll: sinon.spy((params) => (store.spies.api._getAll('events_planning_filters', params))),
                    remove: sinon.spy((item) => (store.spies.api._remove('events_planning_filters', item))),
                },
                agenda: {
                    query: sinon.spy(() => (store.spies.api._query('agendas'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('agendas', ori, item))),
                    getById: sinon.spy((id) => store.spies.api._getById('agendas', id)),
                },
                events: {
                    query: sinon.spy(() => (store.spies.api._query('events'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('events', ori, item))),
                    getById: sinon.spy((id) => store.spies.api._getById('events', id)),
                },
                recent_events_template: {
                    query: sinon.spy(() => (store.spies.api._query('recent_events_template'))),
                },
                events_history: {
                    query: sinon.spy(
                        () => (store.spies.api._query('events_history'))
                    ),
                },
                events_duplicate: {},
                planning_history: {
                    query: sinon.spy(
                        () => (store.spies.api._query('planning_history'))
                    ),
                },
                planning_duplicate: {},
                assignments: {
                    query: sinon.spy(() => (store.spies.api._query('assignments'))),
                    save: sinon.spy((ori, item) => (
                        store.spies.api._save('assignments', ori, item
                        ))),
                    getById: sinon.spy((id) => store.spies.api._getById('assignments', id)),
                    remove: sinon.spy((item) => store.spies.api._remove('assignments', item)),
                },
                archive: {
                    getById: sinon.spy((id) => store.spies.api._getById('archive', id)),
                },

                assignments_link: {save: sinon.stub().returns(Promise.resolve({}))},
                assignments_lock: {save: sinon.stub().returns(Promise.resolve())},
                assignments_unlock: {save: sinon.stub().returns(Promise.resolve())},
                assignments_unlink: {save: sinon.stub().returns(Promise.resolve())},

                update: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy(() => (Promise.resolve())),

                _query: (resource) => (Promise.resolve({_items: store.data[resource]})),
                _getAll: (resource) => (Promise.resolve(store.data[resource])),
                _save: (resource, ori, item) => (Promise.resolve({
                    _id: resource[0] + '3',
                    ...ori,
                    ...item,
                })),
                _remove: () => Promise.resolve(),
                _getById: (resource, itemId) => {
                    const item = get(store.data, resource, {}).find((item) => item._id === itemId);

                    if (!item) {
                        return Promise.reject(`Item '${itemId}' not found!`);
                    }

                    return Promise.resolve(item);
                },
                planning_search: {
                    query: sinon.spy(() => (store.spies.api._query('planning_search'))),
                },

                events_planning_search: {
                    query: sinon.spy(() => (store.spies.api._query('events_planning_search'))),
                },

                contacts: {query: sinon.spy(() => Promise.resolve(store.data.contacts))},

                event_autosave: {
                    query: sinon.spy(() => store.spies.api._query('event_autosave')),
                    getById: sinon.spy((id) => store.spies.api._getById('event_autosave', id)),
                    save: sinon.spy((ori, item) => store.spies.api._save('event_autosave', ori, item)),
                    remove: sinon.spy((item) => store.spies.api._remove('event_autosave', item)),
                },

                planning_autosave: {
                    query: sinon.spy(() => store.spies.api._query('planning_autosave')),
                    getById: sinon.spy((id) => store.spies.api._getById('planning_autosave', id)),
                    save: sinon.spy((ori, item) => store.spies.api._save('planning_autosave', ori, item)),
                    remove: sinon.spy((item) => store.spies.api._remove('planning_autosave', item)),
                },
                published_planning: {
                    query: sinon.spy(() => store.spies.api._query('published_planning')),
                },
            },
        },

        data: cloneDeep(testData.items),

        urlParams: {},

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
                onlyActive: false,
            },
            customVocabularies: [],
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

        subscribe: sinon.stub(),

        services: {
            notify: {
                error: sinon.spy(),
                success: sinon.spy(),
                warning: sinon.spy(),
                pop: sinon.spy(),
            },
            $timeout: sinon.spy((func) => func()),
            api: sinon.spy((resource) => (store.spies.api[resource])),
            $location: {search: sinon.spy(
                (key, value = null) => {
                    if (key) {
                        if (value) {
                            store.urlParams[key] = value;
                        } else {
                            delete store.urlParams[key];
                        }
                    }

                    return store.urlParams;
                }),
            },
            desks: {
                getCurrentDeskId: sinon.spy(() => 'desk1'),
                active: {desk: 'desk1'},
                deskMembers: {
                    desk1: [{_id: 'ident1'}],
                    desk2: [{_id: 'ident2'}],
                },
            },
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
                isPersonal: (item) => (get(item, 'task.user') && !get(item, 'task.desk')),
            },
            authoring: {itemActions: () => ({edit: true})},

            authoringWorkspace: {
                edit: sinon.stub(),
                view: sinon.stub(),
            },

            upload: {
                start: sinon.spy((file) => Promise.resolve({
                    data: {_id: file.data.media[0][0]},
                })),
            },

            vocabularies: {
                getVocabularies: () => Promise.resolve(testData.allVocabularies),
            },

            modal: {
                createCustomModal: sinon.spy(() => Promise.resolve({
                    openModal: store.services.modal.openModal,
                    closeModal: store.services.modal.closeModal,
                })),
                openModal: sinon.stub(),
                closeModal: sinon.stub(),
            },

            sdPlanningStore: {
                initWorkspace: sinon.spy(
                    (workspaceName, onLoadWorkspace) => onLoadWorkspace(store)
                ),
            },
        },

        test: (done, action) => {
            if (!store._ready) store.init();
            let response = action(store.dispatch, store.getState, store.services);

            if (!get(response, 'then')) {
                return;
            }

            return response
                .catch((error) => {
                // If this is from a Promise.reject, then pass that on
                    if (get(error, 'stack', null) === null) return Promise.reject(error);
                    // Otherwise this is a js exception
                    expect(error).toBe(null);
                    expect(error.stack).toBe(null);
                    done.fail();
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

            // Set the autosave data
            store.data.event_autosave.forEach((item) => {
                store.initialState.forms.autosaves.event[item._id] = item;
            });
            store.data.planning_autosave.forEach((item) => {
                store.initialState.forms.autosaves.planning[item._id] = item;
            });

            store._ready = true;
        },

        _ready: false,
    };

    store.services.api.update = store.spies.api.update;
    store.services.api.save = store.spies.api.save;

    planningApi.redux = {
        store: {
            dispatch: store.dispatch,
            getState: store.getState,
        },
    };

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

export const waitFor = (test, delay = 50, maxTries = 100) => (
    new Promise((resolve, reject) => {
        let tries = 0;

        const interval = setInterval(() => {
            tries += 1;
            if (test()) {
                clearInterval(interval);
                resolve();
            } else if (tries >= maxTries) {
                reject('waitFor: Maximum retries exceeded');
            }
        }, delay);
    })
);
