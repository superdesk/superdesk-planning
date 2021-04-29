import {
    EDITOR_TYPE,
    IEditorAPI,
    IEditorBookmarkGroup,
    IEditorState,
    IEventOrPlanningItem,
} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import {isItemReadOnly} from '../../utils';
import {editorSelectors} from '../../selectors/editors';

export function getFormInstance(type: EDITOR_TYPE): IEditorAPI['form'] {
    function setState(newState: Partial<IEditorState>) {
        return planningApi.editor(type).manager.setState(newState);
    }

    function getState() {
        return planningApi.editor(type).manager.getState();
    }

    function scrollToBookmarkGroup(bookmark: IEditorBookmarkGroup) {
        const editor = planningApi.editor(type);

        editor.dom.groups[bookmark.group_id]?.current?.scrollIntoView();
    }

    function scrollToTop() {
        const editor = planningApi.editor(type);

        editor.dom.formContainer?.current.scrollTo({
            behavior: 'smooth',
            top: 0,
        });

        // Wait for scroll to complete, then attempt to focus the first field
        setTimeout(() => {
            const firstGroupBookmark = editorSelectors[type].getFirstBookmarkGroup(
                planningApi.redux.store.getState()
            );

            editor.dom.groups[firstGroupBookmark.group_id]?.current?.focus();
        }, 500);
    }

    function getProps() {
        return planningApi.editor(type).manager.getProps();
    }

    function getAction() {
        return getProps()?.itemAction;
    }

    function changeField(field: string, value: any, updateDirtyFlag: boolean = true, saveAutosave: boolean = true) {
        return planningApi.editor(type).manager.editor.onChangeHandler(
            field,
            value,
            updateDirtyFlag,
            saveAutosave
        );
    }

    function getDiff<T extends IEventOrPlanningItem>(): DeepPartial<T> {
        return getState().diff as DeepPartial<T>;
    }

    function isReadOnly() {
        const {
            itemAction,
            session,
            privileges,
            lockedItems,
            associatedEvent,
        } = getProps();
        const {initialValues} = getState();

        return itemAction === 'read' || isItemReadOnly(
            initialValues,
            session,
            privileges,
            lockedItems,
            associatedEvent
        );
    }

    return {
        setState,
        getState,
        scrollToTop,
        scrollToBookmarkGroup,
        getProps,
        getAction,
        changeField,
        getDiff,
        isReadOnly,
    };
}
