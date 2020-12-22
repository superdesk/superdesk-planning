
import {ICombinedSearchParams, IEventSearchParams, IPlanningSearchParams, ISearchParams} from '../interfaces';
import {MAIN} from '../constants';

export function planningParamsToSearchParams(params: IPlanningSearchParams): ISearchParams {
    return {
        name: params.advancedSearch?.name,
        tz_offset: params.timezoneOffset,
        full_text: params.fulltext,
        anpa_category: params.advancedSearch?.anpa_category,
        subject: params.advancedSearch?.subject,
        posted: params.advancedSearch?.posted,
        place: params.advancedSearch?.place,
        language: params.advancedSearch?.language,
        state: params.advancedSearch?.state,
        spike_state: params.spikeState,
        date_filter: params.advancedSearch?.dates?.range,
        start_date: params.advancedSearch?.dates?.start,
        end_date: params.advancedSearch?.dates?.end,
        start_of_week: params.startOfWeek,
        slugline: params.advancedSearch?.slugline,
        agendas: params.agendas,
        no_agenda_assigned: params.noAgendaAssigned,
        ad_hoc_planning: params.adHocPlanning,
        exclude_rescheduled_and_cancelled: params.excludeRescheduledAndCancelled,
        no_coverage: params.advancedSearch?.noCoverage,
        urgency: params.advancedSearch?.urgency,
        g2_content_type: params.advancedSearch?.g2_content_type,
        featured: params.advancedSearch?.featured,
        include_scheduled_updates: params.includeScheduledUpdates,
        // max_results: params.maxResults,
        // page: params.page,
    };
}

export function searchParamsToPlanningParams(params: ISearchParams): IPlanningSearchParams {
    return {
        adHocPlanning: params.ad_hoc_planning,
        agendas: params.agendas,
        excludeRescheduledAndCancelled: params.exclude_rescheduled_and_cancelled,
        featured: params.featured,
        fulltext: params.full_text,
        includeScheduledUpdates: params.include_scheduled_updates,
        noAgendaAssigned: params.no_agenda_assigned,
        spikeState: params.spike_state,
        startOfWeek: params.start_of_week,
        timezoneOffset: params.tz_offset,
        advancedSearch: {
            anpa_category: params.anpa_category,
            dates: {
                range: params.date_filter,
                start: params.start_date,
                end: params.end_date,
            },
            featured: params.featured,
            g2_content_type: params.g2_content_type,
            noCoverage: params.no_coverage,
            place: params.place,
            posted: params.posted,
            slugline: params.slugline,
            state: params.state,
            subject: params.subject,
            urgency: params.urgency,
            language: params.language,
            name: params.name,
        },
    };
}

export function eventParamsToSearchParams(params: IEventSearchParams): ISearchParams {
    return {
        item_ids: params.ids,
        name: params.advancedSearch?.name,
        full_text: params.fulltext,
        anpa_category: params.advancedSearch?.anpa_category,
        subject: params.advancedSearch?.subject,
        posted: params.advancedSearch?.posted,
        place: params.advancedSearch?.place,
        language: params.advancedSearch?.language,
        state: params.advancedSearch?.state,
        spike_state: params.spikeState,
        include_killed: params.includeKilled,
        date_filter: params.advancedSearch?.dates?.range,
        start_date: params.advancedSearch?.dates?.start,
        end_date: params.advancedSearch?.dates?.end,
        only_future: params.onlyFuture,
        start_of_week: params.startOfWeek,
        slugline: params.advancedSearch?.slugline,
        recurrence_id: params.recurrenceId,
        reference: params.advancedSearch?.reference,
        source: params.advancedSearch?.source,
        no_calendar_assigned: params.noCalendarAssigned,

        max_results: params.maxResults,
        page: params.page,

        // Location in EventSearchParams is ILocation | string
        // location: params.advancedSearch?.location,

        // Calendars in EventSearchParams is Array<string>
        // calendars: params.calendars,
    };
}

export function searchParamsToEventParams(params: ISearchParams): IEventSearchParams {
    return {
        calendars: params.calendars,
        fulltext: params.full_text,
        ids: params.item_ids,
        includeKilled: params.include_killed,
        itemIds: params.item_ids,
        maxResults: params.max_results,
        noCalendarAssigned: params.no_calendar_assigned,
        onlyFuture: params.only_future,
        recurrenceId: params.recurrence_id,
        page: params.page,
        startOfWeek: params.start_of_week,
        spikeState: params.spike_state,
        advancedSearch: {
            anpa_category: params.anpa_category,
            dates: {
                range: params.date_filter,
                start: params.start_date,
                end: params.end_date,
            },
            location: params.location,
            name: params.name,
            place: params.place,
            posted: params.posted,
            reference: params.reference,
            slugline: params.slugline,
            source: params.source,
            state: params.state,
            subject: params.subject,
            language: params.language,
        },
    };
}

export function combinedParamsToSearchParams(params: ICombinedSearchParams): ISearchParams {
    return {
        full_text: params.fulltext,
        anpa_category: params.advancedSearch?.anpa_category,
        subject: params.advancedSearch?.subject,
        posted: params.advancedSearch?.posted,
        place: params.places ?? params.advancedSearch?.place,
        state: params.advancedSearch?.state,
        spike_state: params.spikeState,
        date_filter: params.advancedSearch?.dates?.range,
        start_date: params.advancedSearch?.dates?.start,
        end_date: params.advancedSearch?.dates?.end,
        slugline: params.advancedSearch?.slugline,
        reference: params.advancedSearch?.reference,
        calendars: params.calendars,
        agendas: (params.agendas ?? []).map((agenda) => agenda._id),

        max_results: params.maxResults,
        page: params.page,
    };
}

export function searchParamsToCombinedParams(params: ISearchParams): ICombinedSearchParams {
    return {
        fulltext: params.full_text,
        spikeState: params.spike_state,
        page: params.page,
        maxResults: params.max_results,
        calendars: params.calendars,
        agendas: params.agendas,
        places: params.place,
        advancedSearch: {
            anpa_category: params.anpa_category,
            subject: params.subject,
            place: params.place,
            slugline: params.slugline,
            reference: params.reference,
            state: params.state,
            posted: params.posted,
            dates: {
                range: params.date_filter,
                start: params.start_date,
                end: params.end_date,
            },
        },
    };
}

type IAnySearchParams = IEventSearchParams | IPlanningSearchParams | ICombinedSearchParams;
export function searchParamsToOld(params: ISearchParams, filter: string): IAnySearchParams {
    switch (filter) {
    case MAIN.FILTERS.PLANNING:
        return searchParamsToPlanningParams(params);
    case MAIN.FILTERS.EVENTS:
        return searchParamsToEventParams(params);
    case MAIN.FILTERS.COMBINED:
    default:
        return searchParamsToCombinedParams(params);
    }
}
