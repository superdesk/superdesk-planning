import moment from 'moment';

import {IEventItem, IEventOrPlanningItem, IPlanningItem} from '../interfaces';
import {MAIN} from '../constants';

/**
 * Default chronological sort for the Planning list views.
 *
 * Sorts by Event `dates.start`, falling back to Planning `planning_date`,
 * by comparing epoch milliseconds. This is the Superdesk default used when
 * no custom comparator is registered (or for views that should not use one).
 */
export const defaultSort = (items: Array<IEventOrPlanningItem>): Array<IEventOrPlanningItem> =>
    items.sort((x, y) => {
        const item1Date = (x as IEventItem).dates?.start ?? (x as IPlanningItem).planning_date;
        const item2Date = (y as IEventItem).dates?.start ?? (y as IPlanningItem).planning_date;

        // Sort items with missing dates last
        if (item1Date == null && item2Date == null) return 0;
        if (item1Date == null) return 1;
        if (item2Date == null) return -1;

        return moment(item1Date).valueOf() - moment(item2Date).valueOf();
    });

/**
 * Sort items for a given list view.
 *
 * When `activeFilter` is `PLANNING` and a custom `comparePlanningItems`
 * comparator is supplied (e.g. by the STT deployment), the custom strategy
 * is used. For every other view (`EVENTS`, `COMBINED`) — or when no custom
 * comparator is registered — the default chronological sort is used.
 *
 * @param items               The items to sort (sorted in place, like Array.sort).
 * @param activeFilter        The current list view (`MAIN.FILTERS.PLANNING|EVENTS|COMBINED`).
 * @param comparePlanningItems Optional custom comparator supplied via extension config.
 * @returns                   The sorted array.
 */
export const sortItems = (
    items: Array<IEventOrPlanningItem>,
    activeFilter: string,
    comparePlanningItems?: (a: IPlanningItem, b: IPlanningItem) => number,
): Array<IEventOrPlanningItem> => {
    if (activeFilter === MAIN.FILTERS.PLANNING && comparePlanningItems != null) {
        return items.sort((a, b) => comparePlanningItems(a as IPlanningItem, b as IPlanningItem));
    }

    return defaultSort(items);
};
