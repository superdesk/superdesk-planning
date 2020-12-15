import {ISearchParams, ISearchAPIParams} from '../interfaces';
import {superdeskApi} from '../superdeskApi';
import {IRestApiResponse} from 'superdesk-api';
import {getDateTimeElasticFormat} from '../utils';

export function cvsToString(items?: Array<{[key: string]: any}>, field: string = 'qcode'): string {
    return arrayToString(
        (items ?? [])
            .map((item) => item[field])
    );
}

export function arrayToString(items?: Array<string>): string {
    return (items ?? [])
        .join(',');
}

export function convertCommonParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        item_ids: arrayToString(params.item_ids),
        name: params.name,
        tz_offset: params.tz_offset,
        full_text: params.full_text,
        anpa_category: cvsToString(params.anpa_category),
        subject: cvsToString(params.subject),
        state: cvsToString(params.state),
        posted: params.posted,
        language: params.language,
        spike_state: params.spike_state,
        include_killed: params.include_killed,
        date_filter: params.date_filter,
        start_date: params.start_date == null ? null : getDateTimeElasticFormat(params.start_date),
        end_date: params.end_date == null ? null : getDateTimeElasticFormat(params.end_date),
        start_of_week: params.start_of_week,
        slugline: params.slugline,
        lock_state: params.lock_state,
        page: params.page ?? 1,
        max_results: params.max_results ?? 50,
        recurrence_id: params.recurrence_id,
    };
}

export function searchRaw<T>(args: ISearchAPIParams) {
    Object.keys(args).forEach((field) => {
        if (args[field] == null) {
            delete args[field];
        } else if (typeof args[field] === 'string' && !args[field]?.length) {
            delete args[field];
        }
    });

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<T>>(
        'events_planning_search',
        args
    );
}
