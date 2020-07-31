import {IEventSearchParams, IElasticQuery} from '../../interfaces';
import {POST_STATE, MAIN} from '../../constants';
import {
    getTimeZoneOffset,
    appendStatesQueryForAdvancedSearch,
} from '../../utils';
import * as elastic from '../../utils/elastic';

interface ISearchCondition {
    condition: (params: IEventSearchParams) => boolean;
    addQuery: (query: IElasticQuery, params: IEventSearchParams) => void;
}

const searchItemIds: ISearchCondition = {
    condition: (params) => params.itemIds?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms('_id', params.itemIds)
        );
    },
};

const searchFulltext: ISearchCondition = {
    condition: (params) => params.fulltext?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.queryString({
                text: params.fulltext,
                lenient: true,
                defaultOperator: 'AND',
            })
        );
    },
};

const searchRecurrenceId: ISearchCondition = {
    condition: (params) => params.recurrenceId?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.term('recurrence_id', params.recurrenceId)
        );
    },
};

const searchName: ISearchCondition = {
    condition: (params) => params.advancedSearch?.name?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.queryString({
                text: params.advancedSearch.name,
                field: 'name',
                defaultOperator: 'AND',
            })
        );
    },
};

const searchReference: ISearchCondition = {
    condition: (params) => params.advancedSearch?.reference?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.queryString({
                text: params.advancedSearch.reference,
                field: 'reference',
                defaultOperator: 'AND',
            })
        );
    },
};

const searchSource: ISearchCondition = {
    condition: (params) => params.advancedSearch?.source?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms(
                'ingest_provider',
                params.advancedSearch.source.map(
                    (provider) => provider.id
                )
            )
        );
    },
};

const searchLocation: ISearchCondition = {
    condition: (params) => params.advancedSearch?.location?.name?.length > 0 ||
        (typeof params.advancedSearch?.location === 'string' && params.advancedSearch?.location?.length > 0),
    addQuery: (query, params) => {
        query.must.push(
            elastic.matchPhrase(
                'location.name',
                typeof params.advancedSearch.location === 'string' ?
                    params.advancedSearch.location :
                    params.advancedSearch.location.name
            )
        );
    },
};

const searchCalendars: ISearchCondition = {
    condition: (params) => params.calendars?.length > 0,
    addQuery: (query, params) => {
        const numCalendars = params.calendars?.length ?? 0;

        if (numCalendars > 1) {
            query.must.push(
                elastic.terms('calendars.qcode', params.calendars)
            );
        } else if (numCalendars === 1) {
            query.must.push(
                elastic.term('calendars.qcode', params.calendars[0])
            );
        }
    },
};

const searchNoCalendarAssigned: ISearchCondition = {
    condition: (params) => (params.calendars?.length ?? 0) === 0 &&
        params.noCalendarAssigned === true,
    addQuery: (query, params) => {
        query.must_not.push(
            elastic.fieldExists('calendars')
        );
    },
};

const searchAnpaCategory: ISearchCondition = {
    condition: (params) => params.advancedSearch?.anpa_category?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms(
                'anpa_category.qcode',
                params.advancedSearch.anpa_category.map(
                    (category) => category.qcode
                )
            )
        );
    },
};

const searchSubject: ISearchCondition = {
    condition: (params) => params.advancedSearch?.subject?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms(
                'subject.qcode',
                params.advancedSearch.subject.map(
                    (subject) => subject.qcode
                )
            )
        );
    },
};

const searchPlace: ISearchCondition = {
    condition: (params) => params.advancedSearch?.place?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms(
                'place.qcode',
                params.advancedSearch.place.map(
                    (place) => place.qcode
                )
            )
        );
    },
};

const searchSlugline: ISearchCondition = {
    condition: (params) => params.advancedSearch?.slugline?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.queryString({
                text: params.advancedSearch.slugline,
                field: 'slugline',
                defaultOperator: 'AND'
            })
        );
    },
};

const searchPosted: ISearchCondition = {
    condition: (params) => params.advancedSearch?.posted == true,
    addQuery: (query, params) => {
        query.must.push(
            elastic.term('pubstatus', POST_STATE.USABLE)
        );
    },
};

const searchDateToday: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range === MAIN.DATE_RANGE.TODAY,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.rangeToday({
                        field: 'dates.start',
                        timeZone: timezone,
                    }),
                    elastic.rangeToday({
                        field: 'dates.end',
                        timeZone: timezone,
                    }),
                    {
                        bool: {
                            must: [
                                elastic.range({
                                    field: 'dates.start',
                                    lt: 'now/d',
                                    timeZone: timezone,
                                }),
                                elastic.range({
                                    field: 'dates.end',
                                    gt: 'now+24h/d',
                                    timeZone: timezone,
                                }),
                            ],
                        },
                    },
                ],
            },
        });
    },
};

const searchDateTomorrow: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range === MAIN.DATE_RANGE.TOMORROW,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.rangeTomorrow({
                        field: 'dates.start',
                        timeZone: timezone,
                    }),
                    elastic.rangeTomorrow({
                        field: 'dates.end',
                        timeZone: timezone,
                    }),
                    {
                        bool: {
                            must: [
                                elastic.range({
                                    field: 'dates.start',
                                    lt: 'now+24h/d',
                                    timeZone: timezone,
                                }),
                                elastic.range({
                                    field: 'dates.end',
                                    gt: 'now+48h/d',
                                    timeZone: timezone,
                                }),
                            ],
                        },
                    },
                ],
            },
        });
    },
};

const searchDateLast24hrs: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range === MAIN.DATE_RANGE.LAST_24,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.rangeLast24hours({
                        field: 'dates.start',
                        timeZone: timezone,
                    }),
                    elastic.rangeLast24hours({
                        field: 'dates.end',
                        timeZone: timezone,
                    }),
                    {
                        bool: {
                            must: [
                                elastic.range({
                                    field: 'dates.start',
                                    lt: 'now-24h',
                                    timeZone: timezone,
                                }),
                                elastic.range({
                                    field: 'dates.end',
                                    gt: 'now',
                                    timeZone: timezone,
                                }),
                            ],
                        },
                    },
                ],
            },
        });
    },
};

const searchDateThisWeek: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range === MAIN.DATE_RANGE.THIS_WEEK,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.rangeThisWeek({
                        field: 'dates.start',
                        timeZone: timezone,
                        startOfWeek: params.startOfWeek,
                    }),
                    elastic.rangeThisWeek({
                        field: 'dates.end',
                        timeZone: timezone,
                        startOfWeek: params.startOfWeek,
                    }),
                    {
                        bool: {
                            must: [
                                elastic.range({
                                    field: 'dates.start',
                                    lt: elastic.startOfThisWeek(params.startOfWeek),
                                    timeZone: timezone,
                                }),
                                elastic.range({
                                    field: 'dates.end',
                                    gte: elastic.startOfNextWeek(params.startOfWeek),
                                    timeZone: timezone,
                                }),
                            ],
                        },
                    },
                ],
            },
        });
    },
};

const searchDateNextWeek: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range === MAIN.DATE_RANGE.NEXT_WEEK,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.rangeNextWeek({
                        field: 'dates.start',
                        timeZone: timezone,
                        startOfWeek: params.startOfWeek,
                    }),
                    elastic.rangeNextWeek({
                        field: 'dates.end',
                        timeZone: timezone,
                        startOfWeek: params.startOfWeek,
                    }),
                    {
                        bool: {
                            must: [
                                elastic.range({
                                    field: 'dates.start',
                                    lt: elastic.startOfNextWeek(params.startOfWeek),
                                    timeZone: timezone,
                                }),
                                elastic.range({
                                    field: 'dates.end',
                                    gte: elastic.endOfNextWeek(params.startOfWeek),
                                    timeZone: timezone,
                                }),
                            ],
                        },
                    },
                ],
            },
        });
    },
};

const searchDateStart: ISearchCondition = {
    condition: (params) => !params.advancedSearch?.dates?.range &&
        params.advancedSearch?.dates?.start != null &&
        params.advancedSearch?.dates?.end == null,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.range({
                        field: 'dates.start',
                        gte: params.advancedSearch.dates.start.toISOString(),
                        timeZone: timezone,
                    }),
                    elastic.range({
                        field: 'dates.end',
                        gte: params.advancedSearch.dates.start.toISOString(),
                        timeZone: timezone,
                    }),
                ],
            },
        });
    },
};

const searchDateEnd: ISearchCondition = {
    condition: (params) => !params.advancedSearch?.dates?.range &&
        params.advancedSearch?.dates?.start == null &&
        params.advancedSearch?.dates?.end != null,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [
                    elastic.range({
                        field: 'dates.start',
                        lte: params.advancedSearch.dates.end.toISOString(),
                        timeZone: timezone,
                    }),
                    elastic.range({
                        field: 'dates.end',
                        lte: params.advancedSearch.dates.end.toISOString(),
                        timeZone: timezone,
                    }),
                ],
            },
        });
    },
};

const searchDateRange: ISearchCondition = {
    condition: (params) => !params.advancedSearch?.dates?.range &&
        params.advancedSearch?.dates?.start != null &&
        params.advancedSearch?.dates?.end != null,
    addQuery: (query, params) => {
        const timezone = getTimeZoneOffset();

        query.filter.push({
            bool: {
                minimum_should_match: 1,
                should: [{
                    bool: {
                        must: [
                            elastic.range({
                                field: 'dates.start',
                                gte: params.advancedSearch.dates.start.toISOString(),
                                timeZone: timezone,
                            }),
                            elastic.range({
                                field: 'dates.end',
                                lte: params.advancedSearch.dates.end.toISOString(),
                                timeZone: timezone,
                            }),
                        ],
                    },
                }, {
                    bool: {
                        must: [
                            elastic.range({
                                field: 'dates.start',
                                lt: params.advancedSearch.dates.start.toISOString(),
                                timeZone: timezone,
                            }),
                            elastic.range({
                                field: 'dates.end',
                                gt: params.advancedSearch.dates.end.toISOString(),
                                timeZone: timezone,
                            }),
                        ],
                    },
                }, {
                    bool: {
                        minimum_should_match: 1,
                        should: [
                            elastic.range({
                                field: 'dates.start',
                                gte: params.advancedSearch.dates.start.toISOString(),
                                lte: params.advancedSearch.dates.end.toISOString(),
                                timeZone: timezone,
                            }),
                            elastic.range({
                                field: 'dates.end',
                                gte: params.advancedSearch.dates.start.toISOString(),
                                lte: params.advancedSearch.dates.end.toISOString(),
                                timeZone: timezone,
                            }),
                        ],
                    },
                }],
            },
        });
    },
};

const searchDateDefault: ISearchCondition = {
    condition: (params) => !params.advancedSearch?.dates?.range &&
        params.advancedSearch?.dates?.start == null &&
        params.advancedSearch?.dates?.end == null &&
        params.onlyFuture == true,
    addQuery: (query, params) => {
        query.filter.push(
            elastic.range({
                field: 'dates.end',
                gte: 'now/d',
                timeZone: getTimeZoneOffset(),
            }),
        );
    }
};

const searchFilters: Array<ISearchCondition> = [
    searchItemIds,
    searchFulltext,
    searchRecurrenceId,
    searchName,
    searchReference,
    searchSource,
    searchLocation,
    searchCalendars,
    searchNoCalendarAssigned,
    searchAnpaCategory,
    searchSubject,
    searchPlace,
    searchSlugline,
    searchPosted,
    searchDateToday,
    searchDateTomorrow,
    searchDateLast24hrs,
    searchDateThisWeek,
    searchDateNextWeek,
    searchDateStart,
    searchDateEnd,
    searchDateRange,
    searchDateDefault,
];

export function constructEventsSearchQuery(params: IEventSearchParams) {
    const query: IElasticQuery = {
        must: [],
        must_not: [],
        filter: [],
    };

    searchFilters.forEach(
        (filter) => {
            if (filter.condition(params)) {
                filter.addQuery(query, params);
            }
        }
    );

    appendStatesQueryForAdvancedSearch(
        params.advancedSearch,
        params.spikeState,
        query.must_not,
        query.must,
        params.includeKilled,
    );

    return {query: {bool: query}};
}
