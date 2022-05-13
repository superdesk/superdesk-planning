import moment from 'moment-timezone';
import {createSelector} from 'reselect';
import {cloneDeep} from 'lodash';

import {appConfig} from 'appConfig';
import {IPlanningAppState} from '../interfaces';

export const featureLockUser = (state: IPlanningAppState) => state.featuredPlanning?.lock?.user ?? null;
export const featureLockSession = (state: IPlanningAppState) => state.featuredPlanning?.lock?.session ?? null;
export const inUse = (state: IPlanningAppState) => state.featuredPlanning?.inUse ?? false;
export const storedPlannings = (state: IPlanningAppState) => state.featuredPlanning?.plannings.storedItems ?? {};
export const featuredPlanIdsInList = (state: IPlanningAppState) => (
    state.featuredPlanning?.plannings?.sortedItemsForDate ?? []
);
export const featuredPlanningItem = (state: IPlanningAppState) => state.featuredPlanning?.currentFeaturedItem;

export const currentSearchDate = (state: IPlanningAppState) => (
    state.featuredPlanning?.currentSearchParams?.start_date ||
        moment.tz(moment(), appConfig.default_timezone)
);

export const loading = (state: IPlanningAppState) => state.featuredPlanning?.loading ?? false;

export const isLockedForCurrentUser = (state: IPlanningAppState) => (
    state.featuredPlanning?.lock?.session === state.session.sessionId
);

// Planning item's included in current FeaturedItem list
export const selectedPlanningIds = (state: IPlanningAppState) => (
    state.featuredPlanning?.plannings?.selected || []
);
export const selectedPlanningItems = createSelector(
    [storedPlannings, selectedPlanningIds],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

// Planning item's available for inclusion into current FeaturedItem list
export const unselectedPlanningIds = (state: IPlanningAppState) => (
    state.featuredPlanning?.plannings?.unselected || []
);
export const unselectedPlanningItems = createSelector(
    [storedPlannings, unselectedPlanningIds],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

// Planning item's automatically removed from current FeaturedItem list
export const autoRemovedPlanningIds = (state: IPlanningAppState) => (
    state.featuredPlanning?.plannings?.autoRemove ?? []
);
export const autoRemovedPlanningItems = createSelector(
    [storedPlannings, autoRemovedPlanningIds],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

export const notificationList = (state: IPlanningAppState) => (
    state.featuredPlanning?.modal?.notifications || []
);
export const highlightsList = (state: IPlanningAppState) => (
    state.featuredPlanning?.modal?.highlights || []
);
export const isDirty = (state: IPlanningAppState) => (
    state.featuredPlanning?.modal?.dirty ?? false
);
export const isReadOnly = (state: IPlanningAppState) => (
    state.featuredPlanning?.currentSearchParams?.start_date == null ||
    (state.featuredPlanning?.currentSearchParams?.start_date as moment.Moment).isBefore(
        appConfig.default_timezone,
        'day'
    )
);
