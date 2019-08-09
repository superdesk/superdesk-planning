import {uniq} from 'lodash';
import {MULTISELECT} from '../constants';

const initialState = {
    selectedEventIds: [],
    selectedPlanningIds: [],
    lastSelectedEventDate: null,
    lastSelectedPlanningDate: null,
};

export default function(state = initialState, action) {
    switch (action.type) {
    case MULTISELECT.ACTIONS.SELECT_EVENT:
        return {
            ...state,
            selectedEventIds: uniq([...state.selectedEventIds, action.payload.eventId]),
            lastSelectedEventDate: action.payload.name,
        };

    case MULTISELECT.ACTIONS.DESELECT_EVENT:
        return {
            ...state,
            selectedEventIds: state.selectedEventIds.filter((e) => e !== action.payload),
        };

    case MULTISELECT.ACTIONS.SELECT_ALL_EVENTS:
        return {
            ...state,
            selectedEventIds: action.payload,
        };

    case MULTISELECT.ACTIONS.SELECT_MULTIPLE_EVENTS:
        return {
            ...state,
            selectedEventIds: uniq([...state.selectedEventIds].concat(action.payload)),
        };

    case MULTISELECT.ACTIONS.DESELECT_ALL_EVENTS:
        return {
            ...state,
            selectedEventIds: [],
        };

    case MULTISELECT.ACTIONS.SELECT_PLANNING:
        return {
            ...state,
            selectedPlanningIds: uniq([...state.selectedPlanningIds, action.payload.planningId]),
            lastSelectedPlanningDate: action.payload.name,
        };

    case MULTISELECT.ACTIONS.DESELECT_PLANNING:
        return {
            ...state,
            selectedPlanningIds: state.selectedPlanningIds.filter((p) => p !== action.payload),
        };

    case MULTISELECT.ACTIONS.SELECT_ALL_PLANNINGS:
        return {
            ...state,
            selectedPlanningIds: action.payload,
        };

    case MULTISELECT.ACTIONS.SELECT_MULTIPLE_PLANNINGS:
        return {
            ...state,
            selectedPlanningIds: uniq([...state.selectedPlanningIds].concat(action.payload)),
        };

    case MULTISELECT.ACTIONS.DESELECT_ALL_PLANNINGS:
        return {
            ...state,
            selectedPlanningIds: [],
        };

    default:
        return state;
    }
}
