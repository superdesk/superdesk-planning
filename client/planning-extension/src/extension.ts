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
import {AutopostIngestRuleEditor} from './ingest_rule_autopost/AutopostIngestRuleEditor';
import {AutopostIngestRulePreview} from './ingest_rule_autopost/AutopostIngestRulePreview';

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

        const displayTopbarWidget = superdesk.privileges.hasPrivilege('planning_assignments_view')
            && extensionConfig?.assignmentsTopBarWidget === true;

        const result: IExtensionActivationResult = {
            contributions: {
                entities: {
                    article: {
                        getActions: (item) => [
                            {
                                label: 'Unlink as Coverage',
                                groupId: 'planning-actions',
                                icon: 'cut',
                                onTrigger: () => {
                                    const superdeskArticle = superdesk.entities.article;

                                    if (
                                        superdesk.privileges.hasPrivilege('archive') &&
                                        item.assignment_id != null &&
                                        !superdeskArticle.isPersonal(item) &&
                                        !superdeskArticle.isLockedInOtherSession(item) &&
                                        (
                                            superdeskArticle.itemActions(item).edit ||
                                            superdeskArticle.itemActions(item).correct ||
                                            superdeskArticle.itemActions(item).deschedule
                                        )
                                    ) {
                                        const event = new CustomEvent('planning:unlinkfromcoverage', {detail: {item}});

                                        window.dispatchEvent(event);
                                    }
                                },
                            }
                        ],
                        onSpike: (item: IArticle) => onSpike(superdesk, item),
                        onSpikeMultiple: (items: Array<IArticle>) => onSpikeMultiple(superdesk, items),
                        onPublish: (item: IArticle) => onPublishArticle(superdesk, item),
                        onRewriteAfter: (item: IArticle) => onArticleRewriteAfter(superdesk, item),
                        onSendBefore: (items: Array<IArticle>, desk: IDesk) => onSendBefore(superdesk, items, desk),
                    },
                    ingest: {
                        ruleHandlers: {
                            planning_publish: {
                                editor: AutopostIngestRuleEditor,
                                preview: AutopostIngestRulePreview,
                            },
                        },
                    },
                },
                globalMenuHorizontal: displayTopbarWidget ? [AssignmentsList] : [],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
