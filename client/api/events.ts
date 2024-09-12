import {
    FILTER_TYPE,
    IEventItem,
    IPlanningAPI,
    ISearchAPIParams,
    ISearchParams,
    ISearchSpikeState,
    IPlanningConfig,
    IEventUpdateMethod,
} from '../interfaces';
import {appConfig as config} from 'appConfig';
import {IRestApiResponse} from 'superdesk-api';
import {planningApi, superdeskApi} from '../superdeskApi';
import {EVENTS, TEMP_ID_PREFIX} from '../constants';

import {arrayToString, convertCommonParams, cvsToString, searchRaw, searchRawGetAll} from './search';
import {eventUtils} from '../utils';
import {eventProfile, eventSearchProfile} from '../selectors/forms';
import planningApis from '../actions/planning/api';

const appConfig = config as IPlanningConfig;

function convertEventParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        reference: params.reference,
        source: cvsToString(params.source, 'id'),
        location: params.location?.qcode,
        calendars: cvsToString(params.calendars),
        no_calendar_assigned: params.no_calendar_assigned,
        priority: arrayToString(params.priority),
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

function modifySaveResponseForClient(response: IEventItem | IRestApiResponse<IEventItem>): Array<IEventItem> {
    const items = (response as IRestApiResponse<IEventItem>)?._items ??
        [response as IEventItem];

    items.forEach(modifyItemForClient);
    return items;
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

function getEventEditorProfile() {
    return eventProfile(planningApi.redux.store.getState());
}

function getEventSearchProfile() {
    return eventSearchProfile(planningApi.redux.store.getState());
}

function create(updates: Partial<IEventItem>): Promise<Array<IEventItem>> {
    const {default_create_planning_series_with_event_series} = appConfig.planning;
    const planningDefaultCreateMethod: IEventUpdateMethod = default_create_planning_series_with_event_series === true ?
        'all' :
        'single';

    return superdeskApi.dataApi.create<IEventItem | IRestApiResponse<IEventItem>>('events', {
        ...updates,
        associated_plannings: undefined,
        embedded_planning: updates.associated_plannings.map((planning) => ({
            update_method: planning.update_method ?? planningDefaultCreateMethod,
            coverages: planning.coverages.map((coverage) => ({
                coverage_id: coverage.coverage_id,
                g2_content_type: coverage.planning.g2_content_type,
                desk: coverage.assigned_to.desk,
                user: coverage.assigned_to.user,
                language: coverage.planning.language,
                news_coverage_status: coverage.news_coverage_status.qcode,
                scheduled: coverage.planning.scheduled,
                genre: coverage.planning.genre?.qcode,
                slugline: coverage.planning.slugline,
                ednote: coverage.planning.ednote,
                internal_note: coverage.planning.internal_note,
                headline: coverage.planning.headline,
            })),
        })),
        update_method: updates.update_method?.value ?? updates.update_method
    })
        .then((response) => {
            const events = modifySaveResponseForClient(response);

            return planningApi.planning.searchGetAll({
                recurrence_id: events[0].recurrence_id,
                event_item: events[0].recurrence_id != null ? null : events.map((event) => event._id),
                spike_state: 'both',
                only_future: false,
            }).then((planningItems) => {
                // Make sure to update the Redux Store with the latest Planning items
                // So that the Editor can set the state with these latest items
                planningApi.redux.store.dispatch<any>(planningApis.receivePlannings(planningItems));

                return events;
            });
        })
        .catch((error) => {
            console.error(error);

            return Promise.reject(error);
        });
}

function update(original: IEventItem, updates: Partial<IEventItem>): Promise<Array<IEventItem>> {
    return superdeskApi.dataApi.patch<IEventItem>('events', original, {
        ...updates,
        associated_plannings: undefined,
        embedded_planning: updates?.associated_plannings?.map((planning) => ({
            planning_id: planning._id.startsWith(TEMP_ID_PREFIX) ? undefined : planning._id,
            update_method: planning.update_method,
            coverages: planning.coverages.map((coverage) => ({
                coverage_id: coverage.coverage_id,
                g2_content_type: coverage.planning.g2_content_type,
                desk: coverage.assigned_to.desk,
                user: coverage.assigned_to.user,
                language: coverage.planning.language,
                news_coverage_status: coverage.news_coverage_status.qcode,
                scheduled: coverage.planning.scheduled,
                genre: coverage.planning.genre?.qcode,
                slugline: coverage.planning.slugline,
                ednote: coverage.planning.ednote,
                internal_note: coverage.planning.internal_note,
            })),
        })),
        update_method: updates.update_method?.value ?? updates.update_method ?? original.update_method
    })
        .then((response) => {
            const events = modifySaveResponseForClient(response);

            return planningApi.planning.searchGetAll({
                recurrence_id: events[0].recurrence_id,
                event_item: events[0].recurrence_id != null ? null : events.map((event) => event._id),
                spike_state: 'both',
                only_future: false,
            }).then((planningItems) => {
                // Make sure to update the Redux Store with the latest Planning items
                // So that the Editor can set the state with these latest items
                planningApi.redux.store.dispatch<any>(planningApis.receivePlannings(planningItems));

                return events;
            });
        });
}

export const events: IPlanningAPI['events'] = {
    search: searchEvents,
    searchGetAll: searchEventsGetAll,
    getById: getEventById,
    getByIds: getEventByIds,
    getEditorProfile: getEventEditorProfile,
    getSearchProfile: getEventSearchProfile,
    create: create,
    update: update,
};
