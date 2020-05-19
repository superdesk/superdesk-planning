import {cloneDeep, get, uniq, find} from 'lodash';
import {createReducer} from './createReducer';
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

const initialState = {
    plannings: {},
    planningsInList: [],
    currentPlanningId: undefined,
    editorOpened: false,
    readOnly: true,
    planningHistoryItems: [],
};

let plannings;
let plan;

const planningReducer = createReducer(initialState, {
    [RESET_STORE]: () => (initialState),

    [INIT_STORE]: () => (initialState),

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

    [PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY]: (state, payload) => ({
        ...state,
        planningHistoryItems: payload,
    }),

    [PLANNING.ACTIONS.MARK_PLANNING_CANCELLED]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        markPlaning(plan, payload, 'cancelled');
        plan.state = WORKFLOW_STATE.CANCELLED;
        plan.coverages.forEach((coverage) => {
            markCoverage(coverage, payload, 'cancelled');
            get(coverage, 'scheduled_updates', []).forEach(
                (s) => markCoverage(s, payload, 'cancelled')
            );
        });

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.MARK_COVERAGE_CANCELLED]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        if ('etag' in payload) {
            plan._etag = payload.etag;
        }

        plan.coverages.forEach((coverage) => {
            if (payload.ids.indexOf(coverage.coverage_id) !== -1) {
                markCoverage(coverage, payload, 'cancelled');
            }
        });

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.MARK_PLANNING_POSTPONED]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        markPlaning(plan, payload, 'postponed');
        plan.state = WORKFLOW_STATE.POSTPONED;
        plan.coverages.forEach((coverage) => markCoverage(coverage, payload, 'postponed'));

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.LOCK_PLANNING]: (state, payload) => {
        if (!(payload.plan._id in state.plannings)) return state;

        plannings = cloneDeep(state.plannings);
        const newPlan = payload.plan;

        plan = plannings[newPlan._id];

        plan.lock_action = newPlan.lock_action;
        plan.lock_user = newPlan.lock_user;
        plan.lock_time = newPlan.lock_time;
        plan.lock_session = newPlan.lock_session;
        plan._etag = newPlan._etag;

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.plan._id in state.plannings)) return state;

        plannings = cloneDeep(state.plannings);
        const newPlan = payload.plan;

        plan = plannings[newPlan._id];

        delete plan.lock_action;
        delete plan.lock_user;
        delete plan.lock_time;
        delete plan.lock_session;
        plan._etag = newPlan._etag;

        return {
            ...state,
            plannings,
        };
    },

    [LOCKS.ACTIONS.RECEIVE]: (state, payload) => (
        get(payload, 'plans.length', 0) <= 0 ?
            state :
            planningReducer(state, {
                type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                payload: payload.plans,
            })
    ),

    [PLANNING.ACTIONS.SPIKE_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.id in state.plannings)) return state;

        const plannings = cloneDeep(state.plannings);
        const plan = plannings[payload.id];

        plan._etag = payload.etag;
        plan.state = payload.state;
        plan.revert_state = payload.revert_state;

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.UNSPIKE_PLANNING]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.id in state.plannings)) return state;

        const plannings = cloneDeep(state.plannings);
        const plan = plannings[payload.id];

        plan._etag = payload.etag;
        plan.state = payload.state;
        delete plan.revert_state;

        return {
            ...state,
            plannings,
        };
    },

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: (state, payload) => {
        // If the planning is not loaded, disregard this action
        if (!(payload.planning in state.plannings) ||
                get(state.plannings[payload.planning], 'lock_action') !== ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action) {
            return state;
        }

        let plannings = cloneDeep(state.plannings);
        let plan = plannings[payload.planning];

        plan._etag = payload.planning_etag;

        const coverage = find(get(plan, 'coverages', []), (c) => c.coverage_id === payload.coverage);

        if (coverage) {
            delete coverage.assigned_to;
            coverage.workflow_status = WORKFLOW_STATE.DRAFT;
        }

        return {
            ...state,
            plannings,
        };
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

    [PLANNING.ACTIONS.EXPIRE_PLANNING]: (state, payload) => {
        let plannings = cloneDeep(state.plannings);

        payload.forEach((planId) => {
            if (plannings[planId])
                plannings[planId].expired = true;
        });

        return {
            ...state,
            plannings,
        };
    },
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
