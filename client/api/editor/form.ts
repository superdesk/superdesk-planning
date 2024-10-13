import {IVocabularyItem} from 'superdesk-api';
import {
    EDITOR_TYPE,
    IEditorAPI,
    IEditorBookmarkGroup,
    IEditorState,
    IEventOrPlanningItem,
} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import {isItemReadOnly} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {editorSelectors} from '../../selectors/editors';
import * as actions from '../../actions';

export function getFormInstance(type: EDITOR_TYPE): IEditorAPI['form'] {
    function setState(newState: Partial<IEditorState>) {
        return planningApi.editor(type).manager.setState(newState);
    }

    function getState() {
        return planningApi.editor(type).manager.getState();
    }

    function scrollToBookmarkGroup(bookmarkId: IEditorBookmarkGroup['group_id'], options?: {focus?: boolean}) {
        const editor = planningApi.editor(type);

        editor.dom.groups[bookmarkId]?.current?.scrollIntoView({focus: options?.focus ?? true});
    }

    function scrollToTop() {
        const editor = planningApi.editor(type);

        editor.dom.formContainer?.current.scrollTo({
            behavior: 'smooth',
            top: 0,
        });

        // Wait for scroll to complete, then attempt to focus the first field
        waitForScroll().then(() => {
            const firstGroupBookmark = editorSelectors[type].getFirstBookmarkGroup(
                planningApi.redux.store.getState()
            );

            editor.dom.groups[firstGroupBookmark.group_id]?.current?.focus();
        });
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
            associatedEvents,
        } = getProps();
        const {initialValues} = getState();

        return itemAction === 'read' || isItemReadOnly(
            initialValues,
            session,
            privileges,
            lockedItems,
            associatedEvents,
        );
    }

    function waitForScroll(): Promise<void> {
        const {formContainer} = planningApi.editor(type).dom;

        if (formContainer.current != null) {
            return new Promise((resolve) => {
                let scrollTimeout: number;

                const onScroll = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = window.setTimeout(() => {
                        formContainer.current.removeEventListener('scroll', onScroll);
                        resolve();
                    }, 50);
                };

                formContainer.current.addEventListener('scroll', onScroll);

                // If no scroll has happened in 100ms, then assume
                // no scrolling has occurred at all
                window.setTimeout(() => {
                    if (scrollTimeout == null) {
                        resolve();
                    }
                }, 100);
            });
        }

        return Promise.resolve();
    }

    function showPopupForm(component: React.ComponentClass, props: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const {dispatch} = planningApi.redux.store;

            dispatch<any>(actions.editors.showPopupForm(
                type,
                component,
                {
                    ...props,
                    resolve: resolve,
                    reject: reject,
                }
            ));
        })
            .finally(() => {
                closePopupForm();
            });
    }

    function closePopupForm() {
        const {dispatch} = planningApi.redux.store;

        dispatch(actions.editors.hidePopupForm(type));
    }

    function getMainLanguage(): IVocabularyItem['qcode'] {
        const state = getState();

        return state.mainLanguage ?? state.diff.language ?? getUserInterfaceLanguageFromCV();
    }

    function setMainLanguage(languageQcode?: IVocabularyItem['qcode']) {
        setState({mainLanguage: languageQcode});
    }

    function toggleAllLanguages(): void {
        setState({showAllLanguages: !getState().showAllLanguages});
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
        waitForScroll,
        showPopupForm,
        closePopupForm,
        getMainLanguage,
        setMainLanguage,
        toggleAllLanguages,
    };
}
