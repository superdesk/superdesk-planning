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
    events: {
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

export const deployConfig = {};

export const locks = {
    events: {},
    planning: {},
    recurring: {},
    assignments: {},
};

export const eventsInitialState = {
    events: {},
    eventsInList: [],
    search: {
        currentSearch: undefined,
        advancedSearchOpened: false,
    },
    lastRequestParams: {page: 1},
    show: true,
    showEventDetails: null,
    highlightedEvent: null,
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
    planningsAreLoading: false,
    onlyFuture: true,
    filterPlanningKeyword: null,
    readOnly: true,
    planningHistoryItems: [],
    lastRequestParams: {page: 1},
    search: {
        currentSearch: undefined,
        advancedSearchOpened: false,
    },
};

export const templates = {templates: []};

export const form = {};

export const initialState = {
    config: config,
    privileges: privileges,
    session: sessions[0],
    users: users,
    desks: desks,
    formsProfile: formsProfile,
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
    autosave: {},
    modal: modal,
    planning: planningInitialState,
    templates: templates,
    form: form,
};
