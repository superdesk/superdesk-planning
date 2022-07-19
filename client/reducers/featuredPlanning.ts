import {cloneDeep, isEqual, difference, xor} from 'lodash';
import moment from 'moment-timezone';

import {superdeskApi} from '../superdeskApi';
import {appConfig} from 'appConfig';
import {IFeaturedPlanningState, IPlanningItem, IWorkflowState} from '../interfaces';
import {
    FEATURED_PLANNING,
    RESET_STORE,
    INIT_STORE,
} from '../constants';

import {createReducer} from './createReducer';
import {planningUtils, isExistingItem} from '../utils';

const initialState: IFeaturedPlanningState = {
    currentSearchParams: null,
    plannings: {
        storedItems: {},
        sortedItemsForDate: [],
        unselected: [],
        selected: [],
        autoRemove: [],
    },
    modal: {
        highlights: [],
        notifications: [],
        dirty: false,
    },
    currentFeaturedItem: null,
    loading: false,
    lock: {
        user: null,
        session: null,
    },
    inUse: false,
};

function updateListIds(prevState: IFeaturedPlanningState): IFeaturedPlanningState {
    const featuredItem = prevState.currentFeaturedItem;
    const existingItem = isExistingItem(featuredItem);
    const planIdsInList = prevState.plannings.sortedItemsForDate;
    const isReadOnly = prevState.currentSearchParams?.start_date == null ||
        (prevState.currentSearchParams.start_date as moment.Moment).isBefore(
            appConfig.default_timezone,
            'day'
        );
    let selectedPlanningIds = (existingItem || isReadOnly) ?
        (featuredItem?.items || []) :
        planIdsInList;
    const removePlanningIds = [...prevState.plannings.autoRemove];
    let unselectedPlanningIds = difference(planIdsInList, selectedPlanningIds);

    planIdsInList.forEach((itemId) => {
        const item = prevState.plannings.storedItems[itemId];

        if (item) {
            const statesToRemove: Array<IWorkflowState> = [
                'cancelled',
                'spiked',
                'killed',
            ];

            if (statesToRemove.includes(item.state)) {
                if (!removePlanningIds.includes(itemId)) {
                    removePlanningIds.push(itemId);
                }
                selectedPlanningIds = selectedPlanningIds.filter((planId) => planId !== itemId);
                unselectedPlanningIds = unselectedPlanningIds.filter((planId) => planId !== itemId);
            }
        }
    });

    const dirty = (removePlanningIds?.length ?? 0) > 0 || (
        !existingItem &&
        selectedPlanningIds?.length &&
        !isReadOnly
    );

    return {
        ...prevState,
        plannings: {
            ...prevState.plannings,
            selected: selectedPlanningIds.filter((itemId) => !removePlanningIds.includes(itemId)),
            unselected: unselectedPlanningIds,
            autoRemove: removePlanningIds,
        },
        modal: {
            ...prevState.modal,
            dirty: dirty,
            highlights: [],
        },
    };
}

interface IItemStateChanges {
    before: {
        item?: IPlanningItem;
        included: boolean;
        unselected: boolean;
        selected: boolean;
        autoRemove: boolean;
    };
    after: {
        item: IPlanningItem;
        included: boolean;
    };
    isNewFeaturedItem: boolean;
}

function isPlanIncludedInList(state: IFeaturedPlanningState, item?: IPlanningItem): boolean {
    const statesToExclude: Array<IWorkflowState> = [
        'cancelled',
        'spiked',
        'killed',
    ];

    return (item == null || statesToExclude.includes(item.state) || !item.featured) ?
        false :
        planningUtils.getFeaturedPlanningItemsForDate(
            [item],
            state.currentSearchParams.start_date
        ).findIndex((i) => i._id === item._id) >= 0;
}

function genItemStateChanges(state: IFeaturedPlanningState, item: IPlanningItem): IItemStateChanges {
    const original = state.plannings.storedItems[item._id];

    return {
        before: {
            item: original,
            included: isPlanIncludedInList(state, original),
            unselected: state.plannings.unselected.includes(item._id),
            selected: state.plannings.selected.includes(item._id),
            autoRemove: state.plannings.autoRemove.includes(item._id),
        },
        after: {
            item: item,
            included: isPlanIncludedInList(state, item),
        },
        isNewFeaturedItem: !isExistingItem(state.currentFeaturedItem),
    };
}

function removeItemFromList(list: Array<IPlanningItem['_id']>, itemId: IPlanningItem['_id']) {
    return list.filter((id) => id !== itemId);
}

function onPlanningItemUpdated(prevState: IFeaturedPlanningState, updatedItem: IPlanningItem): IFeaturedPlanningState {
    if (!prevState.inUse || !prevState.currentSearchParams?.start_date) {
        return prevState;
    }

    const state = cloneDeep(prevState);
    const itemStates = genItemStateChanges(state, updatedItem);

    if (!itemStates.before.included && !itemStates.after.included) {
        // This item wasn't included before, and isn't included now
        // so return the current state
        return prevState;
    }

    const {gettext} = superdeskApi.localization;

    state.plannings.storedItems[updatedItem._id] = updatedItem;

    if (itemStates.before.included === itemStates.after.included) {
        return state;
    } else if (itemStates.after.included) {
        // The item should now be included
        if (itemStates.isNewFeaturedItem) {
            // Append to the currently selected list
            state.plannings.selected.push(updatedItem._id);
            state.modal.notifications = [
                gettext('Story with slugline "{{ slugline }}" is added to the list', {
                    slugline: updatedItem.slugline,
                }),
            ];
            state.modal.highlights.push(updatedItem._id);
        } else {
            // Add to the Available list
            if (state.currentFeaturedItem.items.includes(updatedItem._id)) {
                // Restore the item in the Selected list
                state.plannings.selected.push(updatedItem._id);
            } else {
                // Move the item into the Available list
                state.plannings.unselected.push(updatedItem._id);
            }

            // Remove the item from `autoRemove`, and display notification
            state.plannings.autoRemove = removeItemFromList(state.plannings.autoRemove, updatedItem._id);
            state.modal.notifications = [
                gettext('Story with slugline "{{ slugline }}" is removed from the list', {
                    slugline: updatedItem.slugline,
                }),
            ];
            state.modal.highlights.push(updatedItem._id);
        }
        // The item should be removed/excluded
    } else if (itemStates.isNewFeaturedItem) {
        // Simply remove this item from the selectable list
        state.plannings.selected = removeItemFromList(state.plannings.selected, updatedItem._id);
        state.plannings.unselected = removeItemFromList(state.plannings.unselected, updatedItem._id);
        state.plannings.autoRemove = removeItemFromList(state.plannings.autoRemove, updatedItem._id);
    } else if (itemStates.before.unselected) {
        // Simply remove this item from the list
        state.plannings.unselected = removeItemFromList(state.plannings.unselected, updatedItem._id);
    } else if (itemStates.before.selected) {
        // Move this item to the `autoRemove` list
        state.plannings.selected = removeItemFromList(state.plannings.selected, updatedItem._id);
        state.plannings.autoRemove.push(updatedItem._id);
        state.modal.notifications = [
            gettext('Story with slugline "{{ slugline }}" is removed from the list', {
                slugline: updatedItem.slugline,
            }),
        ];
        state.modal.highlights.push(updatedItem._id);
    }

    return state;
}

function updatePlanningMetadata(prevState: IFeaturedPlanningState, item: IPlanningItem) {
    if (prevState.plannings.storedItems[item._id] == null) {
        return prevState;
    }

    return {
        ...prevState,
        plannings: {
            ...prevState.plannings,
            storedItems: {
                ...prevState.plannings.storedItems,
                [item._id]: item,
            },
        },
    };
}

function moveItemToSelected(prevState: IFeaturedPlanningState, itemId: IPlanningItem['_id']): IFeaturedPlanningState {
    const state = cloneDeep(prevState);

    state.plannings.selected.unshift(itemId);
    state.plannings.unselected = removeItemFromList(state.plannings.unselected, itemId);
    state.modal.dirty = state.currentFeaturedItem == null || xor(
        state.currentFeaturedItem.items ?? [],
        state.plannings.selected
    ).length > 0;
    state.modal.highlights.push(itemId);

    return state;
}

function moveItemToUnselected(prevState: IFeaturedPlanningState, itemId: IPlanningItem['_id']): IFeaturedPlanningState {
    const state = cloneDeep(prevState);

    state.plannings.selected = removeItemFromList(state.plannings.selected, itemId);
    state.plannings.unselected.unshift(itemId);
    state.modal.dirty = state.currentFeaturedItem == null || xor(
        state.currentFeaturedItem.items ?? [],
        state.plannings.selected
    ).length > 0;
    state.modal.highlights.push(itemId);

    return state;
}

const featuredPlanningReducer = createReducer(initialState, {
    [RESET_STORE]: () => null,
    [INIT_STORE]: () => cloneDeep(initialState),

    // Locks
    [FEATURED_PLANNING.ACTIONS.SET_LOCK_USER]: (state, payload) => ({
        ...state,
        lock: {
            user: payload.user,
            session: payload.session,
        },
    }),

    [FEATURED_PLANNING.ACTIONS.SET_CURRENT_SEARCH_PARAMS]: (state, payload) => ({
        ...state,
        currentSearchParams: payload,
    }),
    [FEATURED_PLANNING.ACTIONS.SET_FEATURED_PLANNING_ITEM]: (state, payload) => ({
        ...state,
        currentFeaturedItem: payload,
    }),

    // Modal Attributes
    [FEATURED_PLANNING.ACTIONS.CLEAR_NOTIFICATIONS]: (state) => ({
        ...state,
        modal: {
            ...state.modal,
            notifications: [],
        },
    }),

    [FEATURED_PLANNING.ACTIONS.MOVE_ITEM_TO_SELECTED]: moveItemToSelected,
    [FEATURED_PLANNING.ACTIONS.MOVE_ITEM_TO_UNSELECTED]: moveItemToUnselected,
    [FEATURED_PLANNING.ACTIONS.REMOVE_HIGHLIGHT]: (state: IFeaturedPlanningState, itemId: IPlanningItem['_id']) => ({
        ...state,
        modal: {
            ...state.modal,
            highlights: state.modal.highlights.filter((id) => id !== itemId),
        },
    }),

    // Planning Items
    [FEATURED_PLANNING.ACTIONS.STORE_PLANNING_ITEMS]: (state, payload) => ({
        ...state,
        plannings: {
            ...state.plannings,
            storedItems: payload,
        },
    }),
    [FEATURED_PLANNING.ACTIONS.CLEAR_LISTS]: (state) => ({
        ...state,
        plannings: cloneDeep(initialState.plannings),
        modal: cloneDeep(initialState.modal),
        currentFeaturedItem: null,
        currentSearchParams: null,
    }),
    [FEATURED_PLANNING.ACTIONS.SET_AVAILABLE_ITEMS]: (state, payload) => ({
        ...state,
        plannings: {
            ...state.plannings,
            sortedItemsForDate: payload,
        },
    }),
    [FEATURED_PLANNING.ACTIONS.UPDATE_SELECTED_LIST_ORDER]: (state, payload) => ({
        ...state,
        plannings: {
            ...state.plannings,
            selected: payload,
        },
        modal: {
            ...state.modal,
            dirty: !isEqual(state.currentFeaturedItem?.items, payload),
        }
    }),
    [FEATURED_PLANNING.ACTIONS.SET_REMOVE_LIST]: (state, payload) => ({
        ...state,
        plannings: {
            ...state.plannings,
            autoRemove: payload,
        },
    }),
    [FEATURED_PLANNING.ACTIONS.UPDATE_LIST_IDS]: updateListIds,
    [FEATURED_PLANNING.ACTIONS.UPDATE_PLANNING_AND_LISTS]: onPlanningItemUpdated,
    [FEATURED_PLANNING.ACTIONS.UPDATE_PLANNING_METADATA]: updatePlanningMetadata,

    [FEATURED_PLANNING.ACTIONS.SET_LOADING]: (state, payload) => ({
        ...state,
        loading: payload,
    }),
    [FEATURED_PLANNING.ACTIONS.SET_IN_USE]: (state, payload) => !payload ?
        cloneDeep(initialState) :
        ({
            ...state,
            inUse: true,
        }),
});

export default featuredPlanningReducer;
