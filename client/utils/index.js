import moment from 'moment-timezone';
import {createStore as _createStore, applyMiddleware} from 'redux';
import planningApp from '../reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import {get, set, isNil, map, cloneDeep} from 'lodash';
import {
    PUBLISHED_STATE,
    WORKFLOW_STATE,
    TOOLTIPS,
    ASSIGNMENTS,
    ITEM_TYPE,
    GENERIC_ITEM_ACTIONS
} from '../constants/index';
import * as testData from './testData';
import {gettext} from './gettext';

export {default as checkPermission} from './checkPermission';
export {default as retryDispatch} from './retryDispatch';
export {default as registerNotifications} from './notifications';
export {default as eventUtils} from './events';
export {default as planningUtils} from './planning';
export {default as uiUtils} from './ui';
export {default as assignmentUtils} from './assignments';
export {default as stringUtils} from './strings';
export {gettext};

export function createReducer(initialState, reducerMap) {
    return (state = initialState, action) => {
        const reducer = reducerMap[action.type];

        if (reducer) {
            return reducer(state, action.payload);
        } else {
            return {
                ...initialState,
                ...state,
            };
        }
    };
}

export const createTestStore = (params = {}) => {
    const {initialState = {}, extraArguments = {}} = params;
    const mockedInitialState = cloneDeep(testData.initialState);

    const mockedExtraArguments = {
        $timeout: extraArguments.timeout ? extraArguments.timeout : (cb) => (cb && cb()),
        $scope: {$apply: (cb) => (cb && cb())},
        notify: extraArguments.notify ? extraArguments.notify : {
            success: () => (undefined),
            error: () => (undefined),
            pop: () => (undefined),
        },
        $location: extraArguments.$location ? extraArguments.$location : {search: () => (undefined)},
        vocabularies: {
            getAllActiveVocabularies: () => (
                Promise.resolve({
                    _items: [
                        {
                            _id: 'categories',
                            items: testData.vocabularies.categories,
                        },
                        {
                            _id: 'g2_content_type',
                            items: testData.vocabularies.g2_content_type,
                        },
                        {
                            _id: 'event_calendars',
                            items: testData.vocabularies.event_calendars,
                        },
                        {
                            _id: 'eventoccurstatus',
                            items: testData.vocabularies.eventoccurstatus,
                        },
                        {
                            _id: 'newscoveragestatus',
                            items: testData.vocabularies.newscoveragestatus,
                        },
                        {
                            _id: 'assignment_priority',
                            items: testData.vocabularies.assignment_priority,
                        },
                        {
                            _id: 'priority',
                            items: testData.vocabularies.priority,
                        },
                    ],
                })
            ),
        },
        upload: {start: (d) => (Promise.resolve(d))},
        api: extraArguments.api ? extraArguments.api : (resource) => ({
            query: (q) => {
                if (extraArguments.apiQuery) {
                    return Promise.resolve(extraArguments.apiQuery(resource, q));
                } else {
                    return Promise.resolve({_items: []});
                }
            },

            remove: (item) => {
                if (extraArguments.apiRemove) {
                    return Promise.resolve(extraArguments.apiRemove(resource, item));
                } else {
                    return Promise.resolve();
                }
            },

            save: (ori, item) => {
                if (extraArguments.apiSave) {
                    return Promise.resolve(extraArguments.apiSave(resource, ori, item));
                } else {
                    const response = {
                        ...ori,
                        ...item,
                    };
                    // if there is no id we add one

                    if (!response._id) {
                        response._id = Math.random().toString(36)
                            .substr(2, 10);
                    }
                    // reponse as a promise
                    return Promise.resolve(response);
                }
            },

            getById: (_id) => {
                if (extraArguments.apiGetById) {
                    return Promise.resolve(extraArguments.apiGetById(resource, _id));
                } else {
                    return Promise.resolve();
                }
            },
        }),
    };

    if (!get(mockedExtraArguments.api, 'save')) {
        mockedExtraArguments.api.save = (resource, dest, diff, parent) => (Promise.resolve({
            ...parent,
            ...diff,
        }));
    }

    const middlewares = [
        // adds the mocked extra arguments to actions
        thunkMiddleware.withExtraArgument({
            ...mockedExtraArguments,
            extraArguments,
        }),
    ];
    // parse dates since we keep moment dates in the store

    if (initialState.events) {
        const paths = ['dates.start', 'dates.end'];

        Object.keys(initialState.events.events).forEach((eKey) => {
            const event = initialState.events.events[eKey];

            paths.forEach((path) => (
                set(event, path, moment(get(event, path)))
            ));
        });
    }
    // return the store
    return _createStore(
        planningApp,
        {
            ...mockedInitialState,
            ...initialState,
        },
        applyMiddleware(...middlewares)
    );
};

/**
 * Some action dispatchers (specifically thunk with promises)
 * do not catch javascript exceptions.
 * This middleware ensures that uncaught exceptions are still thrown
 * displaying the error in the console.
 */
const crashReporter = () => (next) => (action) => {
    try {
        return next(action);
    } catch (err) {
        throw err;
    }
};

export const createStore = (params = {}, app = planningApp) => {
    const {initialState = {}, extraArguments = {}} = params;
    const middlewares = [
        crashReporter,

        // adds the extra arguments to actions
        thunkMiddleware.withExtraArgument(extraArguments),

        // logs actions (this should always be the last middleware)
        createLogger(),
    ];
    // return the store

    return _createStore(
        app,
        initialState,
        applyMiddleware(...middlewares)
    );
};

export const formatAddress = (nominatim) => {
    let address = nominatim.address;

    if (!get(address, 'line[0]')) {
        // Address from nominatim search
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
        ];

        const localityField = localityHierarchy.find((locality) =>
            nominatim.address.hasOwnProperty(locality)
        );
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
        ];
        const areaField = areaHierarchy.find((area) =>
            nominatim.address.hasOwnProperty(area)
        );

        address = {
            title: (localityHierarchy.indexOf(nominatim.type) === -1 &&
                areaHierarchy.indexOf(nominatim.type) === -1) ?
                get(nominatim.address, nominatim.type) : null,
            line: [
                (`${get(nominatim.address, 'house_number', '')} ` +
                `${get(nominatim.address, 'road', '')}`)
                    .trim(),
            ],
            locality: get(nominatim.address, localityField),
            area: get(nominatim.address, areaField),
            country: nominatim.address.country,
            postal_code: nominatim.address.postcode,
            external: {nominatim},
        };
    }

    const formattedAddress = [
        get(address, 'line[0]'),
        get(address, 'area'),
        get(address, 'locality'),
        get(address, 'postal_code'),
        get(address, 'country'),
    ].filter((d) => d).join(', ');

    const shortName = get(address, 'title') ? get(address, 'title') + ', ' + formattedAddress :
        formattedAddress;

    return {
        address,
        formattedAddress,
        shortName,
    };
};

/**
 * Utility to return the error message from a api response, or the default message supplied
 * @param {object} error - The API response, containing the error message
 * @param {string} defaultMessage - The default string to return
 * @return {string} string containing the error message
 */
export const getErrorMessage = (error, defaultMessage) => {
    if (get(error, 'data._message')) {
        return get(error, 'data._message');
    } else if (get(error, 'data._issues.validator exception')) {
        return get(error, 'data._issues.validator exception');
    } else if (typeof error === 'string') {
        return error;
    }

    return defaultMessage;
};

/**
 * Helper function to retrieve the user object using their ID from an item field.
 * i.e. get the User object for 'original_creator'
 * @param {object} item - The item to get the ID from
 * @param {string} creator - The field name where the ID is stored
 * @param {Array} users - The array of users, typically from the redux store
 * @return {object} The user object found, otherwise nothing is returned
 */
export const getCreator = (item, creator, users) => {
    const user = get(item, creator);

    if (user) {
        return user.display_name ? user : users.find((u) => u._id === user);
    }
};

export const isItemLockedInThisSession = (item, session) => (
    get(item, 'lock_user') === get(session, 'identity._id') &&
        get(item, 'lock_session') === get(session, 'sessionId')
);

export const getItemInArrayById = (items, id, field = '_id') => (
    id ? items.find((item) => get(item, field) === id) : null
);

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
        picture: 'icon-photo',
    };

    return get(coverageIcons, type, 'icon-file');
};

export const getLockedUser = (item, locks, users) => {
    const lock = getLock(item, locks);

    return lock !== null && Array.isArray(users) ?
        users.find((u) => (u._id === lock.user)) : null;
};

export const getLock = (item, locks) => {
    if (isNil(item)) {
        return null;
    }

    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        if (item._id in locks.events) {
            return locks.events[item._id];
        } else if (get(item, 'recurrence_id') in locks.recurring) {
            return locks.recurring[item.recurrence_id];
        }

        break;

    case ITEM_TYPE.PLANNING:
        if (item._id in locks.planning) {
            return locks.planning[item._id];
        } else if (get(item, 'event_item') in locks.events) {
            return locks.events[item.event_item];
        } else if (get(item, 'recurrence_id') in locks.recurring) {
            return locks.recurring[item.recurrence_id];
        }

        break;

    default:
        if (item._id in locks.assignments) {
            return locks.assignments[item._id];
        }

        break;
    }

    return null;
};

export const getItemWorkflowState = (item) => (get(item, 'state', WORKFLOW_STATE.DRAFT));
export const isItemCancelled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.CANCELLED;
export const isItemRescheduled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.RESCHEDULED;
export const isItemKilled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.KILLED;
export const isItemPostponed = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.POSTPONED;

// eslint-disable-next-line complexity
export const getItemWorkflowStateLabel = (item) => {
    switch (getItemWorkflowState(item)) {
    case WORKFLOW_STATE.DRAFT:
        return {
            label: 'draft',
            iconHollow: true,
        };
    case WORKFLOW_STATE.SPIKED:
        return {
            label: 'spiked',
            iconType: 'alert',
        };
    case WORKFLOW_STATE.SCHEDULED:
        return {
            label: 'Scheduled',
            labelVerbose: 'Scheduled',
            iconType: 'success',
            tooltip: TOOLTIPS.scheduledState,
        };
    case WORKFLOW_STATE.KILLED:
        return {
            label: 'Killed',
            iconType: 'warning',
            tooltip: TOOLTIPS.withheldState,
        };
    case WORKFLOW_STATE.RESCHEDULED:
        return {
            label: 'Rescheduled',
            iconType: 'highlight2',
        };
    case WORKFLOW_STATE.CANCELLED:
        return {
            label: 'Cancelled',
            iconType: 'yellow2',
        };
    case WORKFLOW_STATE.POSTPONED:
        return {
            label: 'Postponed',
            iconType: 'yellow2',

        };
    case ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED:
        return {
            label: 'Assigned',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS:
        return {
            label: 'In Progress',
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED:
        return {
            label: 'Submitted',
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.COMPLETED:
        return {
            label: 'Completed',
            iconType: 'success',
        };
    }
};

export const getItemPublishedStateLabel = (item) => {
    switch (getPublishedState(item)) {
    case PUBLISHED_STATE.USABLE:
        return {
            label: 'P',
            labelVerbose: 'Published',
            iconType: 'success',
            tooltip: TOOLTIPS.publishedState,
        };

    case PUBLISHED_STATE.CANCELLED:
        return {
            label: 'Cancelled',
            iconType: 'yellow2',
        };
    }
};

export const isItemPublic = (item = {}) =>
    !!item && (typeof item === 'string' ?
        item === PUBLISHED_STATE.USABLE || item === PUBLISHED_STATE.CANCELLED :
        item.pubstatus === PUBLISHED_STATE.USABLE || item.pubstatus === PUBLISHED_STATE.CANCELLED);

export const isItemSpiked = (item) => item ?
    getItemWorkflowState(item) === WORKFLOW_STATE.SPIKED : false;

/**
 * Get the timezone offset
 * @param {Array} coverages
 * @returns {Array}
 */
export const getTimeZoneOffset = () => (moment().format('Z'));

export const getPublishedState = (item) => get(item, 'pubstatus', null);

export const sanitizeTextForQuery = (text) => (
    text.replace(/\//g, '\\/').replace(/[()]/g, '')
);

export function gettextCatalog(text, params = null) {
    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettextCatalog').getString(text);

        return params ? injector.get('$interpolate')(translated)(params) : translated;
    }

    return text;
}

export const getAssignmentPriority = (priorityQcode, priorities) => {
    // Returns default or given priority object
    if (priorityQcode) {
        return priorities.find((p) =>
            p.qcode === priorityQcode);
    } else {
        return priorities.find((p) =>
            p.qcode === 2);
    }
};

export const getItemsById = (ids, items) => (
    ids.map((id) => (items[id]))
);

export const getUsersForDesk = (desk, globalUserList = []) => {
    if (!desk) return globalUserList;

    return globalUserList.filter((user) =>
        map(desk.members, 'user').indexOf(user._id) !== -1);
};

export const getDesksForUser = (user, desksList = []) => {
    if (!user) return desksList;

    return desksList.filter((desk) =>
        map(desk.members, 'user').indexOf(user._id) !== -1);
};

export const getItemType = (item) => {
    const itemType = get(item, '_type');

    if (itemType === ITEM_TYPE.EVENT) {
        return ITEM_TYPE.EVENT;
    } else if (itemType === ITEM_TYPE.PLANNING) {
        return ITEM_TYPE.PLANNING;
    } else if (itemType === ITEM_TYPE.ASSIGNMENT) {
        return ITEM_TYPE.ASSIGNMENT;
    }

    return ITEM_TYPE.UNKNOWN;
};

export const getDateTimeString = (date, dateFormat, timeFormat) => (
    // !! Note - expects date as instance of moment() !! //
    date.format(dateFormat) + ' @ ' + date.format(timeFormat)
);

export const isEmptyActions = (actions) => {
    if (get(actions, 'length', 0) < 1) {
        return true;
    } else {
        // Do we have only dividers ?
        return actions.filter((action) =>
            action.label !== GENERIC_ITEM_ACTIONS.DIVIDER.label).length <= 0;
    }
};
