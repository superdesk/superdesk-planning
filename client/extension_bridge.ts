import React from 'react';

import {IArticle, IVocabularyItem} from 'superdesk-api';

import {getAssignmentTypeInfo} from './utils/assignments';
import {SluglineComponent} from './components/Assignments/AssignmentItem/fields/Slugline';
import {DueDateComponent} from './components/Assignments/AssignmentItem/fields/DueDate';
import {StateComponent} from './components/Assignments/AssignmentItem/fields/State';
import {EditorFieldVocabulary, IEditorFieldVocabularyProps} from './components/fields/editor/base/vocabulary';

import {getVocabularyItemFieldTranslated} from './utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from './utils/users';

import {registerEditorField} from './components/fields/resources/registerEditorFields';
import {IAssignmentItem, IEditorFieldProps, IPlanningAppState} from 'interfaces';
import {isContentLinkToCoverageAllowed} from './utils/archive';

// KEEP IN SYNC WITH client/planning-extension/src/extension_bridge.ts
interface IExtensionBridge {
    assignments: {
        utils: {
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
        },
        components: {
            SluglineComponent,
            DueDateComponent,
            StateComponent,
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
        },
    },
    fields: {
        registerEditorField,
    }
};
