import {
    FILTER_TYPE, IEventItem,
    IFeaturedPlanningLock, IG2ContentType,
    IPlanningAPI,
    IPlanningItem,
    ISearchAPIParams,
    ISearchParams,
    ISearchSpikeState,
    LOCK_STATE,
} from '../interfaces';
import {arrayToString, convertCommonParams, searchRaw, searchRawGetAll} from './search';
import {planningApi, superdeskApi} from '../superdeskApi';
import {IRestApiResponse} from 'superdesk-api';
import {planningUtils} from '../utils';
import {planningProfile, planningSearchProfile} from '../selectors/forms';
import {featured} from './featured';
import {PLANNING} from '../constants';
import * as selectors from '../selectors';
import * as actions from '../actions';

function convertPlanningParams(params: ISearchParams): Partial<ISearchAPIParams> {
    return {
        agendas: arrayToString(params.agendas),
        no_agenda_assigned: params.no_agenda_assigned,
        ad_hoc_planning: params.ad_hoc_planning,
        exclude_rescheduled_and_cancelled: params.exclude_rescheduled_and_cancelled,
        no_coverage: params.no_coverage,
        urgency: params.urgency?.qcode,
        featured: params.featured,
        include_scheduled_updates: params.include_scheduled_updates,
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
        repo: FILTER_TYPE.PLANNING,
    })
        .then(modifyResponseForClient);
}

export function searchPlanningGetAll(params: ISearchParams): Promise<Array<IPlanningItem>> {
    return searchRawGetAll<IPlanningItem>({
        ...convertCommonParams(params),
        ...convertPlanningParams(params),
        repo: FILTER_TYPE.PLANNING,
    }).then((items) => {
        items.forEach(modifyItemForClient);

        return items;
    });
}

export function getPlanningById(
    planId: IPlanningItem['_id'],
    saveToStore: boolean = true,
    force: boolean = false
): Promise<IPlanningItem> {
    const {getState, dispatch} = planningApi.redux.store;
    const storedPlannings = selectors.planning.storedPlannings(getState());

    return (storedPlannings[planId] != null && !force) ?
        Promise.resolve(storedPlannings[planId]) :
        superdeskApi.dataApi
            .findOne<IPlanningItem>('planning', planId)
            .then(modifyItemForClient)
            .then((item) => {
                if (saveToStore) {
                    dispatch<any>(actions.planning.api.receivePlannings([item]));
                }

                return item;
            });
}

export function getPlanningByIds(
    planIds: Array<IPlanningItem['_id']>,
    spikeState: ISearchSpikeState = 'draft'
): Promise<Array<IPlanningItem>> {
    if (planIds.length === 0) {
        return Promise.resolve([]);
    } else if (planIds.length > PLANNING.FETCH_IDS_CHUNK_SIZE) {
        // chunk the requests (otherwise URL may become too long)
        const requests: Array<Promise<Array<IPlanningItem>>> = [];

        for (let i = 0; i < Math.ceil(planIds.length / PLANNING.FETCH_IDS_CHUNK_SIZE); i++) {
            requests.push(
                getPlanningByIds(
                    planIds.slice(
                        i * PLANNING.FETCH_IDS_CHUNK_SIZE,
                        (i + 1) * PLANNING.FETCH_IDS_CHUNK_SIZE
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

    return searchPlanning({
        item_ids: planIds,
        spike_state: spikeState,
        only_future: false,
    })
        .then(modifyResponseForClient)
        .then((response) => response._items);
}

export function getLockedPlanningItems(): Promise<Array<IPlanningItem>> {
    return searchPlanning({lock_state: LOCK_STATE.LOCKED})
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

function getPlanningEditorProfile() {
    return planningProfile(planningApi.redux.store.getState());
}

function getPlanningSearchProfile() {
    return planningSearchProfile(planningApi.redux.store.getState());
}

function create(updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    // If the Planning item has coverages, then we need to create the Planning first
    // before saving the coverages
    // As Assignments are created and require a Planning ID
    return !updates.coverages?.length ?
        superdeskApi.dataApi.create<IPlanningItem>('planning', updates) :
        superdeskApi.dataApi.create<IPlanningItem>('planning', {...updates, coverages: []})
            .then((item) => update(item, updates));
}

function update(original: IPlanningItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    return superdeskApi.dataApi.patch<IPlanningItem>(
        'planning',
        original,
        planningUtils.modifyForServer(updates)
    );
}

function createFromEvent(event: IEventItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    return create(planningUtils.modifyForServer({
        slugline: event.slugline,
        planning_date: event._sortDate ?? event.dates.start,
        internal_note: event.internal_note,
        name: event.name,
        place: event.place,
        subject: event.subject,
        anpa_category: event.anpa_category,
        description_text: event.definition_short,
        ednote: event.ednote,
        language: event.language,
        ...updates,
        event_item: event._id,
    }));
}

function setDefaultValues(
    item: DeepPartial<IPlanningItem>,
    event?: IEventItem,
    g2contentType?: IG2ContentType['qcode']
) {
    const state = planningApi.redux.store.getState();
    const newsCoverageStatus = selectors.general.newsCoverageStatus(state);
    const defaultDesk = selectors.general.defaultDesk(state);
    const preferredCoverageDesks = selectors.general.preferredCoverageDesks(state)?.desks ?? {};

    return planningUtils.defaultCoverageValues(
        newsCoverageStatus,
        item,
        event,
        g2contentType,
        defaultDesk,
        preferredCoverageDesks
    );
}

export const planning: IPlanningAPI['planning'] = {
    search: searchPlanning,
    searchGetAll: searchPlanningGetAll,
    getById: getPlanningById,
    getByIds: getPlanningByIds,
    getLocked: getLockedPlanningItems,
    getLockedFeatured: getLockedFeaturedPlanning,
    getEditorProfile: getPlanningEditorProfile,
    getSearchProfile: getPlanningSearchProfile,
    featured: featured,
    create: create,
    update: update,
    createFromEvent: createFromEvent,
    coverages: {
        setDefaultValues: setDefaultValues,
    },
};
