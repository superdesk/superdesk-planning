import {createRef} from 'react';

import {EDITOR_TYPE, IEditorAPI} from '../../interfaces';

import {getFormInstance} from './form';
import {getItemInstance} from './item';
import {getEventsInstance} from './events';

const editors: {[key: string]: IEditorAPI} = {};

function initApi(type: EDITOR_TYPE) {
    editors[type] = {
        form: getFormInstance(type),
        item: getItemInstance(type),
        manager: undefined, // This will be set on mount
        autosave: undefined,
        ready: false,
        events: getEventsInstance(type),
        dom: {
            popupContainer: createRef(),
            editorContainer: createRef(),
            headerInstance: createRef(),
            formContainer: createRef(),
            groups: {},
            fields: {},
        },
    };
}

// Singleton function to get the Editor API instance for the `EDITOR_TYPE`
export function editor(type: EDITOR_TYPE): IEditorAPI {
    if (![EDITOR_TYPE.INLINE, EDITOR_TYPE.POPUP].includes(type)) {
        throw new Error(`planningApi.editor: Incorrect type supplied "${type}"`);
    }

    if (editors[type] == null) {
        initApi(type);
    }

    return editors[type];
}

editor(EDITOR_TYPE.INLINE);
editor(EDITOR_TYPE.POPUP);
