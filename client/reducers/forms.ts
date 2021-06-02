import * as React from 'react';

import {AUTOSAVE, ITEM_TYPE, MAIN} from '../constants';
import {createReducer} from './createReducer';
import {eventUtils, getItemId, getItemType, planningUtils} from '../utils';
import {cloneDeep, get, set} from 'lodash';
import {EDITOR_TYPE, IEditorFormState, IFormState} from '../interfaces';

const initialState: IFormState = {
    profiles: {},
    autosaves: {
        event: {},
        planning: {},
    },
    editors: {
        [EDITOR_TYPE.INLINE]: {
            itemId: null,
            itemType: null,
            action: null,
            initialValues: null,
            itemHistory: [],
            groups: {},
            activeBookmarkId: null,
            diff: {},
            popupFormComponent: null,
            popupFormProps: null,
        },
        [EDITOR_TYPE.POPUP]: {
            itemId: null,
            itemType: null,
            action: null,
            initialValues: null,
            itemHistory: [],
            groups: {},
            activeBookmarkId: null,
            diff: {},
            popupFormComponent: null,
            popupFormProps: null,
        },
    },
};

function updateEditor(
    state: IFormState,
    modal: boolean,
    updates: DeepPartial<IFormState>['editors']['panel']
): IFormState {
    const newState = cloneDeep(state);

    if (modal) {
        newState.editors[EDITOR_TYPE.POPUP] = {
            ...newState.editors[EDITOR_TYPE.POPUP],
            ...updates,
        };
    } else {
        newState.editors[EDITOR_TYPE.INLINE] = {
            ...newState.editors[EDITOR_TYPE.INLINE],
            ...updates,
        };
    }

    return newState;
}

function updateFormGroups(action: string, state: IFormState, payload: any): IFormState {
    const newState = cloneDeep(state);
    const editor: IEditorFormState = newState.editors[payload.editor];

    switch (action) {
    case MAIN.ACTIONS.FORMS_GROUP_SET:
        editor.groups = payload.groups;
        break;
    case MAIN.ACTIONS.FORMS_GROUP_CLEAR:
        editor.groups = {};
        break;
    case MAIN.ACTIONS.FORMS_GROUP_DELETE:
        delete editor.groups[payload.groupId];
        break;
    case MAIN.ACTIONS.FORMS_GROUP_UPDATE:
        editor.groups[payload.group.id] = {
            ...editor.groups[payload.group.id],
            ...payload.updates,
        };
        break;
    }

    return newState;
}

function updateFormBookmarks(action: string, state: IFormState, payload: any): IFormState {
    const newState = cloneDeep(state);
    const editor: IEditorFormState = newState.editors[payload.editor];

    switch (action) {
    case MAIN.ACTIONS.FORMS_BOOKMARKS_SET:
        editor.bookmarks = payload.bookmarks;
        break;
    case MAIN.ACTIONS.FORMS_BOOKMARKS_CLEAR:
        editor.bookmarks = {};
        editor.activeBookmarkId = null;
        break;
    case MAIN.ACTIONS.FORMS_BOOKMARKS_DELETE:
        delete editor.bookmarks[payload.bookmarkId];

        if (payload.bookmarkId === editor.activeBookmarkId) {
            editor.activeBookmarkId = null;
        }

        break;
    case MAIN.ACTIONS.FORMS_BOOKMARKS_UPDATE:
        editor.bookmarks[payload.bookmark.id] = {
            ...editor.bookmarks[payload.bookmark.id],
            ...payload.updates,
        };
        break;
    }

    return newState;
}

function setPopupForm(state: IFormState, payload: {
    editor: EDITOR_TYPE,
    component: React.ComponentClass,
    props: any,
}): IFormState {
    const newState = cloneDeep(state);
    const editor: IEditorFormState = newState.editors[payload.editor];

    editor.popupFormComponent = payload.component;
    editor.popupFormProps = payload.props;

    return newState;
}

const formsReducer = createReducer(initialState, {
    [MAIN.ACTIONS.OPEN_FOR_EDIT]: (state: IFormState, payload: any) => (
        updateEditor(state, payload.modal, {
            itemId: getItemId(payload.item) ?? null,
            itemType: getItemType(payload.item) || null,
            itemHistory: [],
            action: payload.action,
            initialValues: payload.item,
        })
    ),

    [MAIN.ACTIONS.CHANGE_EDITOR_ACTION]: (state, payload) => (
        updateEditor(state, payload.modal, {
            action: payload.action,
        })
    ),

    [MAIN.ACTIONS.CLOSE_EDITOR]: (state, payload) => (
        updateEditor(state, payload, {
            itemId: null,
            itemType: null,
            itemHistory: [],
            action: null,
            initialValues: null,
            groups: {},
            activeBookmarkId: null,
            diff: {},
            popupFormComponent: null,
            popupFormProps: null,
        })
    ),

    [AUTOSAVE.ACTIONS.RECEIVE]: (state, payload) => {
        const newState = cloneDeep(state);
        const itemId = getItemId(payload);
        const itemType = getItemType(payload);
        const itemPath = `autosaves.${itemType}["${itemId}"]`;

        if (itemType === ITEM_TYPE.EVENT) {
            set(newState, itemPath, eventUtils.modifyForClient(payload, true));
        } else if (itemType === ITEM_TYPE.PLANNING) {
            set(newState, itemPath, planningUtils.modifyForClient(payload));
        }

        return newState;
    },

    [AUTOSAVE.ACTIONS.REMOVE]: (state, payload) => {
        const itemId = getItemId(payload);
        const itemType = getItemType(payload);

        if (!itemId || !itemType) {
            return state;
        }

        const newState = cloneDeep(state);
        const autosaves = get(newState, `autosaves.${itemType}`);

        if (autosaves[itemId]) {
            delete autosaves[itemId];
        }

        return newState;
    },

    [AUTOSAVE.ACTIONS.RECEIVE_ALL]: (state, payload) => {
        const newState = cloneDeep(state);
        const items = {};

        if (payload.itemType === ITEM_TYPE.EVENT) {
            payload.autosaves.forEach((item) => {
                items[getItemId(item)] = eventUtils.modifyForClient(item, true);
            });
        } else if (payload.itemType === ITEM_TYPE.PLANNING) {
            payload.autosaves.forEach((item) => {
                items[getItemId(item)] = planningUtils.modifyForClient(item);
            });
        }

        set(newState, `autosaves.${payload.itemType}`, items);

        return newState;
    },

    [MAIN.ACTIONS.RECEIVE_EDITOR_ITEM_HISTORY]: (state, payload) => (
        updateEditor(state, payload.modal, {
            itemHistory: payload.items,
        })
    ),

    [MAIN.ACTIONS.SET_FORM_DIFF]: (state: IFormState, payload) => (
        updateEditor(
            state,
            payload.editor === EDITOR_TYPE.POPUP,
            {diff: payload.diff}
        )
    ),

    [MAIN.ACTIONS.FORMS_GROUP_SET]: updateFormGroups.bind(null, MAIN.ACTIONS.FORMS_GROUP_SET),
    [MAIN.ACTIONS.FORMS_GROUP_UPDATE]: updateFormGroups.bind(null, MAIN.ACTIONS.FORMS_GROUP_UPDATE),
    [MAIN.ACTIONS.FORMS_GROUP_DELETE]: updateFormGroups.bind(null, MAIN.ACTIONS.FORMS_GROUP_DELETE),
    [MAIN.ACTIONS.FORMS_GROUP_CLEAR]: updateFormGroups.bind(null, MAIN.ACTIONS.FORMS_GROUP_CLEAR),

    [MAIN.ACTIONS.FORMS_BOOKMARKS_SET]: updateFormBookmarks.bind(null, MAIN.ACTIONS.FORMS_BOOKMARKS_SET),
    [MAIN.ACTIONS.FORMS_BOOKMARKS_UPDATE]: updateFormBookmarks.bind(null, MAIN.ACTIONS.FORMS_BOOKMARKS_UPDATE),
    [MAIN.ACTIONS.FORMS_BOOKMARKS_DELETE]: updateFormBookmarks.bind(null, MAIN.ACTIONS.FORMS_BOOKMARKS_DELETE),
    [MAIN.ACTIONS.FORMS_BOOKMARKS_CLEAR]: updateFormBookmarks.bind(null, MAIN.ACTIONS.FORMS_BOOKMARKS_CLEAR),

    [MAIN.ACTIONS.FORMS_BOOKMARKS_SET_ACTIVE_ID]: (state, payload) => {
        const newState = cloneDeep(state);

        newState.editors[payload.editor].activeBookmarkId = payload.bookmarkId;

        return newState;
    },

    [MAIN.ACTIONS.FORMS_SET_POPUP_FORM]: setPopupForm,
});

export default formsReducer;
