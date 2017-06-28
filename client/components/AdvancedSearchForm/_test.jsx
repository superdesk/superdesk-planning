import React from 'react'
import { mount } from 'enzyme'
import { AdvancedSearchForm } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import moment from 'moment'

describe('events', () => {
    describe('containers', () => {
        describe('<AdvancedSearchForm />', () => {
            function checkQueryForParameters({ params, expectedQuery }) {
                return new Promise((resolve) => {
                    let store = createTestStore({
                        extraArguments: {
                            apiQuery: (resource, q) => {
                                expect(JSON.parse(q.source)).toEqual(expectedQuery)
                                resolve()
                            },
                        },
                    })
                    const wrapper = mount(
                        <Provider store={store}>
                            <AdvancedSearchForm initialValues={params} />
                        </Provider>
                    )
                    wrapper.find('form').simulate('submit')
                })
            }

            it('clear the form', () => {
                const store = createTestStore()
                const wrapper = mount(
                    <Provider store={store}>
                        <AdvancedSearchForm />
                    </Provider>
                )
                wrapper.find('[name="clear"] button').simulate('click')
            })

            it('search by name', (done) => (
                Promise.resolve(checkQueryForParameters({
                    params: { name: 'a name' },
                    expectedQuery: {
                        query: {
                            bool: {
                                must: [
                                    { query_string: { query: 'a name' } },
                                ],
                                must_not: [
                                    { term: { state: 'spiked' } },
                                ],
                            },
                        },
                        filter: {},
                    },
                }))
                .then(done)
            ))

            it('search multiple', (done) => (
                Promise.resolve(checkQueryForParameters({
                    params: {
                        name: 'a name',
                        anpa_category: [{ qcode: 'cat' }],
                        location: 'paris',
                    },
                    expectedQuery: {
                        query: {
                            bool: {
                                must: [
                                    { query_string: { query: 'a name' } },
                                    { term: { 'location.name': 'paris' } },
                                    { term: { 'anpa_category.qcode': 'cat' } },
                                ],
                                must_not: [
                                    { term: { state: 'spiked' } },
                                ],
                            },
                        },
                        filter: {},
                    },
                }))
                .then(done)
            ))

            it('search by date range', (done) => (
                Promise.resolve(checkQueryForParameters({
                    params: {
                        dates: {
                            start: moment.utc('2016-01-01'),
                            end: moment.utc('2017-01-01'),
                        },
                    },
                    expectedQuery: {
                        query: {
                            bool: {
                                must: [],
                                must_not: [
                                    { term: { state: 'spiked' } },
                                ],
                            },
                        },
                        filter: {
                            range: {
                                'dates.start': { gte: '2016-01-01T00:00:00.000Z' },
                                'dates.end': { lte: '2017-01-01T00:00:00.000Z' },
                            },
                        },
                    },
                }))
                .then(done)
            ))

            it('search spiked', (done) => (
                Promise.resolve({
                    params: {
                        state: 'spiked',
                        name: 'a name',
                    },
                    expectedQuery: {
                        query: {
                            bool: {
                                must: [
                                    { query_string: { query: 'a name' } },
                                    { term: { state: 'spiked' } },
                                ],
                                must_not: [],
                            },
                        },
                        filter: {},
                    },
                })
                .then(done)
            ))

            it('search spiked and active', (done) => (
                Promise.resolve({
                    params: {
                        state: 'all',
                        name: 'a name',
                    },
                    expectedQuery: {
                        query: {
                            bool: {
                                must: [
                                    { query_string: { query: 'a name' } },
                                ],
                                must_not: [],
                            },
                        },
                        filter: {},
                    },
                })
                .then(done)
            ))
        })
    })
})
