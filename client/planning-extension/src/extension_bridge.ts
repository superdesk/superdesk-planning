import * as React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {IAssignmentItem, IEditorFieldProps} from '../../interfaces';

// KEEP IN SYNC WITH client/extension_bridge.ts
interface IEditorFieldVocabularyProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string;
    labelKey?: string;
    searchKey?: string;
    groupField?: string;
    noMargin?: boolean; // defaults to true
    valueAsString?: boolean;
}

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
            getVocabularyItemFieldTranslated(
                item: null | {
                    translations?: {[key: string]: any},
                    [key: string]: any,
                },
                field: string,
                language?: string,
                fallbackField?: string
            ): string;
        };
        components: {
            EditorFieldVocabulary: React.ComponentType<IEditorFieldVocabularyProps>;
        };
    };
}

export const extensionBridge = (window as unknown as any)['extension_bridge'] as IExtensionBridge;
