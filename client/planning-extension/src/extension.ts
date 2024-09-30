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
import {extensionBridge} from './extension_bridge';
import {
    PlanningDetailsWidget,
    PLANNING_DETAILS_WIDGET_ID,
    PLANNING_DETAILS_WIDGET_LABEL,
} from './planning-details-widget';

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
        const {gettext} = superdesk.localization;
        const {getItemPlanningInfo} = extensionBridge.planning;

        const result: IExtensionActivationResult = {
            contributions: {
                entities: {
                    article: {
                        getActions: (item) => [
                            {
                                label: gettext('Add to Planning'),
                                groupId: 'planning-actions',
                                icon: 'calendar-list',
                                onTrigger: () => {
                                    if (
                                        superdesk.privileges.hasPrivilege('planning_planning_management') &&
                                        superdesk.privileges.hasPrivilege('archive') &&
                                        !item.assignment_id != null &&
                                        !superdesk.entities.article.isPersonal(item) &&
                                        !superdesk.entities.article.isLockedInOtherSession(item) &&
                                        item.state !== 'correction' &&
                                        extensionBridge.ui.utils.isContentLinkToCoverageAllowed(item) &&
                                        (
                                            superdesk.entities.article.itemAction(item).edit ||
                                            superdesk.entities.article.itemAction(item).correct ||
                                            superdesk.entities.article.itemAction(item).deschedule
                                        )
                                    ) {
                                        const customEvent = new CustomEvent('planning:addToPlanning', {detail: item});

                                        window.dispatchEvent(customEvent);
                                    }
                                },
                            },
                            {
                                label: gettext('Unlink as Coverage'),
                                groupId: 'planning-actions',
                                icon: 'cut',
                                onTrigger: () => {
                                    const superdeskArticle = superdesk.entities.article;

                                    // keep in sync with client/planning-extension/src/extension.ts:123
                                    if (
                                        superdesk.privileges.hasPrivilege('archive') &&
                                        item.assignment_id != null &&
                                        !superdeskArticle.isPersonal(item) &&
                                        !superdeskArticle.isLockedInOtherSession(item) &&
                                        (
                                            superdeskArticle.itemAction(item).edit ||
                                            superdeskArticle.itemAction(item).correct ||
                                            superdeskArticle.itemAction(item).deschedule
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
                notifications: {
                    'email:notification:assignments': {name: superdesk.localization.gettext('Assignment')}
                },
                authoringSideWidgets: [
                    {
                        _id: PLANNING_DETAILS_WIDGET_ID,
                        label: PLANNING_DETAILS_WIDGET_LABEL,
                        order: 12,
                        icon: 'tasks',
                        component: PlanningDetailsWidget,
                        isAllowed: (item) => item.assignment_id != null,
                        getBadge: (item) => { // KEEP IN SYNC WITH client/index.ts
                            if (item.assignment_id == null) {
                                return Promise.resolve(null);
                            }

                            return getItemPlanningInfo({assignment_id: item.assignment_id})
                                .then((planning) => planning.coverages.length.toString());
                        },
                    },
                ],
                globalMenuHorizontal: displayTopbarWidget ? [AssignmentsList] : [],
            },
        };

        return Promise.resolve(result);
    },
};

export const registerEditorField = extensionBridge.fields.registerEditorField;

export default extension;
