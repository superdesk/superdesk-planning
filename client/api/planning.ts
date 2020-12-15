import {IPlanningItem, ISearchAPIParams, ISearchParams, IFeaturedPlanningLock} from '../interfaces';
import {arrayToString, convertCommonParams, searchRaw} from './search';
import {superdeskApi} from '../superdeskApi';
import {IRestApiResponse} from 'superdesk-api';
import {planningUtils} from '../utils';

export function convertPlanningParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        agendas: arrayToString(params.agendas),
        no_agenda_assigned: params.no_agenda_assigned == true,
        ad_hoc_planning: params.ad_hoc_planning == true,
        exclude_rescheduled_and_cancelled: params.exclude_rescheduled_and_cancelled == true,
        no_coverage: params.no_coverage == true,
        urgency: params.urgency?.qcode,
        featured: params.featured == true,
        include_scheduled_updates: params.include_scheduled_updates == true,
        event_item: arrayToString(params.event_item),
        g2_content_type: params.g2_content_type?.qcode,
    };
}

function modifyResponseForClient(response: IRestApiResponse<IPlanningItem>): IRestApiResponse<IPlanningItem> {
    response._items.forEach(modifyItemForClient);
    return response;
}

function modifyItemForClient(item: IPlanningItem): IPlanningItem {
    planningUtils.modifyForClient(item);
    return item;
}

export function searchPlanning(params: ISearchParams) {
    return searchRaw<IPlanningItem>({
        ...convertCommonParams(params),
        ...convertPlanningParams(params),
        repo: 'planning',
    })
        .then(modifyResponseForClient);
}

export function getPlanningById(planId: IPlanningItem['_id']): Promise<IPlanningItem> {
    return superdeskApi.dataApi
        .findOne<IPlanningItem>('planning', planId)
        .then(modifyItemForClient);
}

export function getPlanningByIds(planIds: Array<IPlanningItem['_id']>): Promise<Array<IPlanningItem>> {
    return searchPlanning({item_ids: planIds})
        .then(modifyResponseForClient)
        .then((response) => response._items);
}

export function getLockedPlanningItems(): Promise<Array<IPlanningItem>> {
    return searchPlanning({lock_state: 'locked'})
        .then(modifyResponseForClient)
        .then((response) => response._items);
}

export function getLockedFeaturedPlanning(): Promise<Array<IFeaturedPlanningLock>> {
    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<IFeaturedPlanningLock>>(
        'planning_featured_lock',
        {
            source: JSON.stringify({
                query: {
                    constant_score: {
                        filter: {
                            exists: {
                                field: 'lock_session',
                            },
                        },
                    },
                },
            })
        }
    )
        .then((response) => response._items);
}
