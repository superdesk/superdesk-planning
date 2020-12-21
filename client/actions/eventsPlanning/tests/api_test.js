import moment from 'moment-timezone';
import eventsPlanningApi from '../api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {MAIN} from '../../../constants';
import {planningApis} from '../../../api';

describe('actions.eventsplanning.api', () => {
    let store;

    beforeEach(() => {
        store = getTestActionStore();

        sinon.stub(planningApis.combined, 'search').callsFake(
            () => Promise.resolve({_items: []})
        );
    });

    afterEach(() => {
        restoreSinonStub(planningApis.combined.search);
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
                    expect(planningApis.combined.search.callCount).toBe(1);
                    expect(planningApis.combined.search.args[0]).toEqual([jasmine.objectContaining({
                        max_results: params.maxResults,
                        full_text: params.fulltext,
                        page: params.page,
                        anpa_category: params.advancedSearch.anpa_category,
                        subject: params.advancedSearch.subject,
                        state: params.advancedSearch.state,
                        posted: params.advancedSearch.posted,
                        slugline: params.advancedSearch.slugline,
                        date_filter: params.advancedSearch.dates.range,
                        start_date: params.advancedSearch.dates.start,
                        end_date: params.advancedSearch.dates.end,
                        spike_state: params.spikeState,
                    })]);

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
