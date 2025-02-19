import React from 'react';

import {IArticle, IVocabularyItem} from 'superdesk-api';
import {getAssignmentTypeInfo} from './utils/assignments';
import {SluglineComponent} from './components/Assignments/AssignmentItem/fields/Slugline';
import {DueDateComponent} from './components/Assignments/AssignmentItem/fields/DueDate';
import {StateComponent} from './components/Assignments/AssignmentItem/fields/State';
import {EditorFieldVocabulary, IEditorFieldVocabularyProps} from './components/fields/editor/base/vocabulary';
import {getVocabularyItemFieldTranslated} from './utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from './utils/users';
import {isContentLinkToCoverageAllowed} from './utils/archive';
import PlanningDetailsWidget, {getItemPlanningInfo} from './components/PlanningDetailsWidget';

import {AttachmentsInputStandalone} from './components/AttachmentsInputStandalone';
import {IPropsAttachmentsEditorStandalone} from './components/AttachmentsInputStandalone.interface';

import {EditorFieldCoverages} from './components/fields/editor/Coverages';
import {IPropsEditorFieldCoverages} from './components/fields/editor/coverages.interface';

import {ContactField} from './components/Contacts/ContactField';
import {IContactPropsNoRedux} from './components/Contacts/ContactField.interface';

import {EditorFieldLocation} from './components/fields/editor/Location';
import {IEditorFieldLocationProps} from 'components/fields/editor/Location.interface';

import {IAssignmentItem, IEditorFieldProps, IPlanningAppState, IPlanningCoverageItem} from 'interfaces';
import {registerEditorField} from './components/fields/resources/registerEditorFields';
import {validateCoveragesV2} from './validators/planning';

// KEEP IN SYNC WITH client/planning-extension/src/extension_bridge.ts
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
            EditorFieldContact: React.ComponentType<IContactPropsNoRedux>;
            EditorFieldLocation: React.ComponentType<IEditorFieldLocationProps>;
            EditorFieldCoverages: React.ComponentType<IPropsEditorFieldCoverages>;
        },
    }
    ui: {
        utils: {
            getUserInterfaceLanguageFromCV(): string;
            getVocabularyItemFieldTranslated<T>(
                item: {
                    translations?: {[key: string]: any},
                    [key: string]: any,
                } | null,
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

/**
 * Importing files to planning extension directly often doesn't work
 * because of either stricter TypeScript compiler settings
 * or due to imports being handled differently in webpack
 * (I don't remember the exact issue, but it's something related to esModuleInterop and __importStar).
 */
export const extensionBridge: IExtensionBridge = {
    assignments: {
        utils: {
            getAssignmentTypeInfo,
            isContentLinkToCoverageAllowed,
        },
        components: {
            SluglineComponent,
            DueDateComponent,
            StateComponent,
        },
    },
    planning: {
        getItemPlanningInfo,
    },
    coverages: {
        validateCoverages: validateCoveragesV2,
    },
    editor: {
        fields: {
            EditorFieldContact: ContactField,
            EditorFieldLocation: EditorFieldLocation,
            EditorFieldCoverages: EditorFieldCoverages,
        },
    },
    ui: {
        utils: {
            getUserInterfaceLanguageFromCV,
            getVocabularyItemFieldTranslated,
            isContentLinkToCoverageAllowed,
        },
        components: {
            EditorFieldVocabulary,
            PlanningDetailsWidget,
            AttachmentsInputStandalone,
        },
    },
    fields: {
        registerEditorField,
    }
};
