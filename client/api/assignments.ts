import {IArticle, IRestApiResponse} from 'superdesk-api';
import {superdeskApi} from '../superdeskApi';
import {appConfig} from 'appConfig';

import {IPlanningAPI, IAssignmentItem, IAssignmentSearchParams, IAssignmentSearchAPIParams} from '../interfaces';
import {arrayToString, excludeNullParams, cvsToString} from './search';
import {modifyCoverageForClient} from '../utils/planning';

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

function searchAssignments(params: IAssignmentSearchParams): Promise<IRestApiResponse<IAssignmentItem>> {
    const customText = Object.keys(params.customText ?? {})
        .filter((key) => (params.customText[key]?.length ?? 0) > 0)
        .reduce((prev, curr) => {
            prev.push(curr + ':' + params.customText[curr]);
            return prev;
        }, [])
        .join(',');

    const apiParams: IAssignmentSearchAPIParams = excludeNullParams({
        repo: 'assignments',
        max_results: params.maxResults,
        page: params.page,
        projections: params.projections,
        sort_order: params.sortOrder,
        sort_field: params.sortField,

        query: params.query,
        desk_ids: arrayToString(params.deskIds),
        user_ids: arrayToString(params.userIds),
        search_query: params.searchQuery,
        states: arrayToString(params.states),
        g2_content_type: params.contentType?.qcode,
        priority: params.priority,
        date_filter: params.dateFilter,
        start_date: params.startDate,
        end_date: params.endDate,
        time_zone: params.timeZone ?? appConfig.default_timezone,
        ignore_scheduled_updates: params.ignoreScheduledUpdates,
        multiple_content: params.multipleContent === true ? true : undefined,
        slugline: params.slugline,
        genre: params.genre?.qcode,
        assignment_priority: params.assignmentPriority?.qcode,
        anpa_category: cvsToString(params.anpaCategory),
        subject: cvsToString(params.subject, 'qcode', true),
        language: params.language,
        custom_text: customText,
    });

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<IAssignmentItem>>(
        'events_planning_search',
        apiParams,
    ).then((response) => {
        response._items.forEach(modifyCoverageForClient);
        return response;
    });
}

export const assignments: IPlanningAPI['assignments'] = {
    getById: getAssignmentById,
    createAndOpenArticleFromTemplate: createAndOpenArticleFromTemplate,
    search: searchAssignments,
};
