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

export async function handleRemovedAssignments(current: Partial<IPlanningItem>, original: IPlanningItem) {
    /**
     * If a coverage has `workflow_status` of `draft` or `cancelled`, assigned_to property can be updated without
     * updating from `/assignments`
     */

    // Coverages that were previously active, but now because they got unassigned they are moved to draft
    const assignmentsCurrent = current.coverages
        .filter((x) => x.workflow_status === 'draft'
            && original.coverages.find((z) => z.coverage_id === x.coverage_id && z.workflow_status === 'active') != null
        );
    const assignmentsOriginal = original.coverages
        .filter((x) => x.workflow_status !== 'draft' && x.workflow_status !== 'cancelled');

    const removedAssignmentIds = (() => {
        const changed = [];

        for (let i = 0; i <= assignmentsOriginal.length - 1; i++) {
            if (
                isEqual(assignmentsCurrent[i].assigned_to, assignmentsOriginal[i].assigned_to)
                && assignmentsOriginal[i].assigned_to.assignment_id != null
            ) {
                changed.push(assignmentsOriginal[i].assigned_to.assignment_id);
            }
        }

        return changed;
    })();

    if (removedAssignmentIds.length <= 0) {
        return original;
    }

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

    const freshItem = await planningApi.planning.getById(original._id, true, true);

    // Force option is enabled, otherwise we get the old planning item from the store
    return freshItem;
}
