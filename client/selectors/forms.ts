import {createSelector} from 'reselect';
import {get, filter} from 'lodash';

import {appConfig} from 'appConfig';

import {ITEM_TYPE, MAIN} from '../constants';
import {sessionId as getSessionId} from './general';
import {isExistingItem} from '../utils';

// Helper function
const getcurrentItem = (itemId, itemType, events, plannings, values, modal = false) => {
    if (get(values, 'duplicate_from') && itemId === null) {
        return values;
    } else if (itemId === null) {
        return null;
    } else if (itemType === ITEM_TYPE.EVENT) {
        return get(events, itemId) || null;
    } else if (itemType === ITEM_TYPE.PLANNING) {
        return get(plannings, itemId) || null;
    }

    return null;
};

/** Profiles **/
export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);
export const profiles = (state) => get(state, 'forms.profiles', {});
export const coverageProfile = createSelector([profiles], (p) => get(p, 'coverage', {}));
export const eventProfile = createSelector([profiles], (p) => get(p, 'event', {}));
export const planningProfile = createSelector([profiles], (p) => get(p, 'planning', {}));
export const eventPostponeProfile = createSelector([profiles], (p) => get(p, 'event_postpone', {}));
export const eventRescheduleProfile = createSelector([profiles], (p) => get(p, 'event_reschedule', {}));
export const eventCancelProfile = createSelector([profiles], (p) => get(p, 'event_cancel', {}));
export const planningCancelProfile = createSelector([profiles], (p) => get(p, 'planning_planning_cancel', {}));
export const planningCancelAllCoveragesProfile = createSelector(
    [profiles], (p) => get(p, 'planning_cancel_all_coverage', {})
);
export const coverageCancelProfile = createSelector([profiles], (p) => get(p, 'coverage_cancel_coverage', {}));
export const searchProfile = createSelector(
    [profiles, activeFilter],
    (p, filter) => {
        if (filter === MAIN.FILTERS.EVENTS) {
            return get(p, 'advanced_search.editor.event', {});
        }

        if (filter === MAIN.FILTERS.PLANNING) {
            return get(p, 'advanced_search.editor.planning', {});
        }

        if (filter === MAIN.FILTERS.COMBINED) {
            return get(p, 'advanced_search.editor.combined', {});
        }

        return null;
    });
export const combinedSearchProfile = createSelector(
    [profiles],
    (p) => get(p, 'advanced_search.editor.combined', {})
);
export const eventSearchProfile = createSelector(
    [profiles],
    (p) => get(p, 'advanced_search.editor.event', {})
);
export const planningSearchProfile = createSelector(
    [profiles],
    (p) => get(p, 'advanced_search.editor.planning', {})
);

export const listFields = createSelector([profiles], (p) => {
    const fields = {};

    Object.keys(p).forEach((type) => {
        fields[type] = get(p[type], 'list', {});
    });

    return fields;
});

export const exportListFields = createSelector([profiles], (p) => {
    const fields = {};

    Object.keys(p).forEach((type) => {
        fields[type] = get(p[type], 'export_list', {});
    });

    return fields;
});

export const defaultEventDuration = createSelector(
    [eventProfile],
    (profile) => parseInt(get(profile, 'editor.dates.default_duration_on_change', 1), 10)
);


/** Autosaves **/
export const autosaves = (state) => get(state, 'forms.autosaves', {});

// Selector to get autosave entries for new/non-existing items only
export const newItemAutosaves = createSelector(
    [autosaves, getSessionId],
    (data, sessionId) => ({
        event: filter(data.event, (item) => !isExistingItem(item) && item.lock_session === sessionId)
            .map((item) => item),
        planning: filter(data.planning, (item) => !isExistingItem(item) && item.lock_session === sessionId)
            .map((item) => item),
    })
);

/** Forms - Panel Editor */
export const currentItemId = (state) => get(state, 'forms.editors.panel.itemId', null);
export const currentItemType = (state) => get(state, 'forms.editors.panel.itemType', null);
export const currentItemAction = (state) => get(state, 'forms.editors.panel.action', null);
export const initialValues = (state) => get(state, 'forms.editors.panel.initialValues', null);
export const editorItemHistory = (state) => get(state, 'forms.editors.panel.itemHistory', []);

export const currentAutosave = createSelector(
    [autosaves, currentItemId],
    (autosaveItems, itemId) => (
        autosaveItems.event[itemId] ?? autosaveItems.planning[itemId]
    )
);

const storedEvents = (state) => get(state, 'events.events', {});
const storedPlannings = (state) => get(state, 'planning.plannings', {});

export const currentItem = createSelector(
    [currentItemId, currentItemType, storedEvents, storedPlannings, initialValues],
    (itemId, itemType, events, plannings, values) => (
        getcurrentItem(itemId, itemType, events, plannings, values)
    ));


/** Forms - Modal Editor */
export const currentItemIdModal = (state) => get(state, 'forms.editors.modal.itemId', null);
export const currentItemTypeModal = (state) => get(state, 'forms.editors.modal.itemType', null);
export const currentItemActionModal = (state) => get(state, 'forms.editors.modal.action', null);
export const initialValuesModal = (state) => get(state, 'forms.editors.modal.initialValues', null);
export const editorModalItemHistory = (state) => get(state, 'forms.editors.modal.itemHistory', []);

export const currentItemModal = createSelector(
    [currentItemIdModal, currentItemTypeModal, storedEvents, storedPlannings, initialValuesModal],
    (itemId, itemType, events, plannings, values) => (
        getcurrentItem(itemId, itemType, events, plannings, values, true)
    ));

export const currentAutosaveModal = createSelector(
    [autosaves, currentItemIdModal],
    (autosaveItems, itemId) => (
        autosaveItems.event[itemId] ?? autosaveItems.planning[itemId]
    )
);

export const getPlanningAllowScheduledUpdates = createSelector(
    [coverageProfile],
    (cp) => get(cp, 'editor.flags') &&
        appConfig.planning_allow_scheduled_updates
);
