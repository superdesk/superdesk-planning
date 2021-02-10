import {IEventItem, ISearchAPIParams, ISearchParams, ISearchSpikeState, IPlanningAPI, FILTER_TYPE} from '../interfaces';
import {cvsToString, convertCommonParams, searchRaw, searchRawGetAll} from './search';
import {IRestApiResponse} from 'superdesk-api';
import {superdeskApi, planningApi} from '../superdeskApi';
import {eventUtils} from '../utils';
import {eventProfile, eventSearchProfile} from '../selectors/forms';
import {EVENTS} from '../constants';

function convertEventParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        reference: params.reference,
        source: cvsToString(params.source, 'id'),
        location: params.location?.name,
        calendars: cvsToString(params.calendars),
        no_calendar_assigned: params.no_calendar_assigned,
    };
}

function modifyResponseForClient(response: IRestApiResponse<IEventItem>): IRestApiResponse<IEventItem> {
    response._items.forEach(modifyItemForClient);
    return response;
}

function modifyItemForClient(item: IEventItem): IEventItem {
    eventUtils.modifyForClient(item);
    return item;
}

export function searchEvents(params: ISearchParams): Promise<IRestApiResponse<IEventItem>> {
    return searchRaw<IEventItem>({
        ...convertCommonParams(params),
        ...convertEventParams(params),
        repo: FILTER_TYPE.EVENTS,
    })
        .then(modifyResponseForClient);
}

export function searchEventsGetAll(params: ISearchParams): Promise<Array<IEventItem>> {
    return searchRawGetAll<IEventItem>({
        ...convertCommonParams(params),
        ...convertEventParams(params),
        repo: FILTER_TYPE.EVENTS,
    }).then((items) => {
        items.forEach(modifyItemForClient);

        return items;
    });
}

export function getEventById(eventId: IEventItem['_id']): Promise<IEventItem> {
    return superdeskApi.dataApi
        .findOne<IEventItem>('events', eventId)
        .then(modifyItemForClient);
}

export function getEventByIds(
    eventIds: Array<IEventItem['_id']>,
    spikeState: ISearchSpikeState = 'draft'
): Promise<Array<IEventItem>> {
    if (eventIds.length === 0) {
        return Promise.resolve([]);
    } else if (eventIds.length > EVENTS.FETCH_IDS_CHUNK_SIZE) {
        // chunk the requests (otherwise URL may become too long)
        const requests: Array<Promise<Array<IEventItem>>> = [];

        for (let i = 0; i < Math.ceil(eventIds.length / EVENTS.FETCH_IDS_CHUNK_SIZE); i++) {
            requests.push(
                getEventByIds(
                    eventIds.slice(
                        i * EVENTS.FETCH_IDS_CHUNK_SIZE,
                        (i + 1) * EVENTS.FETCH_IDS_CHUNK_SIZE
                    ),
                    spikeState
                )
            );
        }

        return Promise
            .all(requests)
            .then((responses) => (
                Array.prototype.concat.apply([], responses)
            ));
    }

    return searchEvents({
        item_ids: eventIds,
        spike_state: spikeState,
        only_future: false,
    })
        .then(modifyResponseForClient)
        .then((response) => response._items);
}

export function getLockedEvents(): Promise<Array<IEventItem>> {
    return searchEvents({
        lock_state: 'locked',
        only_future: false,
    })
        .then(modifyResponseForClient)
        .then((response) => (
            response._items
        ));
}

function getEventEditorProfile() {
    return eventProfile(planningApi.redux.store.getState());
}

function getEventSearchProfile() {
    return eventSearchProfile(planningApi.redux.store.getState());
}

export const events: IPlanningAPI['events'] = {
    search: searchEvents,
    searchGetAll: searchEventsGetAll,
    getById: getEventById,
    getByIds: getEventByIds,
    getLocked: getLockedEvents,
    getEditorProfile: getEventEditorProfile,
    getSearchProfile: getEventSearchProfile,
};
