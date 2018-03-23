export const config = {
    server: {url: 'http://server.com'},
    iframely: {key: '123'},
    model: {dateformat: 'DD/MM/YYYY'},
    shortTimeFormat: 'HH:mm',
};

export const privileges = {
    archive: 1,
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
};

export const sessions = [
    {
        identity: {_id: 'ident1'},
        sessionId: 'session1',
    },
    {
        identity: {_id: 'ident2'},
        sessionId: 'session2',
    },
];

export const users = [
    {
        _id: 'ident1',
        display_name: 'firstname lastname',
    },
    {
        _id: 'ident2',
        display_name: 'firstname2 lastname2',
    },
];

export const desks = [
    {
        _id: 123,
        name: 'Politic Desk',
        members: [
            {user: 345},
        ],
    },
    {
        _id: 234,
        name: 'Sports Desk',
    },
];

export const formsProfile = {
    event: {
        editor: {
            files: {enabled: true},
            subject: {enabled: true},
            name: {enabled: true},
            links: {enabled: true},
            anpa_category: {enabled: true},
            calendars: {enabled: true},
            definition_short: {enabled: true},
            definition_long: {enabled: true},
            slugline: {enabled: true},
            occur_status: {enabled: true},
            internal_note: {enabled: true},
            location: {enabled: true},
            dates: {enabled: true},
            place: {enabled: true},
            ednote: {enabled: true},
        },
        schema: {
            files: {
                mandatory_in_list: null,
                schema: null,
                type: 'list',
                required: false,
            },
            subject: {
                mandatory_in_list: {scheme: {}},
                schema: {
                    schema: {
                        parent: {nullable: true},
                        qcode: {},
                        service: {nullable: true},
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
            place: {
                mandatory_in_list: null,
                schema: null,
                type: 'list',
                required: false,
            },
            ednote: {
                type: 'string',
                required: false,
            },
        },
    },
    planning: {
        editor: {
            slugline: {enabled: true},
            anpa_category: {enabled: true},
            description_text: {enabled: true},
            ednote: {enabled: true},
            internal_note: {enabled: true},
            headline: {enabled: true},
            flags: {enabled: true},
            subject: {enabled: true},
            agendas: {enabled: true},
        },
    },
    coverage: {
        editor: {
            description_text: {enabled: true},
            g2_content_type: {enabled: true},
            genre: {enabled: true},
            headline: {enabled: true},
            internal_note: {enabled: true},
            scheduled: {enabled: true},
            slugline: {enabled: true},
        },
    },
};

export const workspace = {
    currentDeskId: null,
    currentStageId: null,
    currentWorkspace: 'PLANNING',
};

export const vocabularies = {
    categories: [
        {
            name: 'cat1',
            qcode: 'qcode1',
        },
        {
            name: 'cat2',
            qcode: 'qcode2',
        },
        {
            name: 'cat3',
            qcode: 'qcode3',
        },
    ],
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
    event_calendars: [
        {
            name: 'Sport',
            qcode: 'sport',
        },
        {
            name: 'Finance',
            qcode: 'finance',
        },
    ],
    eventoccurstatus: [
        {
            name: 'Unplanned event',
            label: 'Unplanned',
            qcode: 'eocstat:eos0',
        },
        {
            name: 'Planned, occurrence planned only',
            label: 'Tentative',
            qcode: 'eocstat:eos1',
        },
        {
            name: 'Planned, occurrence highly uncertain',
            label: 'Unlikely',
            qcode: 'eocstat:eos2',
        },
        {
            name: 'Planned, may occur',
            label: 'Possible',
            qcode: 'eocstat:eos3',
        },
        {
            name: 'Planned, occurrence highly likely',
            label: 'Very likely',
            qcode: 'eocstat:eos4',
        },
        {
            name: 'Planned, occurs certainly',
            label: 'Confirmed',
            qcode: 'eocstat:eos5',
        },
        {
            name: 'Planned, then cancelled',
            label: 'Cancelled',
            qcode: 'eocstat:eos6',
        },
    ],
    newscoveragestatus: [
        {
            name: 'Coverage intended',
            label: 'Planned',
            qcode: 'ncostat:int',
        },
        {
            name: 'Coverage not decided yet',
            label: 'On merit',
            qcode: 'ncostat:notdec',
        },
        {
            name: 'Coverage not intended',
            label: 'Not planned',
            qcode: 'ncostat:notint',
        },
        {
            name: 'Coverage upong request',
            label: 'On request',
            qcode: 'ncostat:onreq',
        },
    ],
    assignment_priority: [
        {
            name: 'High',
            qcode: 1,
        },
        {
            name: 'Medium',
            qcode: 2,
        },
        {
            name: 'Low',
            qcode: 3,
        },
    ],
    priority: [
        {
            name: '1',
            qcode: 1,
        },
        {
            name: '2',
            qcode: 2,
        },
        {
            name: '3',
            qcode: 3,
        },
        {
            name: '4',
            qcode: 4,
        },
        {
            name: '5',
            qcode: 5,
        },
        {
            name: '6',
            qcode: 6,
        },
    ],
    keywords: [
        {qcode: 'SciTech', name: 'Science and Technology'},
        {qcode: 'Medicine', name: 'International Health Stories'},
        {qcode: 'Health', name: 'Health'},
        {qcode: 'Motoring', name: 'Motoring'},
        {qcode: 'Soccer', name: 'Soccer'},
        {qcode: 'Property', name: 'Property'}
    ]
};

export const subjects = [
    {
        name: 'sub1',
        qcode: 'qcode1',
        parent: null,
    },
    {
        name: 'sub1-1',
        qcode: 'qcode1-1',
        parent: 'qcode1',
    },
    {
        name: 'sub2',
        qcode: 'qcode2',
        parent: null,
    },
    {
        name: 'sub2-2',
        qcode: 'qcode2-2',
        parent: 'qcode2',
    },
];

export const genres = [
    {
        name: 'Article (news)',
        qcode: 'Article',
    },
    {
        name: 'Sidebar',
        qcode: 'Sidebar',
    },
    {
        name: 'Feature',
        qcode: 'Feature',
    },
];

export const ingest = {
    providers: [
        {
            id: 'ip123',
            name: 'afp',
        },
        {
            id: 'ip456',
            name: 'Forbes RSS feed',
        },
    ],
};

export const urgency = {
    label: 'News Value',
    urgency: [
        {
            name: '1',
            qcode: 1,
        },
        {
            name: '2',
            qcode: 2,
        },
        {
            name: '3',
            qcode: 3,
        },
        {
            name: '4',
            qcode: 4,
        },
        {
            name: '5',
            qcode: 5,
        },
    ],
};

export const deployConfig = {max_recurrent_events: 200};

export const locks = {
    event: {},
    planning: {},
    recurring: {},
    assignment: {},
};

export const eventsInitialState = {
    events: {},
    eventsInList: [],
    selectedEvents: [],
    readOnly: true,
    eventHistoryItems: [],
};

export const agendaInitialState = {
    agendas: [],
    currentPlanningId: undefined,
    currentAgendaId: 'ALL_PLANNING',
    agendasAreLoading: false,
};

export const assignmentInitialState = {
    assignments: {},
    filterBy: 'All',
    previewOpened: false,
    assignmentsInInProgressList: [],
    assignmentsInTodoList: [],
    assignmentsInCompletedList: [],
    assignmentListSingleGroupView: null,
    currentAssignmentId: null,
    archive: {},
};

export const modal = {
    modalType: null,
    modalProps: undefined,
    previousState: undefined,
    actionInProgress: false,
};

export const planningInitialState = {
    plannings: {},
    planningsInList: [],
    selectedItems: [],
    currentPlanningId: undefined,
    editorOpened: false,
    filterPlanningKeyword: null,
    readOnly: true,
    planningHistoryItems: [],
};

export const eventsPlanningInitialState = {
    eventsAndPlanningInList: [],
    relatedPlannings: {}
};

export const templates = {templates: []};

export const form = {};

export const events = [
    {
        _id: 'e1',
        type: 'event',
        slugline: 'test slugline',
        name: 'Event 1',
        dates: {
            start: '2016-10-15T13:01:11+0000',
            end: '2016-10-15T14:01:11+0000',
        },
        planning_ids: ['p2'],
        _etag: 'e123',
    },
    {
        _id: 'e2',
        type: 'event',
        slugline: 'test slugline 2',
        name: 'Event 2',
        dates: {
            start: '2014-10-15T14:01:11+0000',
            end: '2014-10-15T15:01:11+0000',
        },
        planning_ids: [],
    },
    {
        _id: 'e3',
        type: 'event',
        name: 'Event 3',
        dates: {
            start: '2015-10-15T14:01:11+0000',
            end: '2015-10-15T15:01:11+0000',
        },
    },
];

export const plannings = [
    {
        _id: 'p1',
        type: 'planning',
        slugline: 'Planning1',
        planning_date: '2016-10-15T13:01:11+0000',
        headline: 'Some Plan 1',
        state: 'draft',
        coverages: [
            {
                coverage_id: 'c1',
                planning_item: 'p1',
                planning: {
                    ednote: 'Text coverage',
                    scheduled: '2016-10-15T13:01:11+0000',
                    g2_content_type: 'text',
                },
                assigned_to: {
                    user: 'ident1',
                    desk: 'desk1',
                    assignment_id: 'as1',
                },
                firstcreated: '2017-10-01T14:01:11+0000',
                news_coverage_status: {qcode: 'ncostat:int'},
            },
            {
                coverage_id: 'c2',
                planning_item: 'p1',
                planning: {
                    ednote: 'Photo coverage',
                    scheduled: '2016-10-15T14:01:11+0000',
                    g2_content_type: 'photo',
                },
                assigned_to: {
                    user: 'ident1',
                    desk: 'desk2',
                    assignment_id: 'as2',
                },
                firstcreated: '2017-10-02T14:01:11+0000',
            },
            {
                coverage_id: 'c3',
                planning_item: 'p1',
                planning: {
                    ednote: 'Video coverage',
                    scheduled: '2016-10-15T16:01:11+0000',
                    g2_content_type: 'video',
                },
                firstcreated: '2017-10-03T14:01:11+0000',
            },
        ],
        agendas: [],
    },
    {
        _id: 'p2',
        type: 'planning',
        slugline: 'Planning2',
        planning_date: '2016-10-15T13:01:11',
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
];

export const assignments = [
    {
        _id: 'as1',
        type: 'assignment',
        coverage_id: 'c1',
        planning_item: 'p1',
        assigned_to: {
            user: 'ident1',
            desk: 'desk1',
        },
        planning: {
            ednote: 'Text coverage',
            scheduled: '2016-10-15T13:01:11+0000',
            g2_content_type: 'text',
        },
    },
    {
        _id: 'as2',
        type: 'assignment',
        coverage_id: 'c2',
        planning_item: 'p1',
        assigned_to: {
            user: 'ident1',
            desk: 'desk2',
        },
        planning: {
            ednote: 'Photo coverage',
            scheduled: '2016-10-15T14:01:11+0000',
            g2_content_type: 'photo',
        },
    },
];

export const agendas = [
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
];

export const planningHistory = [
    {
        _id: 'ph1',
        _created: '2017-06-19T02:21:42+0000',
        planning_id: 'p2',
        operation: 'create',
        update: {slugline: 'Test Planning item July'},
        user_id: '5923ac531d41c81e3290a5ee',
    },
    {
        _id: 'ph2',
        _created: '2017-06-19T02:21:42+0000',
        planning_id: 'p2',
        operation: 'update',
        update: {headline: 'Test Planning item July.'},
        user_id: '5923ac531d41c81e3290a5ee',
    },
];

export const eventsHistory = [
    {
        _id: 'e2',
        _created: '2017-06-19T02:21:42+0000',
        event_id: 'e2',
        operation: 'create',
        update: {
            name: 'Test Event Wollongong',
            dates: {
                end: '2017-06-27T07:00:00+0000',
                start: '2017-06-24T23:00:00+0000',
                tz: 'Australia/Sydney',
            },
        },
        user_id: '5923ac531d41c81e3290a5ee',
    },
    {
        _id: 'e2',
        _created: '2017-06-19T02:21:42+0000',
        event_id: 'e2',
        operation: 'update',
        update: {name: 'Test Event Wollongong.'},
        user_id: '5923ac531d41c81e3290a5ee',
    },
];

export const lockedEvents = [
    {
        _id: 'e1',
        name: 'Event 1',
        dates: {
            start: '2016-10-15T13:01:11+0000',
            end: '2016-10-15T14:01:11+0000',
        },
        lock_action: 'edit',
        lock_user: 'ident1',
        lock_session: 'session1',
    },
    {
        _id: 'e2',
        name: 'Event 2',
        dates: {
            start: '2014-10-15T14:01:11+0000',
            end: '2014-10-15T15:01:11+0000',
        },
        lock_action: 'edit',
        lock_user: 'ident1',
        lock_session: 'session1',
    },
];

export const lockedPlannings = [
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
];

export const archive = [
    {
        _id: 'item1',
        slugline: 'test slugline',
        headline: 'test headline',
        urgency: 2
    }
];

export const main = {
    previewId: null,
    previewIType: null,
    loadingPreview: false,
    filter: null,
    search: {
        EVENTS: {
            lastRequestParams: {page: 1},
            fulltext: undefined,
            currentSearch: undefined
        },
        PLANNING: {
            lastRequestParams: {page: 1},
            fulltext: undefined,
            currentSearch: undefined
        },
        COMBINED: {
            lastRequestParams: {page: 1},
            fulltext: undefined,
            currentSearch: undefined
        }
    }
};

export const multiSelect = {
    selectedEventIds: [],
    selectedPlanningIds: [],
};

export const contacts = [];

export const initialState = {
    config: config,
    privileges: privileges,
    session: sessions[0],
    users: users,
    desks: desks,
    forms: {
        profiles: formsProfile,
        autosaves: {},
        itemId: null,
        itemType: null,
    },
    workspace: workspace,
    vocabularies: vocabularies,
    subjects: subjects,
    genres: genres,
    ingest: ingest,
    urgency: urgency,
    deployConfig: deployConfig,
    locks: locks,
    events: eventsInitialState,
    agenda: agendaInitialState,
    assignment: assignmentInitialState,
    modal: modal,
    planning: planningInitialState,
    templates: templates,
    main: main,
    eventsPlanning: eventsPlanningInitialState,
    multiSelect: multiSelect,
    contacts: contacts,
};

export const items = {
    events: events,
    plannings: plannings,
    assignments: assignments,
    agendas: agendas,
    planning_history: planningHistory,
    events_history: eventsHistory,
    locked_events: lockedEvents,
    locked_plannings: lockedPlannings,
    archive: archive,
    planning_search: events.concat(plannings),
    contacts: contacts,
};
