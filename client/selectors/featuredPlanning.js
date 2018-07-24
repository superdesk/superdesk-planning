import moment from 'moment';
import momentTz from 'moment-timezone';
import {createSelector} from 'reselect';
import {get, cloneDeep} from 'lodash';
import {getStartOfWeek, defaultTimeZone} from './config';
import {planningUtils, getSearchDateRange} from '../utils';

export const featureLockUser = (state) => get(state, 'featuredPlanning.featureLockUser', null);
export const featureLockSession = (state) => get(state, 'featuredPlanning.featureLockSession', null);
export const inUse = (state) => get(state, 'featuredPlanning.inUse', null);
export const storedPlannings = (state) => get(state, 'featuredPlanning.plannings', {});
export const featuredPlanIdsInList = (state) => get(state, 'featuredPlanning.planningsInList', null);
export const featuredPlanningItem = (state) => get(state, 'featuredPlanning.item', null);
export const previousFilter = (state) => get(state, 'featuredPlanning.previousFilter', false);
export const currentSearchDate = (state) =>
    get(state, 'featuredPlanning.currentSearch.advancedSearch.dates.start', momentTz.tz(moment(), defaultTimeZone()));
export const total = (state) => get(state, 'featuredPlanning.total', false);
export const loading = (state) => get(state, 'featuredPlanning.loading', false);
export const unsavedItems = (state) => get(state, 'featuredPlanning.unsavedItems', null);

export const featuredPlansInList = createSelector(
    [storedPlannings, featuredPlanIdsInList],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

export const orderedFeaturedPlanningList = createSelector(
    [featuredPlansInList, currentSearchDate, getStartOfWeek],
    (plansInList, date, startOfWeek) => {
        const search = {
            advancedSearch: {
                dates: {
                    start: moment(date).set({hour: 0, minute: 0}),
                    end: moment(date).set({hour: 23, minute: 59}),
                },
            },
        };
        const dateRange = getSearchDateRange(search, startOfWeek);

        const group = planningUtils.getPlanningByDate(
            plansInList, null, dateRange.startDate, dateRange.endDate
        );

        if (group.length > 0) {
            const featuredPlansForDate = group.find((g) => g.date === date.format('YYYY-MM-DD'));

            return featuredPlansForDate.events || [];
        }

        return group;
    }
);
