import {createSelector} from 'reselect';
import {get} from 'lodash';
import {ITEM_TYPE} from '../constants';

// Helper function
const getcurrentItem = (itemId, itemType, events, plannings, isLoading, values, modal = false) => {
    if (get(values, 'duplicate_from') && itemId === null) {
        return values;
    } else if (itemId === null || isLoading) {
        return null;
    } else if (itemType === ITEM_TYPE.EVENT) {
        return get(events, itemId) || null;
    } else if (itemType === ITEM_TYPE.PLANNING) {
        return get(plannings, itemId) || null;
    }

    return null;
};

/** Profiles **/
export const profiles = (state) => get(state, 'forms.profiles', {});
export const coverageProfile = createSelector([profiles], (p) => get(p, 'coverage', {}));
export const eventProfile = createSelector([profiles], (p) => get(p, 'event', {}));
export const planningProfile = createSelector([profiles], (p) => get(p, 'planning', {}));

export const defaultEventDuration = createSelector(
    [eventProfile],
    (profile) => parseInt(get(profile, 'editor.dates.default_duration_on_change', 1), 10)
);


/** Autosaves **/
export const autosaves = (state) => get(state, 'forms.autosaves', {});
export const eventAutosaves = createSelector([autosaves], (a) => get(a, 'event', {}));
export const planningAutosaves = createSelector([autosaves], (a) => get(a, 'planning', {}));

/** Forms */
export const currentItemId = (state) => get(state, 'forms.itemId', null);
export const currentItemType = (state) => get(state, 'forms.itemType', null);
export const isLoadingItem = (state) => get(state, 'forms.loadingEditItem', false);
export const initialValues = (state) => get(state, 'forms.initialValues', null);
export const editorModalView = (state) => get(state, 'forms.modalView', false);

const storedEvents = (state) => get(state, 'events.events', {});
const storedPlannings = (state) => get(state, 'planning.plannings', {});

export const currentItem = createSelector(
    [currentItemId, currentItemType, storedEvents, storedPlannings, isLoadingItem, initialValues],
    (itemId, itemType, events, plannings, isLoading, values) => (
        getcurrentItem(itemId, itemType, events, plannings, isLoading, values)
    ));

export const currentItemIdModal = (state) => get(state, 'forms.itemIdModal', null);
export const currentItemTypeModal = (state) => get(state, 'forms.itemTypeModal', null);
export const isLoadingItemModal = (state) => get(state, 'forms.loadingEditItemModal', false);
export const initialValuesModal = (state) => get(state, 'forms.initialValuesModal', null);

export const currentItemModal = createSelector(
    [currentItemIdModal, currentItemTypeModal, storedEvents, storedPlannings, isLoadingItemModal, initialValuesModal],
    (itemId, itemType, events, plannings, isLoading, values) => (
        getcurrentItem(itemId, itemType, events, plannings, isLoading, values, true)
    ));