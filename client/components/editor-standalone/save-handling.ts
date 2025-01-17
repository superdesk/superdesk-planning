import {isNullOrUndefined} from 'core/helpers/typescript-helpers';
import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';

type IRelatedPlanningRefs = {[id: string]: RelatedPlanningItem};
type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES' | 'DISCARD';

const getEmbeddedAuthoringRefs = (editorType: EDITOR_TYPE) => {
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields['related_plannings']?.current;
    const relatedPlanningsRefs: IRelatedPlanningRefs = embeddedEditorRef?.relatedPlanningRefs;

    return relatedPlanningsRefs;
};

const getEmbeddedPlanningExposed = (editorType: EDITOR_TYPE): Array<IExposedFromAuthoring<void>> => {
    const relatedPlanningsRefs = getEmbeddedAuthoringRefs(editorType);
    const exposedAuthoringArray = Object.values(relatedPlanningsRefs ?? []).map((x) => {
        try {
            return x.standaloneEditorRef.current.planningEditorRef.current.editorRef.current.getExposed();
        } catch {
            return null;
        }
    })
        .filter(isNullOrUndefined);

    return exposedAuthoringArray;
};

const FIRST_ERROR = 0;

const handleErrors = (editorType: EDITOR_TYPE, editorIndex: number) => {
    const firstRelatedPlanningRef = getEmbeddedAuthoringRefs(editorType)[editorIndex];
    const firstEditorRef =
        firstRelatedPlanningRef.standaloneEditorRef.current.planningEditorRef.current.editorRef.current;
    const fieldErrors = firstEditorRef.getExposed().getValidationErrors();
    const fieldToFocus = firstEditorRef?.fieldRefs[Object.keys(fieldErrors)[FIRST_ERROR]].current as HTMLDivElement;

    fieldToFocus?.scrollIntoView?.();

    return Promise.reject();
};

/**
 * Function that handles editor changes using editor refs.
 * Execution is cancelled on the first encounter of an editor error.
 * If an error occurs the first encountered embedded planning editor and the first error field is focused.
 */
export const handleEmbeddedPlannings = (editorType: EDITOR_TYPE, action: IEmbeddedPlanningsActionType) => {
    return getEmbeddedPlanningExposed(editorType).reduce<Promise<any>>(
        (promise, editorExposed, editorIndex) => promise.then(() => {
            if (editorExposed.hasUnsavedChanges()) {
                if (action === 'SAVE') {
                    return editorExposed.save().catch(() => handleErrors(editorType, editorIndex));
                } else if (action === 'DISCARD') {
                    return editorExposed.discardUnsavedChanges();
                } else {
                    return editorExposed.handleUnsavedChanges().catch(() => handleErrors(editorType, editorIndex));
                }
            }

            return Promise.resolve();
        }),
        Promise.resolve(),
    );
};

export const embeddedPlanningHasUnsavedChanges = () => {
    let hasUnsavedChanges = false;

    getEmbeddedPlanningExposed(EDITOR_TYPE.INLINE).forEach((x) => {
        if (x.hasUnsavedChanges() && hasUnsavedChanges === false) {
            hasUnsavedChanges = true;
        }
    });

    return hasUnsavedChanges;
};
