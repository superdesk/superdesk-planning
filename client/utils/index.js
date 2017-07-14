import moment from 'moment-timezone'
import { createStore as _createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import { get, set } from 'lodash'

export { default as checkPermission } from './checkPermission'
export { default as retryDispatch } from './retryDispatch'
export { default as registerNotifications } from './notifications'

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

export const createStore = (params={}) => {
    const { initialState={}, extraArguments={} } = params
    const middlewares = [
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
    const shortName = [
        get(address, nominatim.type), // Title of the place
        get(address, 'line[0]'),
        get(address, 'area'),
        get(address, 'locality'),
        get(address, 'postal_code'),
        get(address, 'country'),
    ].filter(d => d).join(', ')

    return {
        address,
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
 * Helper function to determine if the starting and ending dates
 * occupy entire day(s)
 * @param {moment} startingDate - A moment instance for the starting date/time
 * @param {moment} endingDate - A moment instance for the starting date/time
 * @return {boolean} If the date/times occupy entire day(s)
 */
export const isEventAllDay = (startingDate, endingDate) => {
    startingDate = moment(startingDate).clone()
    endingDate = moment(endingDate).clone()

    return startingDate.isSame(startingDate.clone().startOf('day')) &&
        endingDate.isSame(endingDate.clone().endOf('day').seconds(0).milliseconds(0))
}
