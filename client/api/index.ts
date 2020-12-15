import {IPlanningAPI} from '../interfaces';
import {searchRaw} from './search';
import {
    searchEvents,
    getEventById,
    getEventByIds,
    getLockedEvents,
} from './events';
import {
    getLockedFeaturedPlanning,
    getPlanningById,
    getPlanningByIds,
    getLockedPlanningItems,
    searchPlanning,
} from './planning';
import {searchCombined} from './combined';

export const planningApis: Omit<IPlanningAPI, 'redux'> = {
    events: {
        search: searchEvents,
        getById: getEventById,
        getByIds: getEventByIds,
        getLocked: getLockedEvents,
    },
    planning: {
        search: searchPlanning,
        getById: getPlanningById,
        getByIds: getPlanningByIds,
        getLocked: getLockedPlanningItems,
        getLockedFeatured: getLockedFeaturedPlanning,
    },
    combined: {
        search: searchCombined,
    },
    search: searchRaw,
};
