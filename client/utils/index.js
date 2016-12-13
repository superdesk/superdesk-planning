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

export const createStore = (params) => {
    params = params || {}
    let { initialState={}, testMode, extraArguments={} } = params
    let middlewares = []
    // Mock the extra arguments
    if (testMode) {
        extraArguments = {
            $timeout: (cb) => (cb && cb()),
            $scope: { $apply: (cb) => (cb && cb()) },
            $location: { search: () => (undefined) },
            api: (resource) => ({
                query: (q) =>  {
                    if (testMode.apiQuery) {
                        return Promise.resolve(testMode.apiQuery(resource, q))
                    } else {
                        return Promise.resolve({ _items: [] })
                    }
                },

                remove: (item) => {
                    if (testMode.apiRemove) {
                        return Promise.resolve(testMode.apiRemove(resource, item))
                    } else {
                        Promise.resolve()
                    }
                },

                save: (ori, item) => {
                    if (testMode.apiSave) {
                        return Promise.resolve(testMode.apiSave(resource, ori, item))
                    } else {
                        let response = {}
                        Object.assign(response, ori, item)
                        // if there is no id we add one
                        if (!response._id) {
                            const randId =  Math.random().toString(36).substr(2, 10)
                            Object.assign(response, item, { _id: randId })
                        }
                        // reponse as a promise
                        return Promise.resolve(response)
                    }
                },
            })
        }
    } else {
        // add a logger when it's not the test mode
        middlewares.push(createLogger())
    }

    // add the extra arguments
    middlewares.push(thunkMiddleware.withExtraArgument(extraArguments))
    // return the store
    return _createStore(
        planningApp,
        initialState,
        applyMiddleware.apply(null, middlewares)
    )
}
