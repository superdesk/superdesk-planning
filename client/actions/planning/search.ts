import {cloneDeep} from 'lodash';

import {IPlanningSearchParams, IElasticQuery} from '../../interfaces';
import {POST_STATE, WORKFLOW_STATE} from '../../constants';
import {
    getTimeZoneOffset,
    appendStatesQueryForAdvancedSearch,
} from '../../utils';
import * as elastic from '../../utils/elastic';

interface ISearchCondition {
    condition: (params: IPlanningSearchParams) => boolean;
    addQuery: (query: IElasticQuery, params: IPlanningSearchParams) => void;
}

const searchAgendas: ISearchCondition = {
    condition: (params) => params.agendas?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms('agendas', params.agendas)
        );
    }
};

const searchNoAgendaAssigned: ISearchCondition = {
    condition: (params) => params.noAgendaAssigned == true,
    addQuery: (query, params) => {
        query.must_not.push(
            elastic.fieldExists('agendas')
        );
    }
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
    }
};

const searchAdHocPlanning: ISearchCondition = {
    condition: (params) => params.adHocPlanning == true,
    addQuery: (query, params) => {
        query.must_not.push(
            elastic.fieldExists('event_item')
        );
    }
};

const searchExcludeRescheduledAndCancelled: ISearchCondition = {
    condition: (params) => params.excludeRescheduledAndCancelled == true,
    addQuery: (query, params) => {
        query.must_not.push(
            elastic.terms(
                'state',
                [WORKFLOW_STATE.RESCHEDULED, WORKFLOW_STATE.CANCELLED]
            )
        );
    }
};

const searchSlugline: ISearchCondition = {
    condition: (params) => params.advancedSearch.slugline?.length > 0,
    addQuery: (query, params) => {
        const should: Array<any> = [
            elastic.queryString({
                text: params.advancedSearch.slugline,
                field: 'slugline',
                defaultOperator: 'AND',
            }),
        ];

        if (!params.advancedSearch.noCoverage) {
            should.push({
                nested: {
                    path: 'coverages',
                    query: {
                        bool: {
                            must: [
                                elastic.queryString({
                                    text: params.advancedSearch.slugline,
                                    field: 'coverages.planning.slugline',
                                    defaultOperator: 'AND',
                                }),
                            ],
                        },
                    },
                },
            });
        }

        query.must.push({
            bool: {
                minimum_should_match: 1,
                should: should,
            },
        });
    }
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
    }
};

const searchSubject: ISearchCondition = {
    condition: (params) => params.advancedSearch?.subject?.length > 0,
    addQuery: (query, params) => {
        query.must.push(
            elastic.terms(
                'subject.code',
                params.advancedSearch.subject.map(
                    (subject) => subject.qcode
                )
            )
        );
    }
};

const searchUrgency: ISearchCondition = {
    condition: (params) => params.advancedSearch?.urgency?.qcode != null,
    addQuery: (query, params) => {
        query.must.push(
            elastic.term(
                'urgency',
                params.advancedSearch.urgency.qcode
            )
        );
    }
};

const searchG2ContentType: ISearchCondition = {
    condition: (params) => params.advancedSearch?.g2_content_type?.qcode != null,
    addQuery: (query, params) => {
        query.must.push({
            nested: {
                path: 'coverages',
                query: {
                    bool: {
                        must: elastic.term(
                            'coverages.planning.g2_content_type',
                            params.advancedSearch.g2_content_type.qcode
                        ),
                    },
                },
            }
        });
    }
};

const searchNoCoverage: ISearchCondition = {
    condition: (params) => params.advancedSearch?.noCoverage == true,
    addQuery: (query, params) => {
        query.must_not.push({
            nested: {
                path: 'coverages',
                query: elastic.fieldExists('coverages.coverage_id'),
            },
        });
    }
};

const searchPosted: ISearchCondition = {
    condition: (params) => params.advancedSearch?.posted == true,
    addQuery: (query, params) => {
        query.must.push(
            elastic.term('pubstatus', POST_STATE.USABLE)
        );
    }
};

const searchFeatured: ISearchCondition = {
    condition: (params) => params.advancedSearch?.featured == true,
    addQuery: (query, params) => {
        query.must.push(
            elastic.term('featured', true)
        );
    }
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
    }
};

const searchDate: ISearchCondition = {
    condition: (params) => params.advancedSearch?.dates?.range != null ||
        params.advancedSearch?.dates?.start != null ||
        params.advancedSearch?.dates?.end != null,
    addQuery: (query, params) => {
        const timezone = params.timezoneOffset ?? getTimeZoneOffset();
        const fieldName = '_planning_schedule.scheduled';
        const baseQuery = {
            field: fieldName,
            timeZone: timezone,
            startOfWeek: params.startOfWeek,
        };
        let range;

        if (params.advancedSearch.dates.range != null) {
            range = elastic.dateRange({
                ...baseQuery,
                range: params.advancedSearch.dates.range,
                date: params.advancedSearch.dates.start,
            });
        } else {
            range = elastic.range({
                ...baseQuery,
                gte: params.advancedSearch.dates.start?.toISOString(),
                lte: params.advancedSearch.dates.end?.toISOString(),
            });

            if (range.range[fieldName].gte == null && range.range[fieldName].lte == null) {
                range.range[fieldName].gte = 'now/d';
            }
        }

        const planningSchedule = {
            nested: {
                path: '_planning_schedule',
                query: {
                    bool: {
                        filter: cloneDeep(range),
                    },
                },
            },
        };

        if (params.includeScheduledUpdates == true) {
            const updatesRange = {
                range: {
                    '_updates_schedule.scheduled': cloneDeep(range.range[fieldName]),
                },
            };

            query.filter.push({
                bool: {
                    minimum_should_match: 1,
                    should: [
                        planningSchedule,
                        {
                            nested: {
                                path: '_updates_schedule',
                                query: {
                                    bool: {
                                        filter: updatesRange,
                                    },
                                },
                            },
                        },
                    ],
                },
            });

            query.sort.push({
                [fieldName]: {
                    order: 'asc',
                    nested: {
                        path: '_planning_schedule',
                        filter: elastic.range({
                            field: fieldName,
                            gte: 'now/d',
                            timeZone: timezone,
                        }),
                    },
                },
            });
        } else {
            query.filter.push(planningSchedule);

            query.sort.push({
                [fieldName]: {
                    order: 'asc',
                    nested: {
                        path: '_planning_schedule',
                        filter: range,
                    },
                },
            });
        }
    }
};

const searchDateDefault: ISearchCondition = {
    condition: (params) => !params.advancedSearch?.dates?.range &&
        !params.advancedSearch?.dates?.start &&
        !params.advancedSearch?.dates?.end,
    addQuery: (query, params) => {
        const fieldName = '_planning_schedule.scheduled';
        const range = elastic.range({
            field: fieldName,
            gte: 'now/d',
            timeZone: params.timezoneOffset ?? getTimeZoneOffset(),
        });

        query.filter.push({
            nested: {
                path: '_planning_schedule',
                query: {
                    bool: {
                        filter: range,
                    },
                },
            },
        });

        query.sort.push({
            [fieldName]: {
                order: 'asc',
                nested: {
                    path: '_planning_schedule',
                    filter: range,
                },
            },
        });
    }
};

const searchFilters: Array<ISearchCondition> = [
    searchAgendas,
    searchNoAgendaAssigned,
    searchFulltext,
    searchAdHocPlanning,
    searchExcludeRescheduledAndCancelled,
    searchSlugline,
    searchAnpaCategory,
    searchSubject,
    searchUrgency,
    searchG2ContentType,
    searchNoCoverage,
    searchPosted,
    searchFeatured,
    searchPlace,
    searchDate,
    searchDateDefault,
];

export function constructPlanningSearchQuery(params: IPlanningSearchParams) {
    const query: IElasticQuery = {
        must: [],
        must_not: [],
        filter: [],
        sort: [],
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
        false
    );

    return {
        query: {
            bool: {
                must: query.must,
                must_not: query.must_not,
                filter: query.filter,
            },
        },
        sort: query.sort,
    };
}
