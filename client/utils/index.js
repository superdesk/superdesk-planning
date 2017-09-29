import moment from 'moment-timezone'
import { createStore as _createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import { get, set, isNil } from 'lodash'
import { PUBLISHED_STATE, WORKFLOW_STATE, TOOLTIPS } from '../constants/index'
export { default as checkPermission } from './checkPermission'
export { default as retryDispatch } from './retryDispatch'
export { default as registerNotifications } from './notifications'
export { default as eventUtils } from './events'
export { default as planningUtils } from './planning'
export { default as uiUtils } from './ui'

export function createReducer(initialState, reducerMap) {
    return (state = initialState, action) => {
        const reducer = reducerMap[action.type]
        if (reducer) {
            return reducer(state, action.payload)
        } else {
            return {
                ...initialState,
                ...state,
            }
        }
    }
}

export const createTestStore = (params={}) => {
    const { initialState={}, extraArguments={} } = params
    const mockedInitialState = {
        config: {
            server: { url: 'http://server.com' },
            iframely: { key: '123' },
            model: { dateformat: 'DD/MM/YYYY' },
            shortTimeFormat: 'HH:mm',
        },

        session: {
            identity: { _id: 'user123' },
            sessionId: 'session123',
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
        },

        formsProfile: {
            events: {
                editor: {
                    slugline: { enabled: true },
                    anpa_category: { enabled: true },
                    definition_long: { enabled: true },
                    definition_short: { enabled: true },
                    internal_note: { enabled: true },
                    location: { enabled: true },
                    name: { enabled: true },
                    dates: { enabled: true },
                    occur_status: { enabled: true },
                    subject: { enabled: true },
                    calendars: { enabled: true },
                    files: { enabled: true },
                    links: { enabled: true },
                },
            },
            coverage: {
                editor: {
                    description_text: { enabled: true },
                    g2_content_type: { enabled: true },
                    genre: { enabled: true },
                    headline: { enabled: true },
                    internal_note: { enabled: true },
                    scheduled: { enabled: true },
                    slugline: { enabled: true },
                },
            },
            planning: {
                editor: {
                    agendas: { enabled: true },
                    anpa_category: { enabled: true },
                    description_text: { enabled: true },
                    ednote: { enabled: true },
                    flags: { enabled: true },
                    headline: { enabled: true },
                    internal_note: { enabled: true },
                    slugline: { enabled: true },
                    subject: { enabled: true },
                },
            },
        },

        users: [
            {
                _id: 'user123',
                display_name: 'foo',
            },
            {
                _id: 'somebodyelse',
                display_name: 'somebodyelse',
            },
        ],

        vocabularies: {
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
                },
                {
                    name: 'Video',
                    qcode: 'video',
                },
                {
                    name: 'Audio',
                    qcode: 'audio',
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
        },

        subjects: [
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
        ],

        desks: [
            {
                _id: 123,
                name: 'Politic Desk',
                members: [
                    { user: 345 },
                ],
            },
            {
                _id: 234,
                name: 'Sports Desk',
            },
        ],

        genres: [
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
        ],

        ingest: {
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
        },

        urgency: {
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
        },

        deployConfig: {},

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
    }

    const mockedExtraArguments = {
        $timeout: extraArguments.timeout ? extraArguments.timeout : (cb) => (cb && cb()),
        $scope: { $apply: (cb) => (cb && cb()) },
        notify: extraArguments.notify ? extraArguments.notify : {
            success: () => (undefined),
            error: () => (undefined),
            pop: () => (undefined),
        },
        $location: { search: () => (undefined) },
        vocabularies: {
            getAllActiveVocabularies: () => (
                Promise.resolve({
                    _items: [
                        {
                            _id: 'categories',
                            items: [
                                {
                                    qcode: 'test:sport',
                                    name: 'Sport',
                                },
                                {
                                    qcode: 'test:news',
                                    name: 'News',
                                },
                            ],
                        },
                        {
                            _id: 'eventoccurstatus',
                            items: [
                                {
                                    qcode: 'eocstat:eos0',
                                    name: 'Unplanned event',
                                },
                                {
                                    qcode: 'eocstat:eos1',
                                    name: 'Planned, occurence planned only',
                                },
                            ],
                        },
                    ],
                })
            ),
        },
        upload: { start: (d) => (Promise.resolve(d)) },
        api: extraArguments.api ? extraArguments.api : (resource) => ({
            query: (q) =>  {
                if (extraArguments.apiQuery) {
                    return Promise.resolve(extraArguments.apiQuery(resource, q))
                } else {
                    return Promise.resolve({ _items: [] })
                }
            },

            remove: (item) => {
                if (extraArguments.apiRemove) {
                    return Promise.resolve(extraArguments.apiRemove(resource, item))
                } else {
                    return Promise.resolve()
                }
            },

            save: (ori, item) => {
                if (extraArguments.apiSave) {
                    return Promise.resolve(extraArguments.apiSave(resource, ori, item))
                } else {
                    const response = {
                        ...ori,
                        ...item,
                    }
                    // if there is no id we add one
                    if (!response._id) {
                        response._id = Math.random().toString(36).substr(2, 10)
                    }
                    // reponse as a promise
                    return Promise.resolve(response)
                }
            },

            getById: (_id) => {
                if (extraArguments.apiGetById) {
                    return Promise.resolve(extraArguments.apiGetById(resource, _id))
                } else {
                    return Promise.resolve()
                }
            },
        }),
    }

    if (!get(mockedExtraArguments.api, 'save')) {
        mockedExtraArguments.api.save = (resource, dest, diff, parent) => (Promise.resolve({
            ...parent,
            ...diff,
        }))
    }

    const middlewares = [
        // adds the mocked extra arguments to actions
        thunkMiddleware.withExtraArgument({
            ...mockedExtraArguments,
            extraArguments,
        }),
    ]
    // parse dates since we keep moment dates in the store
    if (initialState.events) {
        const paths = ['dates.start', 'dates.end']
        Object.keys(initialState.events.events).forEach((eKey) => {
            const event = initialState.events.events[eKey]
            paths.forEach((path) => (
                set(event, path, moment(get(event, path)))
            ))
        })
    }
    // return the store
    return _createStore(
        planningApp,
        {
            ...mockedInitialState,
            ...initialState,
        },
        applyMiddleware.apply(null, middlewares)
    )
}

/**
 * Some action dispatchers (specifically thunk with promises)
 * do not catch javascript exceptions.
 * This middleware ensures that uncaught exceptions are still thrown
 * displaying the error in the console.
 */
const crashReporter = () => next => action => {
    try {
        return next(action)
    } catch (err) {
        throw err
    }
}

export const createStore = (params={}) => {
    const { initialState={}, extraArguments={} } = params
    const middlewares = [
        crashReporter,

        // adds the extra arguments to actions
        thunkMiddleware.withExtraArgument(extraArguments),

        // logs actions (this should always be the last middleware)
        createLogger(),
    ]
    // return the store
    return _createStore(
        planningApp,
        initialState,
        applyMiddleware.apply(null, middlewares)
    )
}

export const formatAddress = (nominatim) => {
    const localityHierarchy = [
        'city',
        'state',
        'state_district',
        'region',
        'county',
        'island',
        'town',
        'moor',
        'waterways',
        'village',
        'district',
        'borough',
    ]

    const localityField = localityHierarchy.find((locality) =>
        nominatim.address.hasOwnProperty(locality)
    )
    // Map nominatim fields to NewsML area
    const areaHierarchy = [
        'island',
        'town',
        'moor',
        'waterways',
        'village',
        'hamlet',
        'municipality',
        'district',
        'borough',
        'airport',
        'national_park',
        'suburb',
        'croft',
        'subdivision',
        'farm',
        'locality',
        'islet',
    ]
    const areaField = areaHierarchy.find((area) =>
        nominatim.address.hasOwnProperty(area)
    )

    const address = {
        title: (localityHierarchy.indexOf(nominatim.type) === -1 &&
            areaHierarchy.indexOf(nominatim.type) === -1) ?
            get(nominatim.address, nominatim.type) : null,
        line: [
            `${get(nominatim.address, 'house_number', '')} ${get(nominatim.address, 'road', '')}`
            .trim(),
        ],
        locality: get(nominatim.address, localityField),
        area: get(nominatim.address, areaField),
        country: nominatim.address.country,
        postal_code: nominatim.address.postcode,
        external: { nominatim },
    }

    const formattedAddress = [
        get(address, 'line[0]'),
        get(address, 'area'),
        get(address, 'locality'),
        get(address, 'postal_code'),
        get(address, 'country'),
    ].filter(d => d).join(', ')

    const shortName = get(address, 'title') ? get(address, 'title') + ', ' + formattedAddress :
        formattedAddress

    return {
        address,
        formattedAddress,
        shortName,
    }
}

/**
 * Utility to return the error message from a api response, or the default message supplied
 * @param {object} error - The API response, containing the error message
 * @param {string} defaultMessage - The default string to return
 * @return {string} string containing the error message
 */
export const getErrorMessage = (error, defaultMessage) => {
    if (get(error, 'data._message')) {
        return get(error, 'data._message')
    } else if (get(error, 'data._issues.validator exception')) {
        return get(error, 'data._issues.validator exception')
    } else if (typeof error === 'string') {
        return error
    }

    return defaultMessage
}

/**
 * Helper function to retrieve the user object using their ID from an item field.
 * i.e. get the User object for 'original_creator'
 * @param {object} item - The item to get the ID from
 * @param {string} creator - The field name where the ID is stored
 * @param {Array} users - The array of users, typically from the redux store
 * @return {object} The user object found, otherwise nothing is returned
 */
export const getCreator = (item, creator, users) => {
    const user = get(item, creator)
    if (user) {
        return user.display_name ? user : users.find((u) => u._id === user)
    }
}

export const isItemLockedInThisSession = (item, session) => (
    get(item, 'lock_user') === get(session, 'identity._id') &&
        get(item, 'lock_session') === get(session, 'sessionId')
)

/**
 * Get the name of associated icon for different coverage types
 * @param {type} coverage types
 * @returns {string} icon name
 */
export const getCoverageIcon = (type) => {
    const coverageIcons = {
        text: 'icon-text',
        video: 'icon-video',
        live_video: 'icon-video',
        audio: 'icon-audio',
        photo: 'icon-photo',
    }
    return get(coverageIcons, type, 'icon-file')
}

export const getLockedUser = (item, locks, users) => {
    const lock = getLock(item, locks)
    return lock !== null && Array.isArray(users) ?
        users.find((u) => (u._id === lock.user)) : null
}

export const getLock = (item, locks) => {
    if (isNil(item)) {
        return null
    } else if (item._id in locks.events) {
        return locks.events[item._id]
    } else if (item._id in locks.planning) {
        return locks.planning[item._id]
    } else if (get(item, 'event_item') in locks.events) {
        return locks.events[item.event_item]
    } else if (get(item, 'recurrence_id') in locks.recurring) {
        return locks.recurring[item.recurrence_id]
    }

    return null
}

export const getItemWorkflowState = (item) => (get(item, 'state', WORKFLOW_STATE.DRAFT))
export const isItemCancelled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.CANCELLED
export const isItemRescheduled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.RESCHEDULED
export const isItemKilled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.KILLED
export const isItemPostponed = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.POSTPONED

export const getItemWorkflowStateLabel = (item) => {
    switch (getItemWorkflowState(item)) {
        case WORKFLOW_STATE.DRAFT:
            return {
                label: 'draft',
                iconType: 'yellow2',
                iconHollow: true,
            }
        case WORKFLOW_STATE.SPIKED:
            return {
                label: 'spiked',
                iconType: 'alert',
            }
        case WORKFLOW_STATE.SCHEDULED:
            return {
                label: 'Scheduled',
                labelVerbose: 'Scheduled',
                iconType: 'success',
                tooltip: TOOLTIPS.scheduledState,
            }
        case WORKFLOW_STATE.KILLED:
            return {
                label: 'Killed',
                iconType: 'warning',
                tooltip: TOOLTIPS.withheldState,
            }
        case WORKFLOW_STATE.RESCHEDULED:
            return {
                label: 'Rescheduled',
                iconType: 'warning',
            }
        case WORKFLOW_STATE.CANCELLED:
            return {
                label: 'Cancelled',
                iconType: 'yellow2',
            }
        case WORKFLOW_STATE.POSTPONED:
            return {
                label: 'Postponed',
                iconType: 'yellow2',

            }
    }
}

export const getItemPublishedStateLabel = (item) => {
    switch (getPublishedState(item)) {
        case PUBLISHED_STATE.USABLE:
            return {
                label: 'P',
                labelVerbose: 'Published',
                iconType: 'success',
                tooltip:  TOOLTIPS.publishedState,
            }

        case PUBLISHED_STATE.CANCELLED:
            return {
                label: 'Cancelled',
                iconType: 'yellow2',
            }
    }
}

export const isItemPublic = (item={}) =>
    typeof item === 'string' ?
        item === PUBLISHED_STATE.USABLE || item === PUBLISHED_STATE.CANCELLED :
        item.pubstatus === PUBLISHED_STATE.USABLE || item.pubstatus === PUBLISHED_STATE.CANCELLED

export const isItemSpiked = (item) => item ?
    getItemWorkflowState(item) === WORKFLOW_STATE.SPIKED : false

/**
 * Get the timezone offset
 * @param {Array} coverages
 * @returns {Array}
 */
export const getTimeZoneOffset = () => (moment().format('Z'))

export const  getPublishedState = (item) => get(item, 'pubstatus', null)

export const sanitizeTextForQuery = (text) => (
    text.replace(/\//g, '\\/').replace(/[()]/g, '')
)

/**
 * Get translated string
 *
 * You can use params in translation like:
 *
 *    gettext('Hello {{ name }}', {name: 'John'})
 *
 * @param {String} text
 * @param {Object} params
 * @return {String}
 */
export function gettext(text, params) {
    const injector = angular.element(document.body).injector()

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettext')(text)

        return params ? injector.get('$interpolate')(translated)(params) : translated
    }

    return text
}
