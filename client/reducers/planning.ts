import {get, uniq, find} from 'lodash';
import {createReducer} from './createReducer';
import {IReloadPagePayload} from '../interfaces';
import {getItemType, planningUtils} from '../utils';
import {
    PLANNING,
    WORKFLOW_STATE,
    RESET_STORE,
    INIT_STORE,
    LOCKS,
    ASSIGNMENTS,
    MAIN,
    ITEM_TYPE,
} from '../constants';
import {produce} from 'immer';

const initialState = {
    plannings: {},
    planningsInList: [],
    currentPlanningId: undefined,
    editorOpened: false,
    readOnly: true,
    planningHistoryItems: [],
};

function reloadListPages(state, payload: IReloadPagePayload) {
    return produce(state, (draft) => {
        // Update the stored Plannings
        payload.plannings.forEach((plan) => {
            draft.plannings[plan._id] = planningUtils.modifyForClient(plan);
        });

        if (payload.currentView === MAIN.FILTERS.PLANNING) {
            // Update the planning list
            draft.planningsInList = payload.items.map((plan) => plan._id);
        }
    });
}

function nextPageLoaded(state, payload: IReloadPagePayload) {
    return produce(state, (draft) => {
        // Update the stored Plannings
        payload.plannings.forEach((plan) => {
            draft.plannings[plan._id] = planningUtils.modifyForClient(plan);
        });

        if (payload.currentView === MAIN.FILTERS.PLANNING) {
            draft.planningsInList = uniq([
                ...draft.planningsInList,
                ...payload.items.map((plan) => plan._id),
            ]);
        }
    });
}

const planningReducer = createReducer(initialState, {
    [RESET_STORE]: () => ({...initialState}),

    [INIT_STORE]: () => ({...initialState}),

    [PLANNING.ACTIONS.SET_LIST]: (state, payload) => (
        {
            ...state,
            planningsInList: payload,
        }
    ),

    [PLANNING.ACTIONS.ADD_TO_LIST]: (state, payload) => (
        planningReducer(state, {
            type: PLANNING.ACTIONS.SET_LIST,
            payload: uniq([...state.planningsInList, ...payload]),
        })
    ),

    [PLANNING.ACTIONS.CLEAR_LIST]: (state) => (
        {
            ...state,
            lastRequestParams: {page: 1},
            planningsInList: [],
        }
    ),

    [PLANNING.ACTIONS.RECEIVE_PLANNINGS]: (state, payload) =>
        // return new state
        ({
            ...state,
            plannings: planningUtils.modifyPlanningsBeingAdded(state, payload),
        }),

    [MAIN.ACTIONS.RELOAD_LIST_PAGES]: reloadListPages,
    [MAIN.ACTIONS.NEXT_PAGE_LOADED]: nextPageLoaded,

    [PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY]: (state, payload) => ({
        ...state,
        planningHistoryItems: payload,
    }),

    [PLANNING.ACTIONS.MARK_PLANNING_CANCELLED]: (state, payload) => (
        produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = get(plannings, payload.planning_item, null);

            // If the planning item is not loaded, disregard this action
            if (plan === null) return;

            markPlaning(plan, payload, 'cancelled');
            plan.state = WORKFLOW_STATE.CANCELLED;
            plan.coverages.forEach((coverage) => {
                markCoverage(coverage, payload, 'cancelled');
                get(coverage, 'scheduled_updates', []).forEach(
                    (s) => markCoverage(s, payload, 'cancelled')
                );
            });
        })
    ),

    [PLANNING.ACTIONS.MARK_COVERAGE_CANCELLED]: (state, payload) => (
        produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = get(plannings, payload.planning_item, null);

            // If the planning item is not loaded, disregard this action
            if (plan === null) return;

            if ('etag' in payload) {
                plan._etag = payload.etag;
            }

            plan.coverages.forEach((coverage) => {
                if (payload.ids.indexOf(coverage.coverage_id) !== -1) {
                    markCoverage(coverage, payload, 'cancelled');
                }
            });
        })
    ),

    [PLANNING.ACTIONS.MARK_PLANNING_POSTPONED]: (state, payload) => (
        produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = get(plannings, payload.planning_item, null);

            // If the planning item is not loaded, disregard this action
            if (plan === null) return;

            markPlaning(plan, payload, 'postponed');
            plan.state = WORKFLOW_STATE.POSTPONED;
            plan.coverages.forEach((coverage) => markCoverage(coverage, payload, 'postponed'));
        })
    ),

    [PLANNING.ACTIONS.LOCK_PLANNING]: (state, payload) => {
        if (!(payload.plan._id in state.plannings)) return state;

        return produce(state, (draft) => {
            const plannings = draft.plannings;
            const newPlan = payload.plan;

            const plan = plannings[newPlan._id];

            plan.lock_action = newPlan.lock_action;
            plan.lock_user = newPlan.lock_user;
            plan.lock_time = newPlan.lock_time;
            plan.lock_session = newPlan.lock_session;
            plan._etag = newPlan._etag;
        });
    },

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.plan._id in state.plannings)) return state;

        return produce(state, (draft) => {
            const plannings = draft.plannings;
            const newPlan = payload.plan;

            const plan = plannings[newPlan._id];

            delete plan.lock_action;
            delete plan.lock_user;
            delete plan.lock_time;
            delete plan.lock_session;
            plan._etag = newPlan._etag;
        });
    },

    [PLANNING.ACTIONS.SPIKE_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.id in state.plannings)) return state;

        return produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = plannings[payload.id];

            plan._etag = payload.etag;
            plan.state = payload.state;
            plan.revert_state = payload.revert_state;
        });
    },

    [PLANNING.ACTIONS.UNSPIKE_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.id in state.plannings)) return state;

        return produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = plannings[payload.id];

            plan._etag = payload.etag;
            plan.state = payload.state;
            delete plan.revert_state;
        });
    },

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.planning in state.plannings) ||
                get(state.plannings[payload.planning], 'lock_action') !== ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action) {
            return state;
        }

        return produce(state, (draft) => {
            const plannings = draft.plannings;
            const plan = plannings[payload.planning];

            plan._etag = payload.planning_etag;

            const coverage = find(get(plan, 'coverages', []), (c) => c.coverage_id === payload.coverage);

            if (coverage) {
                delete coverage.assigned_to;
                coverage.workflow_status = WORKFLOW_STATE.DRAFT;
            }
        });
    },

    [MAIN.ACTIONS.PREVIEW]: (state, payload) => {
        if (getItemType(payload) === ITEM_TYPE.PLANNING) {
            return {
                ...state,
                currentPlanningId: payload._id,
            };
        } else {
            return state;
        }
    },

    [PLANNING.ACTIONS.EXPIRE_PLANNING]: (state, payload) => (
        produce(state, (draft) => {
            const plannings = draft.plannings;

            payload.forEach((planId) => {
                if (plannings[planId])
                    plannings[planId].expired = true;
            });
        })
    ),
});

const markPlaning = (plan, payload, action) => {
    if (get(payload, 'reason.length', 0) > 0) {
        plan.state_reason = payload.reason;
    }
};

const markCoverage = (coverage, payload, action) => {
    if (action === WORKFLOW_STATE.CANCELLED) {
        coverage.previous_status = coverage.workflow_status;
        coverage.workflow_status = WORKFLOW_STATE.CANCELLED;
        if (!get(coverage, 'planning.workflow_status_reason')) {
            coverage.planning.workflow_status_reason = payload.reason;
        }
    } else {
        if (coverage.workflow_status !== WORKFLOW_STATE.CANCELLED && get(payload, 'reason.length', 0) > 0) {
            coverage.planning.workflow_status_reason = payload.reason;
        }

        if ('coverage_state' in payload) {
            coverage.news_coverage_status = payload.coverage_state;
        }
    }
};

export default planningReducer;
