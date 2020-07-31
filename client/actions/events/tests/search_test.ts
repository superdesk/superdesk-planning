import sinon from 'sinon';
import moment from 'moment-timezone';

import {SPIKED_STATE, WORKFLOW_STATE, MAIN} from '../../../constants';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import eventsApi from '../api';
import {getTimeZoneOffset, timeUtils} from '../../../utils';
import {IEventSearchParams} from '../../../interfaces';

describe('actions.events.search', () => {
    let store;
    let services;
    let timezone = getTimeZoneOffset();

    const defaultMust = [];
    const defaultMustNot = [
        {term: {state: WORKFLOW_STATE.SPIKED}},
        {term: {state: WORKFLOW_STATE.KILLED}},
    ];
    const defaultFilter = [{
        range: {
            'dates.end': {
                gte: 'now/d',
                time_zone: timezone,
            },
        },
    }];

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
    });

    function testQuery(done, params: IEventSearchParams, source) {
        store.test(done, eventsApi.query(params))
            .then(() => {
                expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify(source),
                })]);
                done();
            })
            .catch(done.fail);
    }

    it('default search query', (done) => {
        testQuery(done, {}, {
            query: {
                bool: {
                    must: defaultMust,
                    must_not: defaultMustNot,
                    filter: defaultFilter,
                },
            },
        });
    });

    it('searchItemIds', (done) => {
        testQuery(
            done,
            {
                ids: ['e1', 'e2'],
                onlyFuture: false,
            },
            {
                query: {
                    bool: {
                        must: [
                            {terms: {_id: ['e1', 'e2']}},
                        ],
                        must_not: defaultMustNot,
                        filter: [],
                    },
                },
            }
        );
    });

    it('searchFulltext', (done) => {
        testQuery(
            done,
            {fulltext: 'Search Event*'},
            {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: 'Search Event*',
                                lenient: true,
                                default_operator: 'AND',
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchRecurrenceId', (done) => {
        testQuery(
            done,
            {
                recurrenceId: 'rec1',
                onlyFuture: false,
            },
            {
                query: {
                    bool: {
                        must: [
                            {term: {recurrence_id: 'rec1'}},
                        ],
                        must_not: defaultMustNot,
                        filter: [],
                    },
                },
            }
        );
    });

    it('searchName', (done) => {
        testQuery(
            done,
            {
                advancedSearch: {name: 'RecurringEvent'},
            },
            {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: 'name:(RecurringEvent)',
                                lenient: false,
                                default_operator: 'AND',
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchReference', (done) => {
        testQuery(
            done,
            {advancedSearch: {reference: '2020ev1'}},
            {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: 'reference:(2020ev1)',
                                lenient: false,
                                default_operator: 'AND',
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchSource', (done) => {
        testQuery(
            done,
            {
                advancedSearch: {
                    source: [{
                        id: 'ingest123',
                        name: 'AFP',
                    }],
                },
            },
            {
                query: {
                    bool: {
                        must: [
                            {terms: {ingest_provider: ['ingest123']}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchLocation: by object', (done) => {
        testQuery(
            done,
            {advancedSearch: {location: {name: 'some place'}}},
            {
                query: {
                    bool: {
                        must: [
                            {match_phrase: {'location.name': 'some place'}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchLocation: by string', (done) => {
        testQuery(
            done,
            {advancedSearch: {location: 'some place'}},
            {
                query: {
                    bool: {
                        must: [
                            {match_phrase: {'location.name': 'some place'}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchCalendars: multiple', (done) => {
        testQuery(
            done,
            {calendars: ['sport', 'finance']},
            {
                query: {
                    bool: {
                        must: [
                            {terms: {'calendars.qcode': ['sport', 'finance']}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchCalendars: single', (done) => {
        testQuery(
            done,
            {calendars: ['sport']},
            {
                query: {
                    bool: {
                        must: [
                            {term: {'calendars.qcode': 'sport'}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchNoCalendarAssigned', (done) => {
        testQuery(
            done,
            {noCalendarAssigned: true},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: [
                            {constant_score: {filter: {exists: {field: 'calendars'}}}},
                            ...defaultMustNot,
                        ],
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchAnpaCategory', (done) => {
        testQuery(
            done,
            {advancedSearch: {anpa_category: [{qcode: 'qcode1', name: 'Category 1'}]}},
            {
                query: {
                    bool: {
                        must: [{
                            terms: {'anpa_category.qcode': ['qcode1']}
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchSubject', (done) => {
        testQuery(
            done,
            {
                advancedSearch: {subject: [{qcode: 'sub1'}]},
            },
            {
                query: {
                    bool: {
                        must: [{
                            terms: {'subject.qcode': ['sub1']},
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchPlace', (done) => {
        testQuery(
            done,
            {
                advancedSearch: {place: [{qcode: 'pl1'}]},
            },
            {
                query: {
                    bool: {
                        must: [{
                            terms: {'place.qcode': ['pl1']},
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchSlugline', (done) => {
        testQuery(
            done,
            {advancedSearch: {slugline: 'slugger'}},
            {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: 'slugline:(slugger)',
                                lenient: false,
                                default_operator: 'AND',
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchPosted: true', (done) => {
        testQuery(
            done,
            {advancedSearch: {posted: true}},
            {
                query: {
                    bool: {
                        must: [{
                            term: {pubstatus: 'usable'},
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    it('searchPosted: false', (done) => {
        testQuery(
            done,
            {advancedSearch: {posted: false}},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
            }
        );
    });

    describe('appendStatesQueryForAdvancedSearch', () => {
        it('by workflow state', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        state: [{
                            qcode: 'postponed',
                            name: 'postponed',
                        }, {
                            qcode: 'rescheduled',
                            name: 'rescheduled',
                        }],
                    },
                },
                {
                    query: {
                        bool: {
                            must: [{
                                terms: {state: ['postponed', 'rescheduled']},
                            }],
                            must_not: defaultMustNot,
                            filter: defaultFilter,
                        },
                    },
                }
            );
        });

        it('by workflow state including spiked items', (done) => {
            testQuery(
                done,
                {
                    spikeState: SPIKED_STATE.BOTH,
                    advancedSearch: {
                        state: [{
                            qcode: 'postponed',
                            name: 'postponed',
                        }, {
                            qcode: 'rescheduled',
                            name: 'rescheduled',
                        }],
                    },
                },
                {
                    query: {
                        bool: {
                            must: [
                                {terms: {state: ['postponed', 'rescheduled', 'spiked']}},
                            ],
                            must_not: [{term: {state: WORKFLOW_STATE.KILLED}}],
                            filter: defaultFilter,
                        },
                    },
                }
            );
        });
    });

    describe('dates', () => {
        it('searchDateToday', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {range: MAIN.DATE_RANGE.TODAY}
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        range: {
                                            'dates.start': {
                                                gte: 'now/d',
                                                lt: 'now+24h/d',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        range: {
                                            'dates.end': {
                                                gte: 'now/d',
                                                lt: 'now+24h/d',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        bool: {
                                            must: [{
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now/d',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now+24h/d',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });

        it('searchDateTomorrow', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            range: MAIN.DATE_RANGE.TOMORROW,
                        },
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        range: {
                                            'dates.start': {
                                                gte: 'now+24h/d',
                                                lt: 'now+48h/d',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        range: {
                                            'dates.end': {
                                                gte: 'now+24h/d',
                                                lt: 'now+48h/d',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        bool: {
                                            must: [{
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now+24h/d',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now+48h/d',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });

        it('searchDateLast24hrs', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            range: MAIN.DATE_RANGE.LAST_24,
                        },
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        range: {
                                            'dates.start': {
                                                gte: 'now-24h',
                                                lt: 'now',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        range: {
                                            'dates.end': {
                                                gte: 'now-24h',
                                                lt: 'now',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        bool: {
                                            must: [{
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now-24h',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });

        describe('week search', () => {
            beforeEach(() => {
                sinon.stub(timeUtils, 'getStartOfNextWeek')
                    .returns(moment('2020-07-12'));
            });

            afterEach(() => {
                restoreSinonStub(timeUtils.getStartOfNextWeek);
            });

            it('searchDateThisWeek', (done) => {
                testQuery(
                    done,
                    {
                        advancedSearch: {
                            dates: {
                                range: MAIN.DATE_RANGE.THIS_WEEK,
                            },
                        },
                    },
                    {
                        query: {
                            bool: {
                                must: defaultMust,
                                must_not: defaultMustNot,
                                filter: [{
                                    bool: {
                                        minimum_should_match: 1,
                                        should: [{
                                            range: {
                                                'dates.start': {
                                                    gte: '2020-07-05||/d',
                                                    lt: '2020-07-12||/d',
                                                    time_zone: timezone,
                                                },
                                            },
                                        }, {
                                            range: {
                                                'dates.end': {
                                                    gte: '2020-07-05||/d',
                                                    lt: '2020-07-12||/d',
                                                    time_zone: timezone,
                                                },
                                            },
                                        }, {
                                            bool: {
                                                must: [{
                                                    range: {
                                                        'dates.start': {
                                                            lt: '2020-07-05||/d',
                                                            time_zone: timezone,
                                                        },
                                                    },
                                                }, {
                                                    range: {
                                                        'dates.end': {
                                                            gte: '2020-07-12||/d',
                                                            time_zone: timezone,
                                                        },
                                                    },
                                                }],
                                            },
                                        }],
                                    },
                                }],
                            },
                        },
                    }
                );
            });

            it('searchDateNextWeek', (done) => {
                testQuery(
                    done,
                    {
                        advancedSearch: {
                            dates: {
                                range: MAIN.DATE_RANGE.NEXT_WEEK,
                            },
                        },
                    },
                    {
                        query: {
                            bool: {
                                must: defaultMust,
                                must_not: defaultMustNot,
                                filter: [{
                                    bool: {
                                        minimum_should_match: 1,
                                        should: [{
                                            range: {
                                                'dates.start': {
                                                    gte: '2020-07-12||/d',
                                                    lt: '2020-07-19||/d',
                                                    time_zone: timezone,
                                                },
                                            },
                                        }, {
                                            range: {
                                                'dates.end': {
                                                    gte: '2020-07-12||/d',
                                                    lt: '2020-07-19||/d',
                                                    time_zone: timezone,
                                                },
                                            },
                                        }, {
                                            bool: {
                                                must: [{
                                                    range: {
                                                        'dates.start': {
                                                            lt: '2020-07-12||/d',
                                                            time_zone: timezone,
                                                        },
                                                    },
                                                }, {
                                                    range: {
                                                        'dates.end': {
                                                            gte: '2020-07-19||/d',
                                                            time_zone: timezone,
                                                        },
                                                    },
                                                }],
                                            },
                                        }],
                                    },
                                }],
                            },
                        },
                    }
                );
            });
        });

        it('searchDateStart', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        range: {
                                            'dates.start': {
                                                gte: '2020-07-22T14:00:00.000Z',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        range: {
                                            'dates.end': {
                                                gte: '2020-07-22T14:00:00.000Z',
                                                time_zone: timezone,
                                            },
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });

        it('searchDateEnd', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        range: {
                                            'dates.start': {
                                                lte: '2020-07-22T14:00:00.000Z',
                                                time_zone: timezone,
                                            },
                                        },
                                    }, {
                                        range: {
                                            'dates.end': {
                                                lte: '2020-07-22T14:00:00.000Z',
                                                time_zone: timezone,
                                            },
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });

        it('searchDateRange', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-16T00:00:00', 'Australia/Sydney'),
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    query: {
                        bool: {
                            must: defaultMust,
                            must_not: defaultMustNot,
                            filter: [{
                                bool: {
                                    minimum_should_match: 1,
                                    should: [{
                                        bool: {
                                            must: [{
                                                range: {
                                                    'dates.start': {
                                                        gte: '2020-07-15T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        lte: '2020-07-22T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }, {
                                        bool: {
                                            must: [{
                                                range: {
                                                    'dates.start': {
                                                        lt: '2020-07-15T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        gt: '2020-07-22T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }, {
                                        bool: {
                                            minimum_should_match: 1,
                                            should: [{
                                                range: {
                                                    'dates.start': {
                                                        gte: '2020-07-15T14:00:00.000Z',
                                                        lte: '2020-07-22T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }, {
                                                range: {
                                                    'dates.end': {
                                                        gte: '2020-07-15T14:00:00.000Z',
                                                        lte: '2020-07-22T14:00:00.000Z',
                                                        time_zone: timezone,
                                                    },
                                                },
                                            }],
                                        },
                                    }],
                                },
                            }],
                        },
                    },
                }
            );
        });
    });
});
