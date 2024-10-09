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

import {registerEditorField} from './components/fields/resources/registerEditorFields';
import {IAssignmentItem, IEditorFieldProps, IPlanningAppState, IPlanningItem} from 'interfaces';

import PlanningDetailsWidget, {getItemPlanningInfo} from './components/PlanningDetailsWidget';

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
        };

        components: {
            EditorFieldVocabulary: React.ComponentType<IEditorFieldVocabularyProps>;
            PlanningDetailsWidget: React.ComponentType<{item: {assignment_id: string}}>;
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
    ui: {
        utils: {
            getUserInterfaceLanguageFromCV,
            getVocabularyItemFieldTranslated,
        },
        components: {
            EditorFieldVocabulary,
            PlanningDetailsWidget,
        },
    },
    fields: {
        registerEditorField,
    }
};
