import sinon from 'sinon';
import moment from 'moment-timezone';

import {WORKFLOW_STATE, POST_STATE, MAIN} from '../../../constants';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import planningApi from '../api';
import {getTimeZoneOffset, timeUtils} from '../../../utils';
import {IPlanningSearchParams} from '../../../interfaces';

describe('actions.planning.search', () => {
    let store;
    let services;
    let timezone = getTimeZoneOffset();

    const defaultMust = [];
    const defaultMustNot = [
        {term: {state: WORKFLOW_STATE.KILLED}},
    ];
    const defaultFilter = [{
        nested: {
            path: '_planning_schedule',
            query: {
                bool: {
                    filter: {
                        range: {
                            '_planning_schedule.scheduled': {
                                gte: 'now/d',
                                time_zone: timezone,
                            },
                        },
                    },
                },
            },
        },
    }];
    const defaultSort = [{
        '_planning_schedule.scheduled': {
            order: 'asc',
            nested: {
                path: '_planning_schedule',
                filter: {
                    range: {
                        '_planning_schedule.scheduled': {
                            gte: 'now/d',
                            time_zone: timezone,
                        },
                    },
                },
            },
        },
    }];

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
    });

    function testQuery(done, params: IPlanningSearchParams, source) {
        store.test(done, planningApi.query(
            params,
            true,
            params.timezoneOffset ?? null,
            params.includeScheduledUpdates ?? false
        ))
            .then(() => {
                expect(services.api('planning').query.args[0]).toEqual([jasmine.objectContaining({
                    source: JSON.stringify(source),
                })]);
                done();
            })
            .catch(done.fail);
    }

    function testDateQuery(done, params, query) {
        testQuery(
            done,
            params,
            {
                query: {
                    bool: {
                        must: query.must || defaultMust,
                        must_not: query.must_not || defaultMustNot,
                        filter: [{
                            nested: {
                                path: '_planning_schedule',
                                query: {
                                    bool: {
                                        filter: {
                                            range: {
                                                '_planning_schedule.scheduled': query.range,
                                            },
                                        },
                                    },
                                },
                            },
                        }],
                    },
                },
                sort: query.sort || [{
                    '_planning_schedule.scheduled': {
                        order: 'asc',
                        nested: {
                            path: '_planning_schedule',
                            filter: {
                                range: {
                                    '_planning_schedule.scheduled': query.range,
                                },
                            },
                        },
                    },
                }]
            }
        );
    }

    function testDateQueryWithScheduledUpdates(done, params, query) {
        testQuery(
            done,
            params,
            {
                query: {
                    bool: {
                        must: query.must || defaultMust,
                        must_not: query.must_not || defaultMustNot,
                        filter: [{
                            bool: {
                                minimum_should_match: 1,
                                should: [{
                                    nested: {
                                        path: '_planning_schedule',
                                        query: {
                                            bool: {
                                                filter: {
                                                    range: {
                                                        '_planning_schedule.scheduled': query.range,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                }, {
                                    nested: {
                                        path: '_updates_schedule',
                                        query: {
                                            bool: {
                                                filter: {
                                                    range: {
                                                        '_updates_schedule.scheduled': query.range,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                }],
                            },
                        }],
                    },
                },
                sort: query.sort || [{
                    '_planning_schedule.scheduled': {
                        order: 'asc',
                        nested: {
                            path: '_planning_schedule',
                            filter: {
                                range: {
                                    '_planning_schedule.scheduled': {
                                        gte: 'now/d',
                                        time_zone: query.range.time_zone,
                                    },
                                },
                            },
                        },
                    },
                }]
            }
        );
    }

    it('default search query', (done) => {
        testQuery(done, {}, {
            query: {
                bool: {
                    must: defaultMust,
                    must_not: defaultMustNot,
                    filter: defaultFilter,
                }
            },
            sort: defaultSort,
        });
    });

    it('searchAgendas', (done) => {
        testQuery(
            done,
            {agendas: ['a1', 'a2']},
            {
                query: {
                    bool: {
                        must: [
                            {terms: {agendas: ['a1', 'a2']}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchNoAgendaAssigned', (done) => {
        testQuery(
            done,
            {noAgendaAssigned: true},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: [
                            {constant_score: {filter: {exists: {field: 'agendas'}}}},
                            ...defaultMustNot,
                        ],
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchFulltext', (done) => {
        testQuery(
            done,
            {fulltext: 'Search Plans*'},
            {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: 'Search Plans*',
                                lenient: true,
                                default_operator: 'AND',
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            }
        );
    });

    it('searchAdHocPlanning', (done) => {
        testQuery(
            done,
            {adHocPlanning: true},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: [
                            {constant_score: {filter: {exists: {field: 'event_item'}}}},
                            ...defaultMustNot,
                        ],
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchExcludeRescheduledAndCancelled', (done) => {
        testQuery(
            done,
            {excludeRescheduledAndCancelled: true},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: [
                            {terms: {state: [WORKFLOW_STATE.RESCHEDULED, WORKFLOW_STATE.CANCELLED]}},
                            ...defaultMustNot,
                        ],
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    describe('searchSlugline', () => {
        it('not including coverages', (done) => {
            testQuery(
                done,
                {
                    advancedSearch: {
                        slugline: 'TestSlug',
                        noCoverage: true,
                    },
                },
                {
                    query: {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        minimum_should_match: 1,
                                        should: [{
                                            query_string: {
                                                query: 'slugline:(TestSlug)',
                                                lenient: false,
                                                default_operator: 'AND',
                                            },
                                        }],
                                    },
                                },
                                ...defaultMust,
                            ],
                            must_not: [
                                {
                                    nested: {
                                        path: 'coverages',
                                        query: {
                                            constant_score: {
                                                filter: {
                                                    exists: {
                                                        field: 'coverages.coverage_id',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                ...defaultMustNot,
                            ],
                            filter: defaultFilter,
                        },
                    },
                    sort: defaultSort,
                },
            );
        });

        it('including coverages', (done) => {
            testQuery(
                done,
                {advancedSearch: {slugline: 'TestSlug'}},
                {
                    query: {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        minimum_should_match: 1,
                                        should: [{
                                            query_string: {
                                                query: 'slugline:(TestSlug)',
                                                lenient: false,
                                                default_operator: 'AND',
                                            },
                                        }, {
                                            nested: {
                                                path: 'coverages',
                                                query: {
                                                    bool: {
                                                        must: [{
                                                            query_string: {
                                                                query: 'coverages.planning.slugline:(TestSlug)',
                                                                lenient: false,
                                                                default_operator: 'AND'
                                                            }
                                                        }]
                                                    }
                                                }
                                            }
                                        }],
                                    },
                                },
                                ...defaultMust,
                            ],
                            must_not: defaultMustNot,
                            filter: defaultFilter,
                        },
                    },
                    sort: defaultSort,
                },
            );
        });
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
                sort: defaultSort,
            },
        );
    });

    it('searchSubject', (done) => {
        testQuery(
            done,
            {advancedSearch: {subject: [{qcode: 'sub1'}]}},
            {
                query: {
                    bool: {
                        must: [{
                            terms: {'subject.code': ['sub1']},
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchUrgency', (done) => {
        testQuery(
            done,
            {advancedSearch: {urgency: {qcode: '3'}}},
            {
                query: {
                    bool: {
                        must: [{
                            term: {urgency: '3'},
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchG2ContentType', (done) => {
        testQuery(
            done,
            {advancedSearch: {g2_content_type: {qcode: 'photo'}}},
            {
                query: {
                    bool: {
                        must: [{
                            nested: {
                                path: 'coverages',
                                query: {
                                    bool: {
                                        must: {
                                            term: {'coverages.planning.g2_content_type': 'photo'},
                                        },
                                    },
                                },
                            },
                        }],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchNoCoverage', (done) => {
        testQuery(
            done,
            {advancedSearch: {noCoverage: true}},
            {
                query: {
                    bool: {
                        must: defaultMust,
                        must_not: [
                            {
                                nested: {
                                    path: 'coverages',
                                    query: {
                                        constant_score: {filter: {exists: {field: 'coverages.coverage_id'}}},
                                    },
                                },
                            },
                            ...defaultMustNot,
                        ],
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchPosted', (done) => {
        testQuery(
            done,
            {advancedSearch: {posted: true}},
            {
                query: {
                    bool: {
                        must: [
                            {term: {pubstatus: POST_STATE.USABLE}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchFeatured', (done) => {
        testQuery(
            done,
            {advancedSearch: {featured: true}},
            {
                query: {
                    bool: {
                        must: [
                            {term: {featured: true}},
                        ],
                        must_not: defaultMustNot,
                        filter: defaultFilter,
                    },
                },
                sort: defaultSort,
            },
        );
    });

    it('searchPlace', (done) => {
        testQuery(
            done,
            {advancedSearch: {place: [{qcode: 'pl1'}]}},
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
                sort: defaultSort,
            },
        );
    });

    describe('dates', () => {
        it('searchToday', (done) => {
            testDateQuery(
                done,
                {advancedSearch: {dates: {range: MAIN.DATE_RANGE.TODAY}}},
                {
                    range: {
                        gte: 'now/d',
                        lt: 'now+24h/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchTomorrow', (done) => {
            testDateQuery(
                done,
                {advancedSearch: {dates: {range: MAIN.DATE_RANGE.TOMORROW}}},
                {
                    range: {
                        gte: 'now+24h/d',
                        lt: 'now+48h/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchLast24Hours', (done) => {
            testDateQuery(
                done,
                {advancedSearch: {dates: {range: MAIN.DATE_RANGE.LAST_24}}},
                {
                    range: {
                        gte: 'now-24h',
                        lt: 'now',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchForDate', (done) => {
            testDateQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            range: MAIN.DATE_RANGE.FOR_DATE,
                            start: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-23||/d',
                        lt: '2020-07-24||/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchStartDate', (done) => {
            testDateQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchEndDate', (done) => {
            testDateQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        lte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchDateRange', (done) => {
            testDateQuery(
                done,
                {
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-12T00:00:00', 'Australia/Sydney'),
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-11T14:00:00.000Z',
                        lte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
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

            it('searchThisWeek', (done) => {
                testDateQuery(
                    done,
                    {advancedSearch: {dates: {range: MAIN.DATE_RANGE.THIS_WEEK}}},
                    {
                        range: {
                            gte: '2020-07-05||/d',
                            lt: '2020-07-12||/d',
                            time_zone: timezone,
                        }
                    }
                );
            });

            it('searchNextWeek', (done) => {
                testDateQuery(
                    done,
                    {advancedSearch: {dates: {range: MAIN.DATE_RANGE.NEXT_WEEK}}},
                    {
                        range: {
                            gte: '2020-07-12||/d',
                            lt: '2020-07-19||/d',
                            time_zone: timezone,
                        }
                    }
                );
            });
        });
    });

    describe('dates with includeScheduledUpdates', () => {
        it('searchToday with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {dates: {range: MAIN.DATE_RANGE.TODAY}}
                },
                {
                    range: {
                        gte: 'now/d',
                        lt: 'now+24h/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchTomorrow with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {dates: {range: MAIN.DATE_RANGE.TOMORROW}}
                },
                {
                    range: {
                        gte: 'now+24h/d',
                        lt: 'now+48h/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchLast24Hours with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {dates: {range: MAIN.DATE_RANGE.LAST_24}}
                },
                {
                    range: {
                        gte: 'now-24h',
                        lt: 'now',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchForDate with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {
                        dates: {
                            range: MAIN.DATE_RANGE.FOR_DATE,
                            start: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-23||/d',
                        lt: '2020-07-24||/d',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchStartDate with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchEndDate with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {
                        dates: {
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        lte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
                }
            );
        });

        it('searchDateRange with includeScheduledUpdates', (done) => {
            testDateQueryWithScheduledUpdates(
                done,
                {
                    includeScheduledUpdates: true,
                    advancedSearch: {
                        dates: {
                            start: moment.tz('2020-07-12T00:00:00', 'Australia/Sydney'),
                            end: moment.tz('2020-07-23T00:00:00', 'Australia/Sydney'),
                        },
                    },
                },
                {
                    range: {
                        gte: '2020-07-11T14:00:00.000Z',
                        lte: '2020-07-22T14:00:00.000Z',
                        time_zone: timezone,
                    }
                }
            );
        });

        describe('week search with includeScheduledUpdates', () => {
            beforeEach(() => {
                sinon.stub(timeUtils, 'getStartOfNextWeek')
                    .returns(moment('2020-07-12'));
            });

            afterEach(() => {
                restoreSinonStub(timeUtils.getStartOfNextWeek);
            });

            it('searchThisWeek with includeScheduledUpdates', (done) => {
                testDateQueryWithScheduledUpdates(
                    done,
                    {
                        includeScheduledUpdates: true,
                        advancedSearch: {dates: {range: MAIN.DATE_RANGE.THIS_WEEK}}
                    },
                    {
                        range: {
                            gte: '2020-07-05||/d',
                            lt: '2020-07-12||/d',
                            time_zone: timezone,
                        }
                    }
                );
            });

            it('searchNextWeek with includeScheduledUpdates', (done) => {
                testDateQueryWithScheduledUpdates(
                    done,
                    {
                        includeScheduledUpdates: true,
                        advancedSearch: {dates: {range: MAIN.DATE_RANGE.NEXT_WEEK}}
                    },
                    {
                        range: {
                            gte: '2020-07-12||/d',
                            lt: '2020-07-19||/d',
                            time_zone: timezone,
                        }
                    }
                );
            });
        });
    });
});
