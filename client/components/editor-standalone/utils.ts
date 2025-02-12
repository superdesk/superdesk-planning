import {isEqual, omit} from 'lodash';
import {ASSIGNMENTS} from '../../constants';
import {IBaseRestApiResponse} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';

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

export async function handleRemovedAssignments(removedAssignmentIds: Array<string>, originalItemId: string) {
    /**
     * If a coverage has `workflow_status` of `draft` or `cancelled`, assigned_to property can be updated without
     * updating from `/assignments`
     */

    const {httpRequestVoidLocal} = superdeskApi;

    for (const id of removedAssignmentIds) {
        const assignment = await planningApi.assignments.getById(id);
        const lockedAssignment = await planningApi.locks
            .lockItem(assignment, ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action);

        await httpRequestVoidLocal({
            method: 'DELETE',
            path: `/assignments/${lockedAssignment._id}`,
            headers: {
                'If-Match': lockedAssignment._etag,
            }
        });
    }

    return await planningApi.planning.getById(originalItemId, true, true);
}
