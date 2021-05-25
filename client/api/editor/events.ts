import {createRef} from 'react';

import {
    EDITOR_TYPE,
    IEditorAPI,
    IEditorBookmark,
    IEditorFormGroup,
    IEditorState,
    IEventOrPlanningItem,
    IFormAutosave,
    IFormItemManager,
} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import * as actions from '../../actions';
import {editorSelectors} from '../../selectors/editors';

export function getEventsInstance(type: EDITOR_TYPE): IEditorAPI['events'] {
    function resetDom() {
        const editor = planningApi.editor(type);
        const dispatch = planningApi.redux.store.dispatch;

        editor.dom = {
            popupContainer: createRef(),
            editorContainer: createRef(),
            headerInstance: createRef(),
            formContainer: createRef(),
            groups: {},
            fields: {},
        };

        dispatch(actions.editors.clearFormGroups(type));
        dispatch(actions.editors.clearFormBookmarks(type));
    }

    function onEditorConstructed(manager: IFormItemManager, autosave: IFormAutosave) {
        const editor = planningApi.editor(type);

        editor.manager = manager;
        editor.autosave = autosave;
        resetDom();
    }

    function onEditorMounted(manager: IFormItemManager, autosave: IFormAutosave) {
        planningApi.editor(type).ready = true;
    }

    function onEditorUnmounted() {
        const editor = planningApi.editor(type);

        editor.ready = false;
        resetDom();
    }

    function onEditorFormMounted() {
        const {dispatch, getState} = planningApi.redux.store;
        const groups = editorSelectors[type].getEditorGroupsSorted(getState());

        dispatch(actions.editors.updateActiveBookmarkId(type, groups[0].id));
    }

    function onEditorClosed() {
        planningApi.editor(type).ready = false;
        resetDom();
    }

    function registerFormGroups(newState: Partial<IEditorState>, groups: Array<IEditorFormGroup>) {
        const {dispatch} = planningApi.redux.store;
        const editor = planningApi.editor(type);
        const groupsById: {[key: string]: IEditorFormGroup} = {};

        groups.forEach((group) => {
            groupsById[group.id] = group;

            editor.dom.groups[group.id] = createRef();
            group.fields.forEach((field) => {
                editor.dom.fields[field] = createRef();
            });
        });
        dispatch(actions.editors.setFormGroups(type, groupsById));
    }

    function registerFormBookmarks(newState: Partial<IEditorState>, bookmarks: Array<IEditorBookmark>) {
        const {dispatch} = planningApi.redux.store;
        const bookmarksById: {[key: string]: IEditorBookmark} = {};

        bookmarks.forEach((bookmark) => {
            bookmarksById[bookmark.id] = bookmark;
        });
        dispatch(actions.editors.setFormBookmarks(type, bookmarksById));
    }

    function registerFormComponents(newState: Partial<IEditorState>) {
        const editor = planningApi.editor(type);
        const parts = newState.diff.type === 'event' ?
            editor.item.events.getGroupsForItem(newState.diff) :
            editor.item.planning.getGroupsForItem(newState.diff);

        registerFormGroups(newState, parts.groups);
        registerFormBookmarks(newState, parts.bookmarks);
    }

    function setEventsPlanningsToAdd(newState: Partial<IEditorState>) {
        if (newState.diff.type === 'event' && newState.diff.associated_plannings == null) {
            newState.diff.associated_plannings = planningApi.editor(type).item.getAssociatedPlannings();
        }
    }

    function onOpenForCreate(newState: Partial<IEditorState>) {
        registerFormComponents(newState);
        setEventsPlanningsToAdd(newState);
    }

    function onOpenForEdit(newState: Partial<IEditorState>) {
        registerFormComponents(newState);
        setEventsPlanningsToAdd(newState);
    }

    function onOpenForRead(newState: Partial<IEditorState>) {
        registerFormComponents(newState);
        setEventsPlanningsToAdd(newState);
    }

    function onOriginalChanged(item: IEventOrPlanningItem) {
        const editor = planningApi.editor(type);

        if (editor.form.getAction() === 'read') {
            // Only update the item if the editor is in read-only mode
            // Otherwise handle specific item updates in Event/Planning editors
            // i.e. Assignment updates are handled in Planning editor
            editor.manager.resetForm(item);
        }
    }

    function onItemUpdated(newState: Partial<IEditorState>) {
        setEventsPlanningsToAdd(newState);
    }

    function onScroll() {
        const {dispatch, getState} = planningApi.redux.store;
        const state = getState();
        const editor = planningApi.editor(type);
        const groups = editorSelectors[type].getEditorGroupsSorted(state);
        const formTop = editor.dom.formContainer.current?.getBoundingClientRect().top;
        const currentBookmarkId = editorSelectors[type].getActiveBookmarkId(state);
        let groupId: IEditorFormGroup['id'] = groups[0].id;

        groups.forEach((group) => {
            if (!group.fields?.length) {
                return;
            }

            const node = editor.dom.groups[group.id].current;
            const rect = node?.getBoundingClientRect();

            if (rect.top - 16 <= formTop) {
                groupId = group.id;
            }
        });

        if (groupId != currentBookmarkId) {
            dispatch(actions.editors.updateActiveBookmarkId(type, groupId));
        }
    }

    return {
        onEditorConstructed,
        onEditorMounted,
        onEditorUnmounted,
        onEditorFormMounted,
        onEditorClosed,
        onOpenForCreate,
        onOpenForEdit,
        onOpenForRead,
        onOriginalChanged,
        onItemUpdated,
        onScroll,
    };
}
