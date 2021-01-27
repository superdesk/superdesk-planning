import moment from 'moment';

import {IPlanningAPI, IFeaturedPlanningItem, IFeaturedPlanningLock} from '../interfaces';
import {superdeskApi} from '../superdeskApi';

import {getIdForFeauturedPlanning} from '../utils';

function lockFeaturedPlanning(): Promise<Partial<IFeaturedPlanningLock>> {
    return superdeskApi.dataApi.create<Partial<IFeaturedPlanningLock>>('planning_featured_lock', {});
}

function unlockFeaturedPlanning(): Promise<undefined> {
    return superdeskApi.dataApi.create('planning_featured_unlock', {})
        .then(() => undefined);
}

function fetchFeaturedPlanningItemById(id: string): Promise<IFeaturedPlanningItem> {
    return superdeskApi.dataApi.findOne<IFeaturedPlanningItem>('planning_featured', id);
}

function fetchFeaturedPlanningItemByDate(date: moment.Moment): Promise<IFeaturedPlanningItem> {
    return fetchFeaturedPlanningItemById(
        getIdForFeauturedPlanning(date)
    );
}

export const featured: IPlanningAPI['planning']['featured'] = {
    lock: lockFeaturedPlanning,
    unlock: unlockFeaturedPlanning,
    getById: fetchFeaturedPlanningItemById,
    getByDate: fetchFeaturedPlanningItemByDate,
};
