import {cloneDeep} from 'lodash';

import {
    FILTER_TYPE, IEventItem,
    IG2ContentType,
    IPlanningAPI,
    IPlanningCoverageItem,
    IPlanningItem,
    ISearchAPIParams,
    ISearchParams,
    ISearchSpikeState,
    IPlanningConfig,
} from '../interfaces';
import {appConfig as config} from 'appConfig';

import {arrayToString, convertCommonParams, searchRaw, searchRawGetAll, cvsToString} from './search';
import {planningApi, superdeskApi} from '../superdeskApi';
import {IRestApiResponse} from 'superdesk-api';
import {planningUtils, getErrorMessage} from '../utils';
import {planningProfile, planningSearchProfile} from '../selectors/forms';
import {featured} from './featured';
import {PLANNING} from '../constants';
import * as selectors from '../selectors';
import * as actions from '../actions';

const appConfig = config as IPlanningConfig;

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
        source: cvsToString(params.source, 'id'),
        coverage_user_id: params.coverage_user_id,
        coverage_assignment_status: params.coverage_assignment_status,
        priority: arrayToString(params.priority),
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
    spikeState: ISearchSpikeState = 'draft',
    params?: ISearchParams
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
        ...params ?? {},
    })
        .then(modifyResponseForClient)
        .then((response) => response._items);
}

function getPlanningEditorProfile() {
    return planningProfile(planningApi.redux.store.getState());
}

function getPlanningSearchProfile() {
    return planningSearchProfile(planningApi.redux.store.getState());
}

function create(updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    return superdeskApi.dataApi.create<IPlanningItem>('planning', updates);
}

function update(original: IPlanningItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    return superdeskApi.dataApi.patch<IPlanningItem>(
        'planning',
        original,
        planningUtils.modifyForServer(updates)
    );
}

function createFromEvent(event: IEventItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem> {
    if (updates.update_method == null && appConfig.planning.default_create_planning_series_with_event_series === true) {
        updates.update_method = 'all';
    }

    return create(
        planningUtils.modifyForServer({
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
        }),
    );
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

function addCoverageToWorkflow(
    plan: IPlanningItem,
    coverage: IPlanningCoverageItem,
    index: number
): Promise<IPlanningItem> {
    const {getState, dispatch} = planningApi.redux.store;
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    const coverageStatuses = selectors.general.newsCoverageStatus(getState());
    const updates = {coverages: cloneDeep(plan.coverages)};

    updates.coverages[index] = planningUtils.getActiveCoverage(coverage, coverageStatuses);

    return planning.update(plan, updates)
        .then((updatedPlan) => {
            notify.success(gettext('Coverage added to workflow.'));
            dispatch<any>(actions.planning.api.receivePlannings([updatedPlan]));

            return updatedPlan;
        })
        .catch((error) => {
            notify.error(getErrorMessage(
                error,
                gettext('Failed to add coverage to workflow')
            ));

            return Promise.reject(error);
        });
}

export const planning: IPlanningAPI['planning'] = {
    search: searchPlanning,
    searchGetAll: searchPlanningGetAll,
    getById: getPlanningById,
    getByIds: getPlanningByIds,
    getEditorProfile: getPlanningEditorProfile,
    getSearchProfile: getPlanningSearchProfile,
    featured: featured,
    create: create,
    update: update,
    createFromEvent: createFromEvent,
    coverages: {
        setDefaultValues: setDefaultValues,
        addCoverageToWorkflow: addCoverageToWorkflow,
    },
};
