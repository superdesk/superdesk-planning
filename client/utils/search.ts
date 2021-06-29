import moment from 'moment';

import {
    ICombinedEventOrPlanningSearchParams,
    ICombinedSearchParams,
    ICommonSearchParams,
    IEventOrPlanningItem,
    IEventSearchParams,
    IPlanningSearchParams,
    ISearchParams,
    PLANNING_VIEW,
    SORT_FIELD,
    SORT_ORDER,
} from '../interfaces';
import {MAIN} from '../constants';
import {getTimeZoneOffset} from './index';

function commonParamsToSearchParams(params: ICommonSearchParams<IEventOrPlanningItem>): ISearchParams {
    return {
        item_ids: params.itemIds,
        full_text: params.fulltext,
        include_killed: params.includeKilled,
        max_results: params.maxResults ?? MAIN.PAGE_SIZE,
        page: params.page ?? 1,
        only_future: params.onlyFuture ?? true,
        start_of_week: params.startOfWeek,
        spike_state: params.spikeState ?? 'draft',
        filter_id: params.filter_id,
        lock_state: params.lock_state,
        tz_offset: params.timezoneOffset ?? getTimeZoneOffset(),
        anpa_category: params.advancedSearch?.anpa_category,
        date_filter: params.advancedSearch?.dates?.range,
        start_date: params.advancedSearch?.dates?.start,
        end_date: params.advancedSearch?.dates?.end,
        name: params.advancedSearch?.name,
        place: params.advancedSearch?.place,
        posted: params.advancedSearch?.posted,
        slugline: params.advancedSearch?.slugline,
        state: params.advancedSearch?.state,
        subject: params.advancedSearch?.subject,
        language: params.advancedSearch?.language,
        sort_order: params.sortOrder ?? SORT_ORDER.ASCENDING,
        sort_field: params.sortField ?? SORT_FIELD.SCHEDULE,
    };
}

function searchParamsToCommonParams(params: ISearchParams): ICommonSearchParams<IEventOrPlanningItem> {
    return {
        itemIds: params.item_ids,
        fulltext: params.full_text,
        includeKilled: params.include_killed,
        maxResults: params.max_results,
        page: params.page,
        onlyFuture: params.only_future,
        startOfWeek: params.start_of_week,
        spikeState: params.spike_state,
        filter_id: params.filter_id,
        lock_state: params.lock_state,
        timezoneOffset: params.tz_offset,
        sortOrder: params.sort_order,
        sortField: params.sort_field,
        advancedSearch: {
            anpa_category: params.anpa_category,
            dates: {
                range: params.date_filter,
                start: params.start_date != undefined ? moment(params.start_date) : undefined,
                end: params.end_date != undefined ? moment(params.end_date) : undefined,
            },
            name: params.name,
            place: params.place,
            posted: params.posted,
            slugline: params.slugline,
            state: params.state,
            subject: params.subject,
            language: params.language,
        },
    };
}

export function planningParamsToSearchParams(params: IPlanningSearchParams): ISearchParams {
    return {
        ...commonParamsToSearchParams(params),
        ad_hoc_planning: params.adHocPlanning,
        exclude_rescheduled_and_cancelled: params.excludeRescheduledAndCancelled,
        no_coverage: params.advancedSearch?.noCoverage,
        urgency: params.advancedSearch?.urgency,
        g2_content_type: params.advancedSearch?.g2_content_type,
        featured: params.featured ?? params.advancedSearch?.featured,
        include_scheduled_updates: params.includeScheduledUpdates,
        no_agenda_assigned: params.noAgendaAssigned,
        agendas: params.agendas,
    };
}

export function searchParamsToPlanningParams(params: ISearchParams): IPlanningSearchParams {
    const common = searchParamsToCommonParams(params);

    return {
        ...common,
        agendas: params.agendas,
        noAgendaAssigned: params.no_agenda_assigned,
        adHocPlanning: params.ad_hoc_planning,
        excludeRescheduledAndCancelled: params.exclude_rescheduled_and_cancelled,
        featured: params.featured,
        includeScheduledUpdates: params.include_scheduled_updates,
        advancedSearch: {
            ...common.advancedSearch,
            featured: params.featured,
            g2_content_type: params.g2_content_type,
            noCoverage: params.no_coverage,
            urgency: params.urgency,
        },
    };
}

export function eventParamsToSearchParams(params: IEventSearchParams): ISearchParams {
    return {
        ...commonParamsToSearchParams(params),
        recurrence_id: params.recurrenceId,
        reference: params.advancedSearch?.reference,
        source: params.advancedSearch?.source,
        location: params.advancedSearch?.location,
        no_calendar_assigned: params.noCalendarAssigned,
        calendars: params.calendars,
    };
}

export function searchParamsToEventParams(params: ISearchParams): IEventSearchParams {
    const common = searchParamsToCommonParams(params);

    return {
        ...common,
        ids: common.itemIds,
        calendars: params.calendars,
        noCalendarAssigned: params.no_calendar_assigned,
        recurrenceId: params.recurrence_id,
        advancedSearch: {
            ...common.advancedSearch,
            location: params.location,
            reference: params.reference,
            source: params.source,
        },
    };
}

export function combinedParamsToSearchParams(params: ICombinedSearchParams): ISearchParams {
    return {
        ...commonParamsToSearchParams(params),
        reference: params.advancedSearch?.reference,
    };
}

export function searchParamsToCombinedParams(params: ISearchParams): ICombinedSearchParams {
    const common = searchParamsToCommonParams(params);

    return {
        ...common,
        advancedSearch: {
            ...common.advancedSearch,
            reference: params.reference,
        },
    };
}

export function removeUndefinedParams(
    params: ICombinedEventOrPlanningSearchParams
): ICombinedEventOrPlanningSearchParams {
    function removeUndefined(arg) {
        Object.keys(arg).forEach((key) => {
            // Explicitly remove `undefined`, but keep `null`
            if (arg[key] === undefined) {
                delete arg[key];
            }
        });
    }

    removeUndefined(params.advancedSearch?.dates ?? {});
    if (!Object.keys(params.advancedSearch?.dates ?? {}).length) {
        delete params.advancedSearch.dates;
    }

    removeUndefined(params.advancedSearch ?? {});
    if (!Object.keys(params.advancedSearch ?? {}).length) {
        delete params.advancedSearch;
    }

    removeUndefined(params);

    return params;
}

export function searchParamsToOld(params: ISearchParams, filter: PLANNING_VIEW): ICombinedEventOrPlanningSearchParams {
    switch (filter) {
    case PLANNING_VIEW.PLANNING:
        return searchParamsToPlanningParams(params);
    case PLANNING_VIEW.EVENTS:
        return searchParamsToEventParams(params);
    case PLANNING_VIEW.COMBINED:
    default:
        return searchParamsToCombinedParams(params);
    }
}
