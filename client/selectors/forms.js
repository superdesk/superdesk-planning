import {createSelector} from 'reselect';
import {get} from 'lodash';
import {ITEM_TYPE} from '../constants';

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

const storedEvents = (state) => get(state, 'events.events', {});
const storedPlannings = (state) => get(state, 'planning.plannings', {});

export const currentItem = createSelector(
    [currentItemId, currentItemType, storedEvents, storedPlannings, isLoadingItem],
    (itemId, itemType, events, plannings, isLoading) => {
        if (itemId === null || isLoading) {
            return null;
        } else if (itemType === ITEM_TYPE.EVENT) {
            return get(events, itemId) || null;
        } else if (itemType === ITEM_TYPE.PLANNING) {
            return get(plannings, itemId) || null;
        }

        return null;
    }
);
