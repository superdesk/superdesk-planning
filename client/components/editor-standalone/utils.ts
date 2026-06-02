import type {IEventOrPlanningItem, IPlanningItem, IProfileSchemaType, IProfileSchemaTypeString} from 'interfaces';
import type {IBaseRestApiResponse} from 'superdesk-api';
import {isEqual, omit} from 'lodash';

export function omitFields<T extends IBaseRestApiResponse>(
    item: Partial<T> | T,
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

function cleanAndSortPlans(plans: Array<Partial<IPlanningItem>>) {
    return plans.map((x) => x._id).sort((a, b) => a.localeCompare(b));
}

export function areEmbeddedItemsDirty<T extends Partial<IEventOrPlanningItem>>(original: T, diff: T) {
    if (diff.type === 'event' && original.type === 'event') { // check both so type narrowing works
        const origPlans = (original.associated_plannings ?? []);
        const diffPlans = (diff.associated_plannings ?? []);

        if (origPlans.length !== diffPlans.length) {
            return true;
        }

        const plansOriginal = cleanAndSortPlans(origPlans);
        const plansDiff = cleanAndSortPlans(diffPlans);

        // both arrays are sorted, to make sure order of items doesn't make a difference
        return !isEqual(plansOriginal, plansDiff);
    } else if (diff.type === 'planning' && (diff._unsaved_related_events ?? []).length > 0) {
        return true;
    } else {
        return false;
    }
}
