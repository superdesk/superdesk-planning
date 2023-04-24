import moment from 'moment';

import {IPlanningAPI, IFeaturedPlanningItem, IFeaturedPlanningSaveItem} from '../interfaces';
import {planningApi, superdeskApi} from '../superdeskApi';

import {getIdForFeauturedPlanning} from '../utils';
import {featuredPlanningItem} from '../selectors/featuredPlanning';

function fetchFeaturedPlanningItemById(id: string): Promise<IFeaturedPlanningItem> {
    return superdeskApi.dataApi.findOne<IFeaturedPlanningItem>('planning_featured', id);
}

function fetchFeaturedPlanningItemByDate(date: moment.Moment): Promise<IFeaturedPlanningItem> {
    return fetchFeaturedPlanningItemById(
        getIdForFeauturedPlanning(date)
    );
}

function saveFeaturedPlanning(updates: Partial<IFeaturedPlanningItem>): Promise<IFeaturedPlanningItem> {
    const {getState} = planningApi.redux.store;
    const original = featuredPlanningItem(getState());

    return superdeskApi.dataApi.patch<IFeaturedPlanningItem>('planning_featured', original, {...updates});
}

export const featured: IPlanningAPI['planning']['featured'] = {
    getById: fetchFeaturedPlanningItemById,
    getByDate: fetchFeaturedPlanningItemByDate,
    save: saveFeaturedPlanning,
};
