import {IEventOrPlanningItem, ISearchAPIParams, ISearchParams} from '../interfaces';
import {superdeskApi, planningApi as sdPlanningApi} from '../superdeskApi';
import {IRestApiResponse} from 'superdesk-api';
import {getDateTimeElasticFormat, getTimeZoneOffset} from '../utils';
import {default as timeUtils} from '../utils/time';
import {appConfig} from 'appConfig';
import planningApi from '../actions/planning/api';
import eventsApi from '../actions/events/api';
import {partition} from 'lodash';

export function cvsToString(items?: Array<{[key: string]: any}>, field: string = 'qcode'): string {
    return arrayToString(
        (items ?? [])
            .map((item) => item[field])
    );
}

export function arrayToString(items?: Array<string | number>): string {
    return (items ?? [])
        .join(',');
}

export function convertCommonParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        item_ids: arrayToString(params.item_ids),
        name: params.name,
        full_text: params.full_text,
        anpa_category: cvsToString(params.anpa_category),
        subject: cvsToString(params.subject),
        state: cvsToString(params.state),
        posted: params.posted,
        language: params.language,
        spike_state: params.spike_state,
        include_killed: params.include_killed,
        date_filter: params.date_filter,
        start_date: params.start_date == null ?
            null :
            getDateTimeElasticFormat(params.start_date, params.date_filter != 'for_date'),
        end_date: params.end_date == null ?
            null :
            getDateTimeElasticFormat(params.end_date, params.date_filter != 'for_date'),
        start_of_week: appConfig.start_of_week,
        slugline: params.slugline,
        lock_state: params.lock_state,
        directly_locked: params.directly_locked,
        page: params.page ?? 1,
        max_results: params.max_results ?? 50,
        recurrence_id: params.recurrence_id,
        place: cvsToString(params.place),
        only_future: params.only_future,
        filter_id: params.filter_id,
        sort_order: params.sort_order,
        sort_field: params.sort_field,
        tz_offset: params.date_filter ? getTimeZoneOffset() : null,
        time_zone: timeUtils.localTimeZone(),
        include_associated_planning: params.include_associated_planning,
    };
}

function excludeNullParams(args: ISearchAPIParams): ISearchAPIParams {
    // Copy the args so that we don't modify the original
    const params: ISearchAPIParams = Object.assign({}, args);

    Object.keys(params).forEach((field) => {
        if (params[field] == null) {
            delete params[field];
        } else if (typeof params[field] === 'string' && !params[field]?.length) {
            delete params[field];
        }
    });

    return params;
}

export function searchRaw<T>(args: ISearchAPIParams): Promise<IRestApiResponse<T>> {
    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<T>>(
        'events_planning_search',
        excludeNullParams(args)
    );
}

export const searchRawAndStore = <T>(args: ISearchAPIParams) => {
    const {dispatch} = sdPlanningApi.redux.store;

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<T>>(
        'events_planning_search',
        excludeNullParams(args)
    ).then((res) => {
        const [relatedPlans, events] = partition(res._items, (item: IEventOrPlanningItem) => item.type === 'planning');

        if (args.include_associated_planning) {
            dispatch(planningApi.receivePlannings(relatedPlans));
        }

        dispatch(eventsApi.receiveEvents(events));

        return res;
    });
}


export function searchRawGetAll<T>(args: ISearchAPIParams): Promise<Array<T>> {
    const params = excludeNullParams(args);
    let items: Array<T> = [];

    return new Promise((resolve, reject) => {
        function query() {
            superdeskApi.dataApi.queryRawJson<IRestApiResponse<T>>(
                'events_planning_search',
                params
            )
                .then((response) => {
                    items = items.concat(response._items);

                    if (response._links.next != null) {
                        params.page += 1;
                        query();
                    } else {
                        resolve(items);
                    }
                });
        }

        query();
    });
}
