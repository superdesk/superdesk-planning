import moment from 'moment-timezone';
import eventsPlanningApi from '../api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
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
            const params = {
                fulltext: 'search*',
                advancedSearch: {
                    anpa_category: [{qcode: 't', name: 'test'}, {qcode: 'r', name: 'foo'}],
                    subject: [{qcode: 'y', name: 'test'}, {qcode: 'x', name: 'foo'}],
                    state: [{qcode: 'foo', name: 'test'}, {qcode: 'bar', name: 'foo'}],
                    posted: true,
                    slugline: 'slugline',
                    dates: {
                        range: 'today',
                        start: moment('2018-06-01T00:00:00+1000'),
                        end: moment('2018-06-02T00:00:00+1000'),
                    },
                },
                maxResults: 50,
                page: 2,
                spikeState: 'draft',
            };

            store.test(done, eventsPlanningApi.query(params))
                .then(() => {
                    expect(services.api('events_planning_search').query.callCount).toBe(1);
                    const args = services.api('events_planning_search').query.args[0][0];

                    expect(args.max_results).toBe(50);
                    expect(args.full_text).toBe('search*');
                    expect(args.page).toBe(2);
                    expect(args.anpa_category).toBe('["t","r"]');
                    expect(args.subject).toBe('["y","x"]');
                    expect(args.state).toBe('["foo","bar"]');
                    expect(args.posted).toBe(true);
                    expect(args.slugline).toBe('slugline');
                    expect(args.date_filter).toBe('today');
                    expect(args.start_date).toBe('2018-05-31T14:00:00+0000');
                    expect(args.end_date).toBe('2018-06-01T14:00:00+0000');
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });
    });
});