import {IEventItem, IPlanningItem, ISearchAPIParams, ISearchParams, IPlanningAPI, FILTER_TYPE} from '../interfaces';
import {IRestApiResponse} from 'superdesk-api';
import {searchRaw, convertCommonParams, cvsToString, arrayToString} from './search';
import {eventUtils, planningUtils} from '../utils';
import {planningApi} from '../superdeskApi';
import {combinedSearchProfile} from '../selectors/forms';

type IResponse = IRestApiResponse<IEventItem | IPlanningItem>;

function convertCombinedParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        reference: params.reference,
        slugline: params.slugline,
        calendars: cvsToString(params.calendars),
        agendas: arrayToString(params.agendas),
    };
}

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
        ...convertCombinedParams(params),
        repo: FILTER_TYPE.COMBINED,
    })
        .then(modifyResponseForClient);
}

function getCombinedSearchProfile() {
    return combinedSearchProfile(planningApi.redux.store.getState());
}

export const combined: IPlanningAPI['combined'] = {
    search: searchCombined,
    getSearchProfile: getCombinedSearchProfile,
};

