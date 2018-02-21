import eventsPlanningApi from '../api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {getTimeZoneOffset} from '../../../utils';
import {MAIN} from '../../../constants';

describe('actions.eventsplanning.api', () => {
    let store;
    let services;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
    });

    describe('query', () => {
        it('fulltext search', (done) => {
            store.test(done, eventsPlanningApi.query({fulltext: 'search*'}))
                .then(() => {
                    expect(services.api('planning_search').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning_search').query.args[0][0].source);

                    expect(source.query.bool.must).toEqual([
                        {
                            query_string: {
                                query: '(search*)',
                                lenient: false,
                                default_operator: 'AND'
                            }
                        }
                    ]);

                    expect(source.filter.or.filters).toEqual([
                        {
                            and: {
                                filters: [
                                    {type: {value: 'events'}},
                                    {
                                        range: {
                                            'dates.end': {
                                                gte: 'now/d',
                                                time_zone: getTimeZoneOffset()
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            and: {
                                filters: [
                                    {type: {value: 'planning'}},
                                    {
                                        nested: {
                                            path: '_planning_schedule',
                                            filter: {
                                                range: {
                                                    '_planning_schedule.scheduled': {
                                                        gte: 'now/d',
                                                        time_zone: getTimeZoneOffset()
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]);

                    expect(source.sort).toEqual(
                        [
                            {
                                '_planning_schedule.scheduled': {
                                    order: 'asc',
                                    nested_path: '_planning_schedule'
                                },
                            },
                        ]
                    );
                    done();
                });
        });
    });

    describe('refetch', () => {
        beforeEach(() => {
            sinon.stub(eventsPlanningApi, 'query').callsFake(() => (Promise.resolve(['item'])));
        });

        afterEach(() => {
            restoreSinonStub(eventsPlanningApi.query);
        });

        it('refetch multiple times ', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;
            store.initialState.main.search.COMBINED.lastRequestParams.page = 3;

            store.test(done, eventsPlanningApi.refetch())
                .then((items) => {
                    expect(eventsPlanningApi.query.callCount).toBe(3);
                    expect(items.length).toBe(3);
                    expect(items).toEqual(['item', 'item', 'item']);
                    done();
                });
        });
    });
});