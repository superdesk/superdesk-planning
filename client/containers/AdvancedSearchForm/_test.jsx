import React from 'react'
import { mount } from 'enzyme'
import { AdvancedSearchForm } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import moment from 'moment'

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

    it('clicks on the clear', () => {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <AdvancedSearchForm />
            </Provider>
        )
        wrapper.find('[name="clear"] button').simulate('click')
    })

    it('perfrom a search', (done) => {
        Promise.all([
            {
                params: { name: 'a name' },
                expectedQuery: {
                    query: {
                        bool: {
                            should: [
                        { match: { name: 'a name' } },
                        { match: { definition_short: 'a name' } },
                            ],
                        },
                    },
                    filter: {},
                },
            },
            {
                params: {
                    name: 'a name',
                    anpa_category: [{ qcode: 'cat' }],
                    location: 'paris',
                },
                expectedQuery: {
                    query: {
                        bool: {
                            should: [
                        { match: { name: 'a name' } },
                        { match: { definition_short: 'a name' } },
                        { match: { 'location.name': 'paris' } },
                        { match: { 'anpa_category.qcode': 'cat' } },
                            ],
                        },
                    },
                    filter: {},
                },
            },
            {
                params: {
                    dates: {
                        start: moment.utc('2016-01-01'),
                        end: moment.utc('2017-01-01'),
                    },
                },
                expectedQuery: {
                    query: {},
                    filter: {
                        range: {
                            'dates.start': { gte: '2016-01-01T00:00:00.000Z' },
                            'dates.end': { lte: '2017-01-01T00:00:00.000Z' },
                        },
                    },
                },
            },
        ].map((test) => (checkQueryForParameters(test))))
        .then(done)
    })
})
