import {superdeskApi} from '../superdeskApi';
import {IPlanningAPI, IAssignmentItem} from '../interfaces';

function getAssignmentById(assignmentId: IAssignmentItem['_id']): Promise<IAssignmentItem> {
    return superdeskApi.dataApi.findOne<IAssignmentItem>('assignments', assignmentId);
}

export const assignments: IPlanningAPI['assignments'] = {
    getById: getAssignmentById,
};
