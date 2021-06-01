import {MAIN} from '../constants';
import {EDITOR_TYPE, IEditorBookmark, IEditorFormGroup, IEventOrPlanningItem} from '../interfaces';

export function setFormDiff(editor: EDITOR_TYPE, diff: DeepPartial<IEventOrPlanningItem>) {
    return {
        type: MAIN.ACTIONS.SET_FORM_DIFF,
        payload: {
            editor,
            diff,
        },
    };
}

// GROUPS
export function setFormGroups(editor: EDITOR_TYPE, groups: Dictionary<string, IEditorFormGroup>) {
    return {
        type: MAIN.ACTIONS.FORMS_GROUP_SET,
        payload: {
            editor,
            groups,
        }
    };
}

export function clearFormGroups(editor: EDITOR_TYPE) {
    return {
        type: MAIN.ACTIONS.FORMS_GROUP_CLEAR,
        payload: {
            editor,
        }
    };
}

export function updateFormGroup(editor: EDITOR_TYPE, updates: Partial<IEditorFormGroup>) {
    return {
        type: MAIN.ACTIONS.FORMS_GROUP_UPDATE,
        payload: {
            editor,
            updates,
        },
    };
}

export function deleteFormGroup(editor: EDITOR_TYPE, groupId: IEditorFormGroup['id']) {
    return {
        type: MAIN.ACTIONS.FORMS_GROUP_DELETE,
        payload: {
            editor,
            groupId,
        },
    };
}

// BOOKMARKS
export function setFormBookmarks(editor: EDITOR_TYPE, bookmarks: Dictionary<string, IEditorBookmark>) {
    return {
        type: MAIN.ACTIONS.FORMS_BOOKMARKS_SET,
        payload: {
            editor,
            bookmarks,
        }
    };
}

export function clearFormBookmarks(editor: EDITOR_TYPE) {
    return {
        type: MAIN.ACTIONS.FORMS_BOOKMARKS_CLEAR,
        payload: {
            editor,
        }
    };
}

export function updateFormBookmarks(editor: EDITOR_TYPE, updates: Partial<IEditorBookmark>) {
    return {
        type: MAIN.ACTIONS.FORMS_BOOKMARKS_UPDATE,
        payload: {
            editor,
            updates,
        },
    };
}

export function deleteFormBookmarks(editor: EDITOR_TYPE, bookmarkId: IEditorBookmark['id']) {
    return {
        type: MAIN.ACTIONS.FORMS_BOOKMARKS_DELETE,
        payload: {
            editor,
            bookmarkId,
        },
    };
}

export function updateActiveBookmarkId(editor: EDITOR_TYPE, bookmarkId: IEditorBookmark['id']) {
    return {
        type: MAIN.ACTIONS.FORMS_BOOKMARKS_SET_ACTIVE_ID,
        payload: {
            editor,
            bookmarkId,
        },
    };
}

export function showPopupForm(editor: EDITOR_TYPE, component: React.ComponentClass, props: any) {
    return {
        type: MAIN.ACTIONS.FORMS_SET_POPUP_FORM,
        payload: {
            editor: editor,
            component: component,
            props: props,
        },
    };
}

export function hidePopupForm(editor: EDITOR_TYPE) {
    return {
        type: MAIN.ACTIONS.FORMS_SET_POPUP_FORM,
        payload: {
            editor: editor,
            component: null,
            props: null,
        },
    };
}
