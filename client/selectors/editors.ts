import * as React from 'react';
import {createSelector} from 'reselect';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
    IEditorBookmark,
    IEditorBookmarkGroup,
    IEditorFormGroup,
    IEventOrPlanningItem,
    IPlanningAppState
} from '../interfaces';

interface IEditorSelectors {
    getEditorGroups(state: IPlanningAppState): {[key: string]: IEditorFormGroup};
    getEditorGroupsSorted(state: IPlanningAppState): Array<IEditorFormGroup>;
    getEditorBookmarks(state: IPlanningAppState): {[key: string]: IEditorBookmark};
    getEditorBookmarksSorted(state: IPlanningAppState): Array<IEditorBookmark>;
    getActiveBookmarkId(state: IPlanningAppState): IEditorBookmark['id'] | null;
    getEditorDiff(state: IPlanningAppState): DeepPartial<IEventOrPlanningItem>;
    getFirstBookmarkGroup(state: IPlanningAppState): IEditorBookmarkGroup;
    getPopupFormComponent(state: IPlanningAppState): React.ComponentClass;
    getPopupFormProps(state: IPlanningAppState): any;
}

function createSelectorsForEditor(editorType: EDITOR_TYPE): IEditorSelectors {
    // Groups
    function getEditorGroups(state: IPlanningAppState): {[key: string]: IEditorFormGroup} {
        return state.forms.editors[editorType]?.groups ?? {};
    }

    const getEditorGroupsSorted = createSelector<
        IPlanningAppState,
        {[key: string]: IEditorFormGroup},
        Array<IEditorFormGroup>
    >(
        getEditorGroups,
        (groups) => {
            const items: Array<IEditorFormGroup> = [];

            Object.keys(groups)
                .sort((a, b) => (
                    groups[a].index - groups[b].index
                ))
                .forEach((groupId) => {
                    items.push(groups[groupId]);
                });

            return items;
        }
    );

    // Bookmarks
    function getEditorBookmarks(state: IPlanningAppState): {[key: string]: IEditorBookmark} {
        return state.forms.editors[editorType]?.bookmarks ?? {};
    }

    const getEditorBookmarksSorted = createSelector<
        IPlanningAppState,
        {[key: string]: IEditorBookmark},
        Array<IEditorBookmark>
    >(
        getEditorBookmarks,
        (bookmarks) => {
            const items: Array<IEditorBookmark> = [];

            Object.keys(bookmarks)
                .sort((a, b) => (
                    bookmarks[a].index - bookmarks[b].index
                ))
                .forEach((bookmarkId) => {
                    items.push(bookmarks[bookmarkId]);
                });

            return items;
        }
    );

    function getActiveBookmarkId(state: IPlanningAppState): IEditorBookmark['id'] {
        return state.forms.editors[editorType].activeBookmarkId;
    }

    function getEditorDiff(state: IPlanningAppState): DeepPartial<IEventOrPlanningItem> {
        return state.forms.editors[editorType].diff;
    }

    function getFirstBookmarkGroup(state: IPlanningAppState): IEditorBookmarkGroup {
        return getEditorBookmarksSorted(state)
            .filter(
                (bookmark) => bookmark.type === BOOKMARK_TYPE.formGroup
            )[0] as IEditorBookmarkGroup;
    }

    function getPopupFormComponent(state: IPlanningAppState): React.ComponentClass {
        return state.forms.editors[editorType].popupFormComponent;
    }

    function getPopupFormProps(state: IPlanningAppState): any {
        return state.forms.editors[editorType].popupFormProps;
    }

    return {
        getEditorGroups,
        getEditorGroupsSorted,
        getEditorBookmarks,
        getEditorBookmarksSorted,
        getActiveBookmarkId,
        getEditorDiff,
        getFirstBookmarkGroup,
        getPopupFormComponent,
        getPopupFormProps,
    };
}

export const editorSelectors: {[key: string]: IEditorSelectors} = {
    [EDITOR_TYPE.INLINE]: createSelectorsForEditor(EDITOR_TYPE.INLINE),
    [EDITOR_TYPE.POPUP]: createSelectorsForEditor(EDITOR_TYPE.POPUP),
};
