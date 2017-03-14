import moment from 'moment'
import { createStore as _createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import { get } from 'lodash'

export const eventIsAllDayLong = (dates) => (
    // is a multiple of 24h
    moment(dates.start).diff(moment(dates.end), 'minutes') % (24 * 60) === 0
)

export const createTestStore = (params={}) => {
    const { initialState={}, extraArguments={} } = params
    const mockedInitialState = {
        config: { server: { url: 'http://server.com' } }
    }
    const mockedExtraArguments = {
        $timeout: (cb) => (cb && cb()),
        $scope: { $apply: (cb) => (cb && cb()) },
        $location: { search: () => (undefined) },
        vocabularies: {
            getAllActiveVocabularies: () => (
                Promise.resolve({ _items: [
                    {
                        _id: 'categories',
                        items: [
                            { qcode: 'test:sport', name: 'Sport' },
                            { qcode: 'test:news', name: 'News' },
                        ]
                    },
                    {
                        _id: 'eventoccurstatus',
                        items: [
                            { qcode: 'eocstat:eos0', name: 'Unplanned event' },
                            { qcode: 'eocstat:eos1', name: 'Planned, occurence planned only' },
                        ]
                    }
                ] })
            )
        },
        upload: {
            start: (d) => (Promise.resolve(d))
        },
        api: (resource) => ({
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
                    Promise.resolve()
                }
            },

            save: (ori, item) => {
                if (extraArguments.apiSave) {
                    return Promise.resolve(extraArguments.apiSave(resource, ori, item))
                } else {
                    const response = { ...ori, ...item }
                    // if there is no id we add one
                    if (!response._id) {
                        response._id = Math.random().toString(36).substr(2, 10)
                    }
                    // reponse as a promise
                    return Promise.resolve(response)
                }
            },
        })
    }
    const middlewares = [
        // adds the mocked extra arguments to actions
        thunkMiddleware.withExtraArgument({ ...mockedExtraArguments, extraArguments })
    ]
    // return the store
    return _createStore(
        planningApp,
        { ...mockedInitialState, ...initialState },
        applyMiddleware.apply(null, middlewares)
    )
}

export const createStore = (params={}) => {
    const { initialState={}, extraArguments={} } = params
    const middlewares = [
        // logs actions
        createLogger(),
        // adds the extra arguments to actions
        thunkMiddleware.withExtraArgument(extraArguments)
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
        'borough'
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
        'islet'
    ]
    const areaField = areaHierarchy.find((area) =>
        nominatim.address.hasOwnProperty(area)
    )

    const address = {
        line: [
            `${get(nominatim.address, 'house_number', '')} ${get(nominatim.address, 'road', '')}`
            .trim()
        ],
        locality: get(nominatim.address, localityField),
        area: get(nominatim.address, areaField),
        country: nominatim.address.country,
        postal_code: nominatim.address.postcode,
        external: { nominatim },
    }
    const shortName = [
        get(address, 'line[0]'),
        get(address, 'locality'),
        get(address, 'postal_code'),
        get(address, 'country'),
    ].filter(d => d).join(', ')
    return { address, shortName }
}
