import {IAssignmentItem} from 'interfaces';
import React from 'react';
import {IVocabularyItem} from 'superdesk-api';

import {getAssignmentTypeInfo} from './utils/assignments';
import {SluglineComponent} from './components/Assignments/AssignmentItem/fields/Slugline';
import {DueDateComponent} from './components/Assignments/AssignmentItem/fields/DueDate';
import {StateComponent} from './components/Assignments/AssignmentItem/fields/State';

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
}

export const extensionBridge:IExtensionBridge = {
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
};
