import {IEventOrPlanningItem, IProfileSchemaType, IProfileSchemaTypeString} from 'interfaces';
import {isEqual, omit} from 'lodash';
import {isMoment} from 'moment';
import {IBaseRestApiResponse} from 'superdesk-api';

export function omitFields<T extends IBaseRestApiResponse>(
    item: Partial<T>,
    omitId: boolean = false, // useful when patching
): Partial<T> {
    const baseApiFields = [
        '_created',
        '_links',
        '_updated',
        '_etag',
        '_status',
    ];

    if (omitId) {
        baseApiFields.push('_id');
    }

    return {...omit(item, baseApiFields)};
}

export function isMultiLineField(fieldSchema: IProfileSchemaType) {
    return (fieldSchema as IProfileSchemaTypeString)?.field_type === 'multi_line';
}

const FIELDS_TO_OMIT_FOR_COMPARISON = ['_links', '_planning_schedule', '_updates_schedule', 'event'];

export function areEmbeddedItemsDirty<T extends Partial<IEventOrPlanningItem>>(original: T, diff: T) {
    if (diff.type === 'event' && original.type === 'event') { // check both so type narrowing works
        const origPlans = (original.associated_plannings ?? []);
        const diffPlans = (diff.associated_plannings ?? []);

        if (origPlans.length !== diffPlans.length) {
            return true;
        }

        const plansOriginal = origPlans.map((x) => {
            const itemCleaned = omit(x, FIELDS_TO_OMIT_FOR_COMPARISON);

            if (isMoment(itemCleaned.planning_date)) {
                itemCleaned.planning_date = itemCleaned.planning_date.toISOString();
            }

            return itemCleaned;
        }).sort((a, b) => a._id.localeCompare(b._id));
        const plansDiff = diffPlans.map((x) => {
            const itemCleaned = omit(x, FIELDS_TO_OMIT_FOR_COMPARISON);

            if (isMoment(itemCleaned.planning_date)) {
                itemCleaned.planning_date = itemCleaned.planning_date.toISOString();
            }

            return itemCleaned;
        }).sort((a, b) => a._id.localeCompare(b._id));

        // both arrays are sorted, to make sure order of items doesn't make a difference
        return !isEqual(plansOriginal, plansDiff);
    } else if (diff.type === 'planning' && (diff._unsaved_related_events ?? []).length > 0) {
        return true;
    } else {
        return false;
    }
}
