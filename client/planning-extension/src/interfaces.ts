import {IArticle, onPublishMiddlewareResult, ISuperdeskGlobalConfig} from 'superdesk-api';

export interface IPlanningConfig extends ISuperdeskGlobalConfig {
    planning_check_for_assignment_on_publish?: boolean;
    planning_link_updates_to_coverage?: boolean;
    planning_check_for_assignment_on_send?: boolean;
}

export interface IPlanningAssignmentService {
    onPublishFromAuthoring: (item: IArticle) => Promise<onPublishMiddlewareResult>;
    onArchiveRewrite: (item: IArticle) => Promise<IArticle>;
    onSendFromAuthoring: (items: Array<IArticle>) => Promise<void>;
}
