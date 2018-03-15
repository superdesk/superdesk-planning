import sinon from 'sinon';
import * as actions from '../agenda';
import {PRIVILEGES} from '../../constants';
import {createTestStore, registerNotifications} from '../../utils';
import {cloneDeep} from 'lodash';
import * as selectors from '../../selectors';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import planningUi from '../../actions/planning/ui';

describe('agenda', () => {
    describe('actions', () => {
        let agendas;
        let plannings;
        let events;
        let initialState;
        const getState = () => (initialState);
        const dispatch = sinon.spy((action) => {
            if (typeof action === 'function') {
                return action(dispatch, getState, {
                    notify,
                    api,
                    $timeout,
                    $location,
                });
            }

            return action;
        });
        const notify = {
            error: sinon.spy(),
            success: sinon.spy(),
            pop: sinon.spy(),
        };
        const $timeout = sinon.spy((func) => func());
        const $location = {search: sinon.spy()};

        let api;
        let apiSpy;

        beforeEach(() => {
            notify.error.resetHistory();
            notify.success.resetHistory();
            dispatch.resetHistory();
            $timeout.resetHistory();

            api = () => (apiSpy);

            agendas = [
                {
                    _id: 'a1',
                    name: 'TestAgenda',
                    is_enabled: true,
                },
                {
                    _id: 'a2',
                    name: 'TestAgenda2',
                    is_enabled: true,
                },
            ];

            plannings = [{
                _id: 'p1',
                slugline: 'Planning 1',
            }];

            events = [{
                _id: 'e1',
                name: 'Event1',
                definition_short: 'Some event',
                slugline: 'Slugger',
                subject: '123',
                anpa_category: 'abc',
                dates: {start: '2016-10-15T13:01:11'},
                internal_note: 'internal note',
            }];

            initialState = {
                agenda: {
                    agendas: agendas,
                    currentAgendaId: 'a2',
                },
                planning: {
                    plannings: plannings,
                    search: {currentSearch: undefined},
                },
                events: {events},
                privileges: {
                    planning: 1,
                    planning_agenda_management: 1,
                    planning_planning_management: 1,
                },
            };

            apiSpy = {
                query: sinon.spy(() => (Promise.resolve())),
                remove: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy((ori, item) => (Promise.resolve({
                    _id: 'a3',
                    ...ori,
                    ...item,
                }))),
            };
        });

        describe('createOrUpdateAgenda', () => {
            const item = {name: 'TestAgenda3'};
            const action = actions.createOrUpdateAgenda({name: item.name});

            it('createOrUpdateAgenda saves and executes dispatches', (done) => {
                initialState.privileges.planning_agenda_management = 1;
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                    .then(() => {
                        expect(apiSpy.save.args[0]).toEqual([{}, item]);
                        expect(notify.success.args[0]).toEqual(['The agenda has been created/updated.']);
                        expect(dispatch.args[1]).toEqual([{
                            type: 'ADD_OR_REPLACE_AGENDA',
                            payload: {
                                _id: 'a3',
                                name: item.name,
                            },
                        }]);

                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });

            it('createOrUpdateAgenda raises ACCESS_DENIED without permission', (done) => {
                initialState.privileges.planning_agenda_management = 0;
                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                    .catch(() => {
                        expect($timeout.callCount).toBe(1);
                        expect(notify.error.args[0][0]).toBe(
                            'Unauthorised to create or update an agenda!'
                        );
                        expect(dispatch.args[0]).toEqual([{
                            type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                            payload: {
                                action: '_createOrUpdateAgenda',
                                permission: PRIVILEGES.AGENDA_MANAGEMENT,
                                errorMessage: 'Unauthorised to create or update an agenda!',
                                args: [item],
                            },
                        }]);

                        done();
                    });
            });
        });

        it('fetchAgendas', (done) => {
            apiSpy.query = sinon.spy(() => (Promise.resolve({_items: agendas})));
            const action = actions.fetchAgendas();

            return action(dispatch, getState, {
                api,
                notify,
            })
                .then(() => {
                    expect(apiSpy.query.callCount).toBe(1);
                    expect(dispatch.callCount).toBe(2);

                    expect(dispatch.args[0]).toEqual([{type: 'REQUEST_AGENDAS'}]);

                    expect(dispatch.args[1]).toEqual([{
                        type: 'RECEIVE_AGENDAS',
                        payload: agendas,
                    }]);

                    done();
                })
                .catch((error) => {
                    expect(error).toBe(null);
                    expect(error.stack).toBe(null);
                    done();
                });
        });

        describe('deleteAgenda', () => {
            it('can be deleted if user has permission', (done) => {
                initialState.privileges.planning_agenda_management = 1;
                const action = actions.deleteAgenda(agendas[0]);

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then(() => {
                        expect(apiSpy.remove.callCount).toBe(1);
                        expect(notify.success.callCount).toBe(1);
                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });

            it('raises ACCESS_DENIED without permission', (done) => {
                initialState.privileges.planning_agenda_management = 0;
                const action = actions.deleteAgenda(agendas[0]);

                return action(dispatch, getState, {
                    api,
                    notify,
                    $timeout,
                })
                    .catch(() => {
                        expect(notify.error.args[0][0]).toBe(
                            'Unauthorised to delete an agenda!'
                        );
                        expect(dispatch.args[0]).toEqual([{
                            type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                            payload: {
                                action: '_deleteAgenda',
                                permission: PRIVILEGES.AGENDA_MANAGEMENT,
                                errorMessage: 'Unauthorised to delete an agenda!',
                                args: [agendas[0]],
                            },
                        }]);

                        done();
                    });
            });

            it('remove agenda call fails', (done) => {
                initialState.privileges.planning_agenda_management = 1;
                apiSpy.remove = sinon.spy(() => (Promise.reject({ })));
                const action = actions.deleteAgenda(agendas[0]);

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then(() => {
                        expect(apiSpy.remove.callCount).toBe(1);
                        expect(notify.error.callCount).toBe(1);
                        expect(notify.error.args[0][0]).toBe(
                            'There was a problem, agenda could not be deleted.'
                        );
                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });
        });

        describe('fetchAgendaById', () => {
            it('calls api.getById and runs dispatches', (done) => {
                apiSpy.getById = sinon.spy(() => Promise.resolve(agendas[1]));
                const action = actions.fetchAgendaById('a2');

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then((agenda) => {
                        expect(agenda).toEqual(agendas[1]);
                        expect(apiSpy.getById.callCount).toBe(1);
                        expect(apiSpy.getById.args[0]).toEqual(['a2']);
                        expect(dispatch.callCount).toBe(1);
                        expect(dispatch.args[0]).toEqual([{
                            type: 'ADD_OR_REPLACE_AGENDA',
                            payload: agendas[1],
                        }]);
                        expect(notify.error.callCount).toBe(0);

                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });

            it('notifies end user if an error occurred', (done) => {
                apiSpy.getById = sinon.spy(() => Promise.reject());
                const action = actions.fetchAgendaById('a2');

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then(() => {
                        expect(dispatch.callCount).toBe(0);
                        expect(notify.error.callCount).toBe(1);
                        expect(notify.error.args[0]).toEqual(['Failed to fetch an Agenda!']);

                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });
        });

        describe('selectAgenda', () => {
            let store;
            let services;

            beforeEach(() => {
                store = getTestActionStore();
                services = store.services;

                sinon.stub(planningUi, 'fetchToList').callsFake(() => (Promise.resolve()));
            });

            afterEach(() => {
                restoreSinonStub(planningUi.fetchToList);
            });

            it('calls `planning.ui.fetchToList`', (done) => {
                store.initialState.main.search.PLANNING.fulltext = 'hello world';
                return store.test(done, actions.selectAgenda('a1'))
                    .then(() => {
                        expect(store.dispatch.args[0]).toEqual([{
                            type: 'SELECT_AGENDA',
                            payload: 'a1',
                        }]);

                        expect(services.$location.search.callCount).toBe(2);
                        expect(services.$location.search.args).toEqual([
                            ['agenda', 'a1'],
                            ['searchParams', '{}']
                        ]);

                        expect(planningUi.fetchToList.callCount).toBe(1);
                        expect(planningUi.fetchToList.args[0]).toEqual([
                            {
                                noAgendaAssigned: false,
                                agendas: ['a1'],
                                page: 1,
                                advancedSearch: {},
                                spikeState: 'draft',
                                fulltext: 'hello world'
                            },
                        ]);

                        done();
                    });
            });
        });

        describe('addEventToCurrentAgenda', () => {
            it('addEventToCurrentAgenda executes dispatches', (done) => {
                apiSpy.query = sinon.spy(() => (Promise.resolve({_items: plannings})));
                events[0].place = [{
                    country: 'Australia',
                    group: 'Australia',
                    name: 'ACT',
                    qcode: 'ACT',
                    state: 'Australian Capital Territory',
                    world_region: 'Oceania'
                }];
                events[0].ednote = 'Editorial note about this Event';
                const action = actions.addEventToCurrentAgenda(events[0]);

                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                    .then(() => {
                        expect(apiSpy.save.callCount).toBe(1);
                        expect(apiSpy.save.args[0]).toEqual([
                            {},
                            {
                                event_item: events[0]._id,
                                planning_date: events[0].dates.start,
                                slugline: events[0].slugline,
                                headline: events[0].name,
                                subject: events[0].subject,
                                anpa_category: events[0].anpa_category,
                                description_text: 'Some event',
                                agendas: [],
                                place: [{
                                    country: 'Australia',
                                    group: 'Australia',
                                    name: 'ACT',
                                    qcode: 'ACT',
                                    state: 'Australian Capital Territory',
                                    world_region: 'Oceania'
                                }],
                                internal_note: 'internal note',
                                ednote: 'Editorial note about this Event'
                            },
                        ]);

                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });

            it('addEventToCurrentAgenda raises ACCESS_DENIED without permission', (done) => {
                initialState.privileges.planning_planning_management = 0;
                const action = actions.addEventToCurrentAgenda(events[0]);

                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                    .catch(() => {
                        expect($timeout.callCount).toBe(1);
                        expect(notify.error.callCount).toBe(1);
                        expect(notify.error.args[0]).toEqual([
                            'Unauthorised to create a new planning item!',
                        ]);
                        expect(dispatch.callCount).toBe(1);
                        expect(dispatch.args[0]).toEqual([{
                            type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                            payload: {
                                action: '_addEventToCurrentAgenda',
                                permission: PRIVILEGES.PLANNING_MANAGEMENT,
                                errorMessage: 'Unauthorised to create a new planning item!',
                                args: [events[0]],
                            },
                        }]);

                        done();
                    });
            });

            it('addEventToCurrentAgenda raises error if no Agenda is selected', (done) => {
                initialState.agenda.currentAgendaId = null;
                const action = actions.addEventToCurrentAgenda(events[0]);

                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                    .catch(() => {
                        expect(notify.error.args[0]).toEqual(['You have to select an agenda first']);
                        done();
                    });
            });

            it('addEventToCurrentAgenda raises error if the Event is spiked', (done) => {
                events[0].state = 'spiked';
                const action = actions.addEventToCurrentAgenda(events[0]);

                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                    .catch(() => {
                        expect(notify.error.args[0]).toEqual([
                            'Cannot create a Planning item from a spiked event!',
                        ]);
                        done();
                    });
            });

            it('addEventToCurrentAgenda if the agenda is disabled', (done) => {
                apiSpy.query = sinon.spy(() => (Promise.resolve({_items: plannings})));
                agendas[1].is_enabled = false;
                const action = actions.addEventToCurrentAgenda(events[0]);

                return action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                    .then(() => {
                        expect(apiSpy.save.callCount).toBe(1);
                        done();
                    });
            });
        });

        describe('fetchSelectedAgendaPlannings', () => {
            let store;

            beforeEach(() => {
                store = getTestActionStore();
                sinon.stub(planningUi, 'clearList').callsFake(() => ({type: 'MOCK'}));
                sinon.stub(planningUi, 'fetchToList').callsFake(() => (Promise.resolve()));
            });

            afterEach(() => {
                restoreSinonStub(planningUi.clearList);
                restoreSinonStub(planningUi.fetchToList);
            });

            it('clears the list if no agenda id is selected', (done) => {
                store.initialState.agenda.currentAgendaId = undefined;
                store.test(done, actions.fetchSelectedAgendaPlannings())
                    .then(() => {
                        expect(planningUi.clearList.callCount).toBe(1);
                        expect(planningUi.fetchToList.callCount).toBe(0);
                        done();
                    });
            });

            it('fetches planning items for the agenda', (done) => {
                store.initialState.main.search.PLANNING.fulltext = 'hello world';
                store.test(done, actions.fetchSelectedAgendaPlannings())
                    .then(() => {
                        expect(planningUi.clearList.callCount).toBe(0);
                        expect(planningUi.fetchToList.callCount).toBe(1);
                        expect(planningUi.fetchToList.args[0]).toEqual([{
                            noAgendaAssigned: false,
                            agendas: ['a1'],
                            page: 1,
                            advancedSearch: {},
                            spikeState: 'draft',
                            fulltext: 'hello world'
                        }]);
                        done();
                    });
            });

            it('fetches planning items for no agenda assigned', (done) => {
                store.initialState.agenda.currentAgendaId = 'NO_AGENDA_ASSIGNED';
                store.test(done, actions.fetchSelectedAgendaPlannings())
                    .then(() => {
                        expect(planningUi.clearList.callCount).toBe(0);
                        expect(planningUi.fetchToList.callCount).toBe(1);
                        expect(planningUi.fetchToList.args[0]).toEqual([{
                            noAgendaAssigned: true,
                            agendas: null,
                            page: 1,
                            advancedSearch: {},
                            spikeState: 'draft',
                            fulltext: ''
                        }]);
                        done();
                    });
            });
        });
    });

    describe('websocket', () => {
        const initialState = {
            agenda: {
                agendas: [{
                    _id: '1',
                    name: 'agenda',
                }],
            },
        };
        const newAgenda = {
            _id: '2',
            name: 'NewAgenda',
        };

        let store;
        let spyGetById;
        let $rootScope;

        beforeEach(inject((_$rootScope_) => {
            $rootScope = _$rootScope_;

            spyGetById = sinon.spy(() => newAgenda);
            store = createTestStore({
                initialState: cloneDeep(initialState),
                extraArguments: {apiGetById: spyGetById},
            });

            registerNotifications($rootScope, store);
            $rootScope.$digest();
        }));

        it('`agenda:created` adds the Agenda to the store', (done) => {
            $rootScope.$broadcast('agenda:created', {item: '2'});

            // Expects run in setTimeout to give the event listeners a chance to execute
            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1);
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '2',
                ]);

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'agenda',
                    },
                    {
                        _id: '2',
                        name: 'NewAgenda',
                    },
                ]);
                done();
            }, 0);
        });

        it('`agenda:updated` updates the Agenda in the store', (done) => {
            newAgenda._id = '1';
            $rootScope.$broadcast('agenda:created', {item: '1'});

            // Expects run in setTimeout to give the event listeners a chance to execute
            setTimeout(() => {
                expect(spyGetById.callCount).toBe(1);
                expect(spyGetById.args[0]).toEqual([
                    'agenda',
                    '1',
                ]);

                expect(selectors.getAgendas(store.getState())).toEqual([
                    {
                        _id: '1',
                        name: 'NewAgenda',
                    },
                ]);

                done();
            }, 0);
        });
    });
});
