import sinon from 'sinon'
import moment from 'moment'
import { get, map } from 'lodash'
import { PRIVILEGES } from '../constants'
import { ItemActionsMenu } from '../components/index'

export const getTestActionStore = () => {
    let store = {
        spies: {
            api: {
                planning: {
                    query: sinon.spy(() => (store.spies.api._query('plannings'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('plannings', ori, item))),
                    getById: sinon.spy((id) => {
                        const planning = store.data.plannings.find((p) => (p._id === id))
                        if (!planning) {
                            return Promise.reject(`Planning '${id}' not found!`)
                        }

                        return Promise.resolve(planning)
                    }),
                },
                agenda: {
                    query: sinon.spy(() => (store.spies.api._query('agendas'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('agendas', ori, item))),
                    getById: sinon.spy((id) => {
                        const agenda = store.data.agendas.find((a) => (a._id === id))
                        if (!agenda) {
                            return Promise.reject(`Agenda '${id}' not found!`)
                        }

                        return Promise.resolve(agenda)
                    }),
                },
                events: {
                    query: sinon.spy(() => (store.spies.api._query('events'))),
                    save: sinon.spy((ori, item) => (store.spies.api._save('events', ori, item))),
                    getById: sinon.spy((id) => {
                        const event = store.data.events.find((e) => (e._id === id))
                        if (!event) {
                            return Promise.reject(`Event '${id}' not found!`)
                        }

                        return Promise.resolve(event)
                    }),
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
                        const assignment = store.data.assignments.find((p) => (p._id === id))
                        if (!assignment) {
                            return Promise.reject(`Assignment '${id}' not found!`)
                        }

                        return Promise.resolve(assignment)
                    }),
                },

                assignments_link: { save: sinon.stub().returns(Promise.resolve()) },

                update: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy(() => (Promise.resolve())),

                _query: (resource) => (Promise.resolve({ _items: store.data[resource] })),
                _save: (resource, ori, item) => (Promise.resolve({
                    _id: resource[0] + '3',
                    ...ori,
                    ...item,
                })),
            },
        },

        data: {
            events: [
                {
                    _id: 'e1',
                    name: 'Event 1',
                    dates: {
                        start: '2016-10-15T13:01:11',
                        end: '2016-10-15T14:01:11',
                    },
                    planning_ids: ['p2'],
                    _etag: 'e123',
                },
                {
                    _id: 'e2',
                    name: 'Event 2',
                    dates: {
                        start: '2014-10-15T14:01:11',
                        end: '2014-10-15T15:01:11',
                    },
                    planning_ids: [],
                },
                {
                    _id: 'e3',
                    name: 'Event 3',
                    dates: {
                        start: '2015-10-15T14:01:11',
                        end: '2015-10-15T15:01:11',
                    },
                },
            ],
            plannings: [
                {
                    _id: 'p1',
                    slugline: 'Planning1',
                    headline: 'Some Plan 1',
                    coverages: [
                        {
                            coverage_id: 'c1',
                            planning_item: 'p1',
                            planning: {
                                ednote: 'Text coverage',
                                scheduled: '2016-10-15T13:01:11',
                                g2_content_type: 'text',
                            },
                            assigned_to: {
                                user: 'ident1',
                                desk: 'desk1',
                                assignment_id: 'as1',
                            },
                            firstcreated: '2017-10-01T14:01:11',
                        },
                        {
                            coverage_id: 'c2',
                            planning_item: 'p1',
                            planning: {
                                ednote: 'Photo coverage',
                                scheduled: '2016-10-15T14:01:11',
                                g2_content_type: 'photo',
                            },
                            assigned_to: {
                                user: 'ident1',
                                desk: 'desk2',
                                assignment_id: 'as2',
                            },
                            firstcreated: '2017-10-02T14:01:11',
                        },
                        {
                            coverage_id: 'c3',
                            planning_item: 'p1',
                            planning: {
                                ednote: 'Video coverage',
                                scheduled: '2016-10-15T16:01:11',
                                g2_content_type: 'video',
                            },
                            firstcreated: '2017-10-03T14:01:11',
                        },
                    ],
                    agendas: [],
                },
                {
                    _id: 'p2',
                    slugline: 'Planning2',
                    headline: 'Some Plan 2',
                    event_item: 'e1',
                    coverages: [
                        {
                            coverage_id: 'c4',
                            planning_item: 'p2',
                            planning: {
                                ednote: 'Video coverage',
                                scheduled: '2016-10-15T13:01:11',
                                g2_content_type: 'video',
                            },
                        },
                    ],
                    agendas: ['a2'],
                },
            ],
            assignments: [
                {
                    _id: 'as1',
                    coverage_id: 'c1',
                    planning_item: 'p1',
                    assigned_to: {
                        user: 'ident1',
                        desk: 'desk1',
                    },
                    planning: {
                        ednote: 'Text coverage',
                        scheduled: '2016-10-15T13:01:11',
                        g2_content_type: 'text',
                    },
                },
                {
                    _id: 'as2',
                    coverage_id: 'c2',
                    planning_item: 'p1',
                    assigned_to: {
                        user: 'ident1',
                        desk: 'desk2',
                    },
                    planning: {
                        ednote: 'Photo coverage',
                        scheduled: '2016-10-15T14:01:11',
                        g2_content_type: 'photo',
                    },
                },
            ],
            agendas: [
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
                {
                    _id: 'a3',
                    name: 'TestAgenda3',
                    is_enabled: false,
                },
            ],
            planning_history: [
                {
                    _id: 'ph1',
                    _created: '2017-06-19T02:21:42+0000',
                    planning_id: 'p2',
                    operation: 'create',
                    update: { slugline: 'Test Planning item July' },
                    user_id: '5923ac531d41c81e3290a5ee',
                },
                {
                    _id: 'ph2',
                    _created: '2017-06-19T02:21:42+0000',
                    planning_id: 'p2',
                    operation: 'update',
                    update: { headline: 'Test Planning item July.' },
                    user_id: '5923ac531d41c81e3290a5ee',
                },
            ],
            locked_events: [
                {
                    _id: 'e1',
                    name: 'Event 1',
                    dates: {
                        start: '2016-10-15T13:01:11',
                        end: '2016-10-15T14:01:11',
                    },
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                },
                {
                    _id: 'e2',
                    name: 'Event 2',
                    dates: {
                        start: '2014-10-15T14:01:11',
                        end: '2014-10-15T15:01:11',
                    },
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                },
            ],
            locked_plannings: [
                {
                    _id: 'p1',
                    slugline: 'Planning1',
                    headline: 'Some Plan 1',
                    coverages: [],
                    agendas: [],
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                },
                {
                    _id: 'p2',
                    slugline: 'Planning2',
                    headline: 'Some Plan 2',
                    event_item: 'e1',
                    coverages: [],
                    agendas: ['a2'],
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                },
            ],
        },

        initialState: {
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
                search: { currentSearch: undefined },
            },
            events: {
                events: {},
                eventsInList: [],
                search: {
                    advancedSearchOpened: false,
                    currentSearch: { fulltext: undefined },
                },
                show: true,
                showEventDetails: undefined,
                highlightedEvent: undefined,
                lastRequestParams: { page: 1 },
            },
            privileges: {
                planning: 1,
                planning_planning_management: 1,
                planning_planning_spike: 1,
                planning_planning_unspike: 1,
                planning_agenda_management: 1,
                planning_agenda_spike: 1,
                planning_agenda_unspike: 1,
                planning_event_management: 1,
                planning_event_spike: 1,
                planning_event_unspike: 1,
                planning_event_publish: 1,
                planning_planning_publish: 1,
                planning_unlock: 1,
            },
            session: {
                identity: { _id: 'ident1' },
                sessionId: 'session1',
            },
            users: [
                {
                    _id: 'ident1',
                    display_name: 'firstname lastname',
                },
                {
                    _id: 'ident2',
                    display_name: 'firstname2 lastname2',
                },
            ],
            assignment: {
                assignments: {},
                filterBy: 'All',
                selectedAssignments: [],
                previewOpened: false,
                assignmentsInList: [],
                currentAssignmentId: null,
            },
            formsProfile: {
                events: {
                    editor: {
                        files: { enabled: true },
                        subject: { enabled: true },
                        name: { enabled: true },
                        links: { enabled: true },
                        anpa_category: { enabled: true },
                        calendars: { enabled: true },
                        definition_short: { enabled: true },
                        definition_long: { enabled: true },
                        slugline: { enabled: true },
                        occur_status: { enabled: true },
                        internal_note: { enabled: true },
                        location: { enabled: true },
                    },
                    schema: {
                        files: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        subject: {
                            mandatory_in_list: { scheme: {} },
                            schema: {
                                schema: {
                                    parent: { nullable: true },
                                    qcode: {},
                                    service: { nullable: true },
                                    name: {},
                                    scheme: {
                                        nullable: true,
                                        type: 'string',
                                        required: true,
                                        allowed: [],
                                    },
                                },
                                type: 'dict',
                            },
                            type: 'list',
                            required: false,
                        },
                        name: {
                            minlength: null,
                            type: 'string',
                            required: true,
                            maxlength: null,
                        },
                        links: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        anpa_category: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        calendars: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        definition_short: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        definition_long: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        location: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        occur_status: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        internal_note: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        slugline: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                    },
                },
            },
            locks: {
                events: {},
                planning: {},
                recurring: {},
            },
            workspace: {
                currentDeskId: null,
                currentStageId: null,
                currentWorkspace: 'PLANNING',
            },
            vocabularies: {
                g2_content_type: [
                    {
                        name: 'Text',
                        qcode: 'text',
                        'content item type': 'text',
                    },
                    {
                        name: 'Photo',
                        qcode: 'photo',
                        'content item type': 'picture',
                    },
                    {
                        name: 'Video',
                        qcode: 'video',
                        'content item type': 'video',
                    },
                    {
                        name: 'Audio',
                        qcode: 'audio',
                        'content item type': 'audio',
                    },
                ],
            },
        },

        getState: sinon.spy(() => (store.initialState)),

        dispatch: sinon.spy((action) => {
            if (typeof action === 'function') {
                return action(
                    store.dispatch,
                    store.getState,
                    store.services
                )
            }

            return action
        }),

        services: {
            notify: {
                error: sinon.spy(),
                success: sinon.spy(),
                pop: sinon.spy(),
            },
            $timeout: sinon.spy((func) => func()),
            api: sinon.spy((resource) => (store.spies.api[resource])),
            $location: { search: sinon.spy(() => (Promise.resolve())) },
            desks: { getCurrentDeskId: sinon.spy(() => 'desk1') },
        },

        test: (done, action) => {
            if (!store._ready) store.init()
            return action(store.dispatch, store.getState, store.services)
            .catch((error) => {
                // If this is from a Promise.reject, then pass that on
                if (get(error, 'stack', null) === null) return Promise.reject(error)
                // Otherwise this is a js exception
                expect(error).toBe(null)
                expect(error.stack).toBe(null)
                done()
                throw error
            })
        },

        init: () => {
            // Construct store.initialValues from store.data as it would be in
            // the redux store
            store.data.plannings.forEach((item) => {
                store.initialState.planning.plannings[item._id] = item
            })
            store.data.events.forEach((item) => {
                store.initialState.events.events[item._id] = {
                    ...item,
                    dates: {
                        ...item.dates,
                        start: moment(item.dates.start),
                        end: moment(item.dates.end),
                    },
                }
            })
            store.initialState.agenda.agendas = store.data.agendas

            store.data.assignments.forEach((item) => {
                store.initialState.assignment.assignments[item._id] = {
                    ...item,
                    planning: {
                        ...item.planning,
                        scheduled: moment(item.planning.scheduled),
                    },
                }
            })
            store._ready = true
        },

        _ready: false,
    }
    store.services.api.update = store.spies.api.update
    store.services.api.save = store.spies.api.save

    return store
}

export const restoreSinonStub = (obj) => {
    if (typeof obj === 'function' && typeof obj.restore === 'function' && obj.restore.sinon) {
        obj.restore()
    }
}

export const convertEventDatesToMoment = (events) => {
    events.forEach((e) => {
        e.dates.start = moment(e.dates.start)
        e.dates.end = moment(e.dates.end)
    })
    return events
}

export const expectAccessDenied = ({ store, permission, action, errorMessage, args, argPos=0 }) => {
    expect(store.services.$timeout.callCount).toBe(1)

    expect(store.services.notify.error.callCount).toBe(1)
    expect(store.services.notify.error.args[0]).toEqual([errorMessage])

    expect(store.dispatch.args[argPos]).toEqual([{
        type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
        payload: {
            action,
            permission,
            errorMessage,
            args,
        },
    }])
}

export const itemActionExists = (wrapper, label) => {
    if (wrapper.find('.icon-dots-vertical').length === 0) return false
    const itemActions = wrapper.find(ItemActionsMenu)
    return !!itemActions.props().actions.find((a) => a.label === label)
}

export const clickItemAction = (wrapper, icon) => {
    const itemActions = wrapper.find(ItemActionsMenu)
    itemActions.find('.dropdown__toggle').simulate('click')
    itemActions.find(icon).parent().simulate('click')
}

export const expectActions = (itemActions, expectedActions) => {
    expect(itemActions.length).toBe(
        expectedActions.length,
        `\n\t[${map(itemActions, 'label')}]\n\t[${expectedActions}]`
    )

    for (let i = 0; i < expectedActions.length; i++) {
        expect(expectedActions[i]).toBe(itemActions[i].label)
    }
}
