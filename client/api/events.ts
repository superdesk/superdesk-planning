import {IEventItem, ISearchAPIParams, ISearchParams, ISearchSpikeState} from '../interfaces';
import {cvsToString, convertCommonParams, searchRaw} from './search';
import {IRestApiResponse} from 'superdesk-api';
import {superdeskApi} from '../superdeskApi';
import {eventUtils} from '../utils';

function convertEventParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        reference: params.reference,
        source: cvsToString(params.source, 'id'),
        location: params.location,
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
        repo: 'events',
    })
        .then(modifyResponseForClient);
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
    return searchEvents({
        item_ids: eventIds.filter(
            (eventId, index, ids) => ids.indexOf(eventId) === index
        ),
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
