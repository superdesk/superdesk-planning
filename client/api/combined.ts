import {
    IEventItem,
    IPlanningItem,
    ISearchAPIParams,
    ISearchParams,
    IPlanningAPI,
    FILTER_TYPE,
    IEventOrPlanningItem,
} from '../interfaces';
import {IRestApiResponse} from 'superdesk-api';
import {searchRaw, searchRawGetAll, convertCommonParams, cvsToString, arrayToString} from './search';
import {eventUtils, planningUtils} from '../utils';
import {planningApi} from '../superdeskApi';
import {combinedSearchProfile} from '../selectors/forms';
import {searchPlanningGetAll} from './planning';
import {searchEventsGetAll} from './events';

type IResponse = IRestApiResponse<IEventOrPlanningItem>;

function convertCombinedParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        reference: params.reference,
        slugline: params.slugline,
        calendars: cvsToString(params.calendars),
        agendas: arrayToString(params.agendas),
        include_associated_planning: params.include_associated_planning,
    };
}

function modifyResponseForClient(response: IResponse): IResponse {
    response._items.forEach(modifyItemForClient);
    return response;
}

export function modifyItemForClient(item: IEventOrPlanningItem): IEventOrPlanningItem {
    if (item.type === 'event') {
        eventUtils.modifyForClient(item);
    } else {
        planningUtils.modifyForClient(item);
    }

    return item;
}

export function searchCombined(params: ISearchParams): Promise<IResponse> {
    return searchRaw<IEventOrPlanningItem>({
        ...convertCommonParams(params),
        ...convertCombinedParams(params),
        repo: FILTER_TYPE.COMBINED,
    })
        .then(modifyResponseForClient);
}

export function searchCombinedGetAll(params: ISearchParams): Promise<Array<IEventOrPlanningItem>> {
    return searchRawGetAll<IEventOrPlanningItem>({
        ...convertCommonParams(params),
        ...convertCombinedParams(params),
        repo: FILTER_TYPE.COMBINED,
    })
        .then((items) => {
            items.forEach(modifyItemForClient);

            return items;
        });
}

export function getEventsAndPlanning(params: ISearchParams): Promise<{
    events: Array<IEventItem>;
    plannings: Array<IPlanningItem>;
}> {
    return searchCombinedGetAll(params).then((items) => {
        const events: Array<IEventItem> = [];
        const plannings: Array<IPlanningItem> = [];

        items.forEach(
            (item) => {
                if (item.type === 'event') {
                    events.push(item);
                } else {
                    plannings.push(item);
                }
            }
        );

        return {
            events,
            plannings,
        };
    });
}

function getRecurringEventsAndPlanningItems(
    event: IEventItem,
    loadPlannings: boolean = true,
    loadEvents: boolean = true
): Promise<{
    events: Array<IEventItem>;
    plannings: Array<IPlanningItem>;
}> {
    if (loadEvents && loadPlannings) {
        return getEventsAndPlanning({
            recurrence_id: event.recurrence_id,
            item_ids: event.recurrence_id != null ? null : [event._id],
            spike_state: 'both',
            only_future: false,
            include_associated_planning: true,
        });
    } else if (!loadEvents) {
        return searchPlanningGetAll({
            recurrence_id: event.recurrence_id,
            event_item: event.recurrence_id != null ? null : [event._id],
            spike_state: 'both',
            only_future: false,
        }).then((items) => ({
            events: [],
            plannings: items,
        }));
    } else if (event.recurrence_id == null) {
        return Promise.resolve({
            events: [],
            plannings: [],
        });
    } else {
        return searchEventsGetAll({
            recurrence_id: event.recurrence_id,
            spike_state: 'both',
            only_future: false
        }).then((items) => ({
            events: items,
            plannings: [],
        }));
    }
}

function getCombinedSearchProfile() {
    return combinedSearchProfile(planningApi.redux.store.getState());
}

export const combined: IPlanningAPI['combined'] = {
    search: searchCombined,
    searchGetAll: searchCombinedGetAll,
    getRecurringEventsAndPlanningItems: getRecurringEventsAndPlanningItems,
    getEventsAndPlanning: getEventsAndPlanning,
    getSearchProfile: getCombinedSearchProfile,
};

