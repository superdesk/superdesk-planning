import {cloneDeep, get, uniq, without, find} from 'lodash';
import {createReducer, getItemType} from '../utils';
import moment from 'moment';
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
    selectedItems: [],
    currentPlanningId: undefined,
    editorOpened: false,
    readOnly: true,
    planningHistoryItems: [],
};

let plannings;
let plan;
let index;

const modifyPlanningsBeingAdded = (state, payload) => {
    // payload must be an array. If not, we transform
    const plans = Array.isArray(payload) ? payload : [payload];

    // clone plannings
    plannings = cloneDeep(get(state, 'plannings'));
    // add to state.plannings, use _id as key
    plans.forEach((planning) => {
        planning.planning_date = moment(planning.planning_date);
        // Make sure that the Planning item has the coverages array
        planning.coverages = get(planning, 'coverages', []);
        modifyCoveragesForPlanning(planning);
        plannings[planning._id] = planning;
    });
};

const modifyCoveragesForPlanning = (planning) => {
    // As with events, change the coverage dates to moment objects
    planning.coverages.forEach((cov) => {
        if (get(cov, 'planning.scheduled')) {
            cov.planning.scheduled = moment(cov.planning.scheduled);
        }
    });
};

const planningReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

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

    [PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD]: (state, payload) => (
        {
            ...state,
            filterPlanningKeyword: payload,
        }
    ),

    [PLANNING.ACTIONS.RECEIVE_PLANNINGS]: (state, payload) => {
        modifyPlanningsBeingAdded(state, payload);
        // return new state
        return {
            ...state,
            plannings: plannings,
        };
    },

    [PLANNING.ACTIONS.PREVIEW_PLANNING]: (state, payload) => {
        if (!state.currentPlanningId || state.currentPlanningId !== payload) {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload,
                readOnly: true,
            };
        } else {
            return state;
        }
    },

    [PLANNING.ACTIONS.OPEN_PLANNING_EDITOR]: (state, payload) => {
        if (payload._id) {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload._id,
                readOnly: false,
            };
        } else {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload,
                readOnly: false,
            };
        }
    },

    [PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR]: (state) => (
        {
            ...state,
            editorOpened: false,
            currentPlanningId: undefined,
        }
    ),

    [PLANNING.ACTIONS.RECEIVE_COVERAGE]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        // Either add or update the coverage item
        index = plan.coverages.findIndex((c) => c._id === payload._id);
        if (index === -1) {
            plan.coverages.push(payload);
        } else {
            plan.coverages.splice(index, 1, payload);
        }

        modifyCoveragesForPlanning(plan);

        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.COVERAGE_DELETED]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        // Remove the coverage from the planning item
        index = plan.coverages.findIndex((c) => c._id === payload._id);
        if (index === -1) return state;

        plan.coverages.splice(index, 1);
        return {
            ...state,
            plannings,
        };
    },

    [PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY]: (state, payload) => ({
        ...state,
        planningHistoryItems: payload,
    }),

    [PLANNING.ACTIONS.SET_ADVANCED_SEARCH]: (state, payload) => (
        {
            ...state,
            search: {
                ...state.search,
                currentSearch: payload,
            },
        }
    ),

    [PLANNING.ACTIONS.CLEAR_ADVANCED_SEARCH]: (state) => (
        {
            ...state,
            search: {
                ...state.search,
                currentSearch: undefined,
            },
        }
    ),

    [PLANNING.ACTIONS.MARK_PLANNING_CANCELLED]: (state, payload) => {
        plannings = cloneDeep(state.plannings);
        plan = get(plannings, payload.planning_item, null);

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state;

        markPlaning(plan, payload, 'cancelled');
        plan.state = WORKFLOW_STATE.CANCELLED;
        plan.coverages.forEach((coverage) => markCoverage(coverage, payload, 'cancelled'));

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

    [PLANNING.ACTIONS.TOGGLE_SELECTED]: (state, payload) => {
        const selected = state.selectedItems;
        const index = selected.indexOf(payload);

        return {
            ...state,
            selectedItems: index === -1 ? selected.concat([payload]) : without(selected, payload),
        };
    },

    [PLANNING.ACTIONS.DESELECT_ALL]: (state) => ({
        ...state,
        selectedItems: [],
    }),

    [PLANNING.ACTIONS.SELECT_ALL]: (state) => ({
        ...state,
        selectedItems: state.planningsInList.concat([]),
    }),

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
        if (!(payload.planning in state.plannings)) return state;

        let plannings = cloneDeep(state.plannings);
        let plan = plannings[payload.planning];

        // Remove the lock from the item
        delete plan.lock_action;
        delete plan.lock_user;
        delete plan.lock_time;
        delete plan.lock_session;
        plan._etag = payload.planning_etag;

        const coverage = find(get(plan, 'coverages', []), (c) => c.coverage_id === payload.coverage);

        if (coverage) {
            delete coverage.assigned_to;
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
    }
});

const markPlaning = (plan, payload, action) => {
    let ednote = `------------------------------------------------------------
Planning ${action}
`;

    if (payload.event_cancellation) {
        ednote = `------------------------------------------------------------
Event ${action}
`;
    }

    if (get(payload, 'reason', null) !== null) {
        ednote += `Reason: ${payload.reason}\n`;
    }

    if (get(plan, 'ednote', null) !== null) {
        ednote = `${plan.ednote}\n\n${ednote}`;
    }

    plan.ednote = ednote;
};

const markCoverage = (coverage, payload, action) => {
    let note = `------------------------------------------------------------
Planning has been ${action}
`;

    if (payload.event_cancellation) {
        note = `------------------------------------------------------------
Event has been ${action}
`;
    } else if (payload.ids) {
        note = `------------------------------------------------------------
Coverage ${action}
`;
    }

    if (get(payload, 'reason', null) !== null) {
        note += `Reason: ${payload.reason}\n`;
    }

    if (get(coverage, 'planning.internal_note', null) !== null) {
        note = `${coverage.planning.internal_note}\n\n${note}`;
    }

    if (get(coverage, 'planning.ednote', null) !== null) {
        note = `${coverage.planning.ednote}\n\n${note}`;
    }

    if ('coverage_state' in payload) {
        coverage.news_coverage_status = payload.coverage_state;
    }

    if (action === WORKFLOW_STATE.CANCELLED) {
        coverage.workflow_status = WORKFLOW_STATE.CANCELLED;
    }

    coverage.planning.internal_note = note;
};

export default planningReducer;
