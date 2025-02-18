import * as React from 'react';
import {IArticle, IVocabularyItem} from 'superdesk-api';
import {
    IAssignmentItem,
    IEditorFieldProps,
    IPlanningAppState,
    IPlanningCoverageItem,
    IPlanningItem,
} from '../../interfaces';
import {IPropsAttachmentsEditorStandalone} from '../../components/AttachmentsInputStandalone.interface';
import {IContactPropsNoRedux} from '../../components/Contacts/ContactField.interface';
import {IPropsEditorFieldCoverages} from '../../components/fields/editor/coverages.interface';
import {IEditorFieldLocationProps} from '../../components/fields/editor/Location.interface';

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
    editor: {
        fields: {
            EditorFieldLocation: React.ComponentType<IEditorFieldLocationProps>;
            EditorFieldContact: React.ComponentType<IContactPropsNoRedux>;
            EditorFieldCoverages: React.ComponentType<IPropsEditorFieldCoverages>;
        },
    }
    ui: {
        utils: {
            modifyCoverageForClient: (coverage: IPlanningCoverageItem) => IPlanningCoverageItem;
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
            Component: React.ComponentClass<ComponentProps>,
            props?: (currentProps: ComponentProps & StateProps) => Partial<ComponentProps & StateProps>,
            mapStateToProps?: (state: IPlanningAppState) => Partial<ComponentProps & StateProps>,
            forwardRef?: boolean
        ): void;
    };
}

export const extensionBridge = (window as unknown as any)['extension_bridge'] as IExtensionBridge;
