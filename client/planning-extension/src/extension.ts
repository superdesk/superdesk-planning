import {
    IExtension,
    IArticle,
    IDesk,
    ISuperdesk,
    IExtensionActivationResult,
    onPublishMiddlewareResult,
} from 'superdesk-api';
import {IPlanningAssignmentService} from './interfaces';
import {IPlanningConfig} from '../../interfaces';
import {getAssignmentService} from './utils';
import {AssignmentsList} from './assignments-overview';
import {IPlanningExtensionConfigurationOptions} from './extension_configuration_options';

function onSpike(superdesk: ISuperdesk, item: IArticle) {
    const {gettext} = superdesk.localization;

    if (item.assignment_id != null) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('This item is linked to in-progress planning coverage.'),
                },
            ],
        });
    } else {
        return Promise.resolve({});
    }
}

function onSpikeMultiple(superdesk: ISuperdesk, items: Array<IArticle>) {
    const {gettext} = superdesk.localization;
    const itemsWithAssignmentsExist = items.some((item) => item.assignment_id != null);

    if (itemsWithAssignmentsExist) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('Some items are linked to in-progress planning coverage.'),
                },
            ],
        });
    } else {
        return Promise.resolve({});
    }
}

function onPublishArticle(superdesk: ISuperdesk, item: IArticle): Promise<onPublishMiddlewareResult> {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve({});
    }

    const config: IPlanningConfig = superdesk.instance.config as IPlanningConfig;

    if (config && config.planning_check_for_assignment_on_publish) {
        const assignmentService: IPlanningAssignmentService = getAssignmentService();

        return assignmentService.onPublishFromAuthoring(item);
    }

    return Promise.resolve({});
}

function onArticleRewriteAfter(superdesk: ISuperdesk, item: IArticle): Promise<IArticle> {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve(item);
    }

    const config: IPlanningConfig = superdesk.instance.config as IPlanningConfig;

    if (config && config.planning_link_updates_to_coverage) {
        const assignmentService: IPlanningAssignmentService = getAssignmentService();

        return assignmentService.onArchiveRewrite(item);
    }

    return Promise.resolve(item);
}

function onSendBefore(superdesk: ISuperdesk, items: Array<IArticle>, desk: IDesk): Promise<void> {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve();
    }

    const config: IPlanningConfig = superdesk.instance.config as IPlanningConfig;

    if (!config || !config.planning_check_for_assignment_on_send) {
        return Promise.resolve();
    }

    // If the destination desk is a production desk
    // and there are items provided, then call onSendFromAuthoring
    if (desk && desk.desk_type === 'production' && items.length > 0) {
        const assignmentService: IPlanningAssignmentService = getAssignmentService();

        return assignmentService.onSendFromAuthoring(items);
    }

    return Promise.resolve();
}

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const extensionConfig: IPlanningExtensionConfigurationOptions = superdesk.getExtensionConfig();

        return superdesk.privileges.getOwnPrivileges().then((privileges) => {
            const displayTopbarWidget = privileges['planning_assignments_view'] === 1
                && extensionConfig?.assignmentsTopBarWidget === true;

            const result: IExtensionActivationResult = {
                contributions: {
                    entities: {
                        article: {
                            onSpike: (item: IArticle) => onSpike(superdesk, item),
                            onSpikeMultiple: (items: Array<IArticle>) => onSpikeMultiple(superdesk, items),
                            onPublish: (item: IArticle) => onPublishArticle(superdesk, item),
                            onRewriteAfter: (item: IArticle) => onArticleRewriteAfter(superdesk, item),
                            onSendBefore: (items: Array<IArticle>, desk: IDesk) => onSendBefore(superdesk, items, desk),
                        },
                    },
                    globalMenuHorizontal: displayTopbarWidget ? [AssignmentsList] : [],
                },
            };

            return result;
        });
    },
};

export default extension;
