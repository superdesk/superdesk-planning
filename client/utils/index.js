import moment from 'moment'
import { get, set } from 'lodash'
import { createStore as _createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

export const eventIsAllDayLong = (dates) => (
    // is a multiple of 24h
    moment(dates.start).diff(moment(dates.end), 'minutes') % (24 * 60) === 0
)

export const RequiredFieldsValidator = (fields) => (
    values => {
        const errors = {}
        fields.forEach((field) => {
            if (!get(values, field)) {
                set(errors, field, 'Required')
            }
        })
        return errors
    }
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
                Promise.resolve([
                    { qname: 'test:sport', name: 'Sport' },
                    { qname: 'test:news', name: 'News' },
                ])
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
