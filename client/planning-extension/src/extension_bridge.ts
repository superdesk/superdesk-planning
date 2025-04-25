import * as React from 'react';
import {IArticle, IVocabularyItem} from 'superdesk-api';
import {
    IAssignmentItem,
    IEditorFieldProps,
    IPlanningAppState,
    IPlanningContentProfile,
    IPlanningCoverageItem,
    IPlanningItem,
} from '../../interfaces';
import {IPropsAttachmentsEditorStandalone} from '../../components/AttachmentsInputStandalone.interface';
import {IContactPropsNoRedux} from '../../components/Contacts/ContactField.interface';
import {IPropsEditorFieldCoverages} from '../../components/fields/editor/coverages.interface';
import {IEditorFieldLocationProps} from '../../components/fields/editor/Location.interface';
import {IEditorFieldEventRecurringRulesProps} from '../../components/fields/editor/EventRecurringRules.interface';
import {IEventScheduleFieldProps} from '../../components/fields/editor/EventSchedule.interface';

interface IEditorFieldVocabularyProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string;
    labelKey?: string;
    searchKey?: string;
    groupField?: string;
    noMargin?: boolean; // defaults to true
    valueAsString?: boolean;
}

// KEEP IN SYNC WITH client/extension_bridge.ts
interface IExtensionBridge {
    assignments: {
        utils: {
            isContentLinkToCoverageAllowed(item: IArticle): boolean;
            getAssignmentTypeInfo(
                assignment: IAssignmentItem,
                contentTypes: Array<IVocabularyItem>,
            ): {tooltip: string; className: string};
        };
        components: {
            SluglineComponent: React.ComponentType<{assignment: IAssignmentItem}>;
            DueDateComponent: React.ComponentType<{assignment: IAssignmentItem}>;
            StateComponent: React.ComponentType<{assignment: IAssignmentItem}>;
        };
    };
    planning: {
        getItemPlanningInfo(item: {assignment_id?: string}): Promise<IPlanningItem>;
    },
    coverages: {
        validateCoverages(coverages: Array<IPlanningCoverageItem>): {errors: {}; messages: Array<string>};
    };
    editor: {
        fields: {
            EditorFieldLocation: React.ComponentType<IEditorFieldLocationProps>;
            EditorFieldContact: React.ComponentType<IContactPropsNoRedux>;
            EditorFieldCoverages: React.ComponentType<IPropsEditorFieldCoverages>;
            EditorFieldEventRecurringRules: React.ComponentType<IEditorFieldEventRecurringRulesProps>;
            EditorFieldEventSchedule: React.ComponentType<IEventScheduleFieldProps>;
            EditorFieldCV: React.ComponentType<IEditorFieldProps>;
        },
    }
    ui: {
        utils: {
            planning_event_link_method: 'one_primary' | 'many_secondary' | 'one_primary_many_secondary';
            getItemProfile: (type: 'planning' | 'event') => IPlanningContentProfile;
            isTemporaryId: (id: string) => boolean;
            getUserInterfaceLanguageFromCV(): string;
            getVocabularyItemFieldTranslated(
                item: null | {
                    translations?: {[key: string]: any},
                    [key: string]: any,
                },
                field: string,
                language?: string,
                fallbackField?: string
            ): string;
            isContentLinkToCoverageAllowed(item: IArticle): boolean;
        };
        components: {
            EditorFieldVocabulary: React.ComponentType<IEditorFieldVocabularyProps>;
            PlanningDetailsWidget: React.ComponentType<{item: {assignment_id: string}}>;
            AttachmentsInputStandalone: React.ComponentType<IPropsAttachmentsEditorStandalone>;
        };
    };
    fields: {
        registerEditorField<ComponentProps extends IEditorFieldProps, StateProps extends {}>(
            field: string,
            Component: React.ComponentType<ComponentProps>,
            props?: (currentProps: ComponentProps & StateProps) => Partial<ComponentProps & StateProps>,
            mapStateToProps?: (state: IPlanningAppState) => Partial<ComponentProps & StateProps>,
            forwardRef?: boolean
        ): void;
    };
}

export const extensionBridge = (window as unknown as any)['extension_bridge'] as IExtensionBridge;
