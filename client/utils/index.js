import moment from 'moment-timezone';
import {createStore as _createStore, applyMiddleware} from 'redux';
import planningApp from '../reducers';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {get, set, map, cloneDeep, forEach} from 'lodash';
import {
    PUBLISHED_STATE,
    WORKFLOW_STATE,
    TOOLTIPS,
    ASSIGNMENTS,
    ITEM_TYPE,
    GENERIC_ITEM_ACTIONS,
    WORKSPACE,
    MAIN,
    SPIKED_STATE,
} from '../constants/index';
import * as testData from './testData';
import {gettext, gettextCatalog} from './gettext';
import {default as lockUtils} from './locks';
import {default as planningUtils} from './planning';


export {default as checkPermission} from './checkPermission';
export {default as dispatchUtils} from './dispatch';
export {default as registerNotifications} from './notifications';
export {default as eventUtils} from './events';
export {default as uiUtils} from './ui';
export {default as assignmentUtils} from './assignments';
export {default as stringUtils} from './strings';
export {gettext, gettextCatalog};
export {lockUtils};
export {planningUtils};

// Polyfill Promise.finally function as this was introduced in Chrome 63+
import promiseFinally from 'promise.prototype.finally';
promiseFinally.shim();

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
    } else if (get(error, 'data._error.message')) {
        return error.data._error.message;
    } else if (typeof error === 'string') {
        return error;
    }

    return defaultMessage;
};

export const notifyError = (notify, error, defaultMessage) => {
    const message = getErrorMessage(error, defaultMessage);

    if (Array.isArray(message)) {
        message.forEach((msg) => notify.error(msg));
    } else {
        notify.error(message);
    }
};

/**
 * Helper function to retrieve the user object using their ID from an item field or
 * the id of the ingest provider if created by being ingested
 * i.e. get the User object for 'original_creator'
 * @param {object} item - The item to get the ID from
 * @param {string} creator - The field name where the ID is stored
 * @param {Array} users - The array of users, typically from the redux store
 * @return {object} The user object found or ingest provider id, otherwise nothing is returned
 */
export const getCreator = (item, creator, users) => {
    const user = get(item, creator);

    if (user) {
        return user.display_name ? user : users.find((u) => u._id === user);
    }

    const ingestProvider = get(item, 'ingest_provider');

    if (ingestProvider) {
        return ingestProvider;
    }
};

export const getItemInArrayById = (items, id, field = '_id') => (
    id && Array.isArray(items) ? items.find((item) => get(item, field) === id) : null
);

export const isSameItemId = (item1, item2) => get(item1, '_id') === get(item2, '_id');
export const getItemWorkflowState = (item, field = 'state') => (get(item, field, WORKFLOW_STATE.DRAFT));
export const isItemCancelled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.CANCELLED;
export const isItemRescheduled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.RESCHEDULED;
export const isItemKilled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.KILLED;
export const isItemPostponed = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.POSTPONED;

export const getItemActionedStateLabel = (item) => {
    // Currently will cater for 'rescheduled from' scenario.
    // If we need to use this for 'dpulicate from' or any other, we can extend it

    if (item.reschedule_from) {
        return {
            label: gettext('Rescheduled From'),
            iconType: 'highlight2',
        };
    }
};

// eslint-disable-next-line complexity
export const getItemWorkflowStateLabel = (item, field = 'state') => {
    switch (getItemWorkflowState(item, field)) {
    case WORKFLOW_STATE.DRAFT:
        return {
            label: gettext('Draft'),
            iconHollow: true,
        };
    case WORKFLOW_STATE.SPIKED:
        return {
            label: gettext('Spiked'),
            iconType: 'alert',
        };
    case WORKFLOW_STATE.INGESTED:
        return {
            label: gettext('Ingested'),
            iconHollow: true,
        };
    case WORKFLOW_STATE.SCHEDULED:
        return {
            label: gettext('Scheduled'),
            labelVerbose: 'Scheduled',
            iconType: 'success',
            tooltip: TOOLTIPS.scheduledState,
        };
    case WORKFLOW_STATE.KILLED:
        return {
            label: gettext('Killed'),
            iconType: 'warning',
            tooltip: TOOLTIPS.withheldState,
        };
    case WORKFLOW_STATE.RESCHEDULED:
        return {
            label: gettext('Rescheduled'),
            iconType: 'highlight2',
        };
    case WORKFLOW_STATE.CANCELLED:
        return {
            label: gettext('Cancelled'),
            iconType: 'yellow2',
        };
    case WORKFLOW_STATE.POSTPONED:
        return {
            label: gettext('Postponed'),
            iconType: 'yellow2',

        };
    case ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED:
        return {
            label: gettext('Assigned'),
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS:
        return {
            label: gettext('In Progress'),
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED:
        return {
            label: gettext('Submitted'),
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.COMPLETED:
        return {
            label: gettext('Completed'),
            iconType: 'success',
        };
    }
};

export const getItemPublishedStateLabel = (item) => {
    switch (getPublishedState(item)) {
    case PUBLISHED_STATE.USABLE:
        return {
            label: 'P',
            labelVerbose: gettext('Published'),
            iconType: 'success',
            tooltip: TOOLTIPS.publishedState,
        };

    case PUBLISHED_STATE.CANCELLED:
        return {
            label: gettext('Cancelled'),
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

export const shouldLockItemForEdit = (item, lockedItems) =>
    get(item, '_id') && !lockUtils.getLock(item, lockedItems) && !isItemSpiked(item);

export const shouldUnLockItem = (item, session, currentWorkspace) =>
    (currentWorkspace === WORKSPACE.AUTHORING && planningUtils.isLockedForAddToPlanning(item)) ||
    (currentWorkspace !== WORKSPACE.AUTHORING && lockUtils.isItemLockedInThisSession(item, session));

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
    const itemType = get(item, 'type');

    if (itemType === ITEM_TYPE.EVENT) {
        return ITEM_TYPE.EVENT;
    } else if (itemType === ITEM_TYPE.PLANNING) {
        return ITEM_TYPE.PLANNING;
    } else if (itemType === ITEM_TYPE.ASSIGNMENT) {
        return ITEM_TYPE.ASSIGNMENT;
    } else if (_.includes([
        ITEM_TYPE.TEXT,
        ITEM_TYPE.COMPOSITE,
        ITEM_TYPE.GRAPHIC,
        ITEM_TYPE.VIDEO,
        ITEM_TYPE.PICTURE], itemType)) {
        return itemType;
    }

    return ITEM_TYPE.UNKNOWN;
};

export const getItemTypeString = (item) => {
    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        return gettext('Event');
    case ITEM_TYPE.PLANNING:
        return gettext('Planning Item');
    case ITEM_TYPE.ASSIGNMENT:
        return gettext('Assignment');
    case ITEM_TYPE.TEXT:
        return gettext('Text');
    case ITEM_TYPE.PICTURE:
        return gettext('Picture');
    case ITEM_TYPE.VIDEO:
        return gettext('Video');
    case ITEM_TYPE.GRAPHIC:
        return gettext('Graphic');
    case ITEM_TYPE.COMPOSITE:
        return gettext('Composite');
    case ITEM_TYPE.AUDIO:
        return gettext('Audio');
    default:
        return gettext('Item');
    }
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

export const onEventCapture = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

export const isDateInRange = (inputDate, startDate, endDate) => {
    if (!inputDate) {
        return false;
    }

    if (startDate && moment(inputDate).isBefore(startDate, 'seconds') ||
        endDate && moment(inputDate).isSameOrAfter(endDate, 'seconds')) {
        return false;
    }

    return true;
};

export const getSearchDateRange = (currentSearch) => {
    const dates = get(currentSearch, 'advancedSearch.dates', {});
    const dateRange = {startDate: null, endDate: null};

    if (!get(dates, 'start') && !get(dates, 'end') && !get(dates, 'range')) {
        dateRange.startDate = moment(moment().format('YYYY-MM-DD'), 'YYYY-MM-DD', true);
        dateRange.endDate = moment().add(999, 'years');
    } else if (get(dates, 'range')) {
        let range = get(dates, 'range');

        if (range === 'today') {
            dateRange.startDate = moment(moment().format('YYYY-MM-DD'), 'YYYY-MM-DD', true);
            dateRange.endDate = dateRange.startDate.clone().add('86399', 'seconds');
        }

        if (range === 'last24') {
            dateRange.endDate = moment();
            dateRange.startDate = dateRange.endDate.clone().subtract('86400', 'seconds');
        }

        if (range === 'week') {
            dateRange.startDate = moment(moment().format('YYYY-MM-DD'), 'YYYY-MM-DD', true);
            dateRange.endDate = dateRange.startDate.clone().add('7', 'days');
        }
    } else {
        if (get(dates, 'start')) {
            dateRange.startDate = moment(get(dates, 'start'));
        }

        if (get(dates, 'end')) {
            dateRange.endDate = moment(get(dates, 'end'));
        }
    }
    return dateRange;
};

export const getMapUrl = (url, name, address) => (`${url}${name} ${address}`);

export const updateFormValues = (diff, field, value) => {
    if (typeof field === 'string') {
        set(diff, field, value);
    } else if (typeof field === 'object') {
        forEach(field, (val, key) => set(diff, key, val));
    }
};

export const getWorkFlowStateAsOptions = (activeFilter = null) => {
    let workflowStateOptions = [];

    Object.keys(WORKFLOW_STATE).forEach((key) => {
        if (key === 'SPIKED' || key === 'INGESTED' &&
            [MAIN.FILTERS.COMBINED, MAIN.FILTERS.PLANNING].includes(activeFilter)) {
            return;
        }

        workflowStateOptions.push({
            qcode: WORKFLOW_STATE[key],
            name: WORKFLOW_STATE[key]
        });
    });

    return workflowStateOptions;
};

export const appendStatesQueryForAdvancedSearch = (advancedSearch, spikeState, mustNotTerms, mustTerms) => {
    let states = (advancedSearch.state || []).map((s) => s.qcode);

    switch (spikeState) {
    case SPIKED_STATE.NOT_SPIKED:
        mustNotTerms.push({term: {state: WORKFLOW_STATE.SPIKED}});
        break;

    case SPIKED_STATE.SPIKED:
        mustTerms.push({term: {state: WORKFLOW_STATE.SPIKED}});
        break;

    case SPIKED_STATE.BOTH:
    default:
        // Push spiked state only if other states are selected
        // Else, it will be fetched anyway
        if (states.length > 0) {
            states.push(WORKFLOW_STATE.SPIKED);
        }
    }

    if (spikeState !== SPIKED_STATE.SPIKED && states.length > 0) {
        mustTerms.push({terms: {state: states}});
    }
};
