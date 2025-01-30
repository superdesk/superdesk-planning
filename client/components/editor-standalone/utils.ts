import {omit} from 'lodash';
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

export async function handleRemovedAssignments(current: Partial<IPlanningItem>, original: Partial<IPlanningItem>) {
    /**
     * If a coverage has `workflow_status` of `draft` or `cancelled`, assigned_to property can be updated without
     * updating from `/assignments`
     */
    const assignmentsCurrent = current.coverages
        .filter((x) => x.workflow_status !== 'draft' && x.workflow_status !== 'cancelled');
    const assignmentsOriginal = original.coverages
        .filter((x) => x.workflow_status !== 'draft' && x.workflow_status !== 'cancelled');

    const removedAssignmentIds = (() => {
        const changed = [];

        for (let i = 0; i <= assignmentsOriginal.length - 1; i++) {
            if (
                JSON.stringify(assignmentsCurrent[i].assigned_to) != JSON.stringify(assignmentsOriginal[i].assigned_to)
                && assignmentsOriginal[i].assigned_to.assignment_id != null
            ) {
                changed.push(assignmentsOriginal[i].assigned_to.assignment_id);
            }
        }

        return changed;
    })();

    if (removedAssignmentIds.length <= 0) {
        return Promise.resolve(original);
    }

    const promiseRes = Promise.resolve();

    const {httpRequestVoidLocal} = superdeskApi;

    for (const id of removedAssignmentIds) {
        await promiseRes.then(() =>
            planningApi.assignments.getById(id).then((result) =>
                planningApi.locks.lockItem(result, ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action).then((item) =>
                    httpRequestVoidLocal({
                        method: 'DELETE',
                        path: `/assignments/${item._id}`,
                        headers: {
                            'If-Match': item._etag,
                        }
                    }),
                ),
            ),
        );
    }

    // Force option is enabled, otherwise we get the old planning item from the store
    return promiseRes.then(() => planningApi.planning.getById(original._id, true, true));
}
