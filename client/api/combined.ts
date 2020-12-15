import {IEventItem, IPlanningItem, ISearchParams} from '../interfaces';
import {IRestApiResponse} from 'superdesk-api';
import {searchRaw, convertCommonParams} from './search';
import {convertEventParams} from './events';
import {convertPlanningParams} from './planning';
import {eventUtils, planningUtils} from '../utils';

type IResponse = IRestApiResponse<IEventItem | IPlanningItem>;

function modifyResponseForClient(response: IResponse): IResponse {
    response._items.forEach(modifyItemForClient);
    return response;
}

function modifyItemForClient(item: IEventItem | IPlanningItem): IEventItem | IPlanningItem {
    if (item.type === 'event') {
        eventUtils.modifyForClient(item);
    } else {
        planningUtils.modifyForClient(item);
    }

    return item;
}

export function searchCombined(params: ISearchParams): Promise<IResponse> {
    return searchRaw<IEventItem | IPlanningItem>({
        ...convertCommonParams(params),
        ...convertEventParams(params),
        ...convertPlanningParams(params),
        repo: 'combined',
    })
        .then(modifyResponseForClient);
}
