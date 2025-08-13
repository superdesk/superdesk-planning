import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../superdeskApi';
import {IPlanningAPI, IAssignmentItem} from '../interfaces';

function getAssignmentById(assignmentId: IAssignmentItem['_id']): Promise<IAssignmentItem> {
    return superdeskApi.dataApi.findOne<IAssignmentItem>('assignments', assignmentId);
}

function createAndOpenArticleFromTemplate(assignmentId: IAssignmentItem['_id'], templateName: string): Promise<void> {
    const payload: Partial<IArticle> & {template_name: string} = {
        assignment_id: assignmentId,
        template_name: templateName,
    };

    return superdeskApi.dataApi.create('assignments/content', payload).then((item) => {
        superdeskApi.ui.article.edit(item._id);
    });
}

export const assignments: IPlanningAPI['assignments'] = {
    getById: getAssignmentById,
    createAndOpenArticleFromTemplate: createAndOpenArticleFromTemplate,
};
