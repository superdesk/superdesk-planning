import {IVocabularyItem} from 'superdesk-api';
import {IAssignmentItem} from '../../interfaces';

// KEEP IN SYNC WITH client/extension_bridge.ts
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
}

export const extensionBridge = (window as unknown as any)['extension_bridge'] as IExtensionBridge;
