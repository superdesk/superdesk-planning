import {isNullOrUndefined} from 'core/helpers/typescript-helpers';
import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';

type IRelatedPlanningRefs = {[id: string]: RelatedPlanningItem};
export type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES' | 'DISCARD';

const getEmbeddedAuthoringRefs = (editorType: EDITOR_TYPE) => {
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields['related_plannings']?.current;
    const relatedPlanningsRefs: IRelatedPlanningRefs = embeddedEditorRef?.relatedPlanningRefs;

    return relatedPlanningsRefs;
};

const getEmbeddedPlanningExposed = (editorType: EDITOR_TYPE): Array<IExposedFromAuthoring<void>> => {
    const relatedPlanningsRefs = getEmbeddedAuthoringRefs(editorType);

    // Crashes whenever there's no embedded plannings
    const exposedAuthoringArray = Object.values(relatedPlanningsRefs ?? []).map((x) =>
        x?.standaloneEditorRef?.current?.planningEditorRef?.current?.editorRef?.current?.getExposed?.(),
    );

    return exposedAuthoringArray;
};


const handleErrors = (editorType: EDITOR_TYPE, editorIndex: number) => {
    const FIRST_ERROR = 0;
    const relatedPlanningRef = getEmbeddedAuthoringRefs(editorType)[editorIndex];
    const firstEditorRef =
        relatedPlanningRef.standaloneEditorRef.current.planningEditorRef.current.editorRef.current;
    const fieldErrors = firstEditorRef.getExposed().getValidationErrors();
    const fieldToFocus = firstEditorRef?.fieldRefs[Object.keys(fieldErrors)[FIRST_ERROR]].current as HTMLDivElement;
    const toggleBoxRef = relatedPlanningRef.toggleBoxRef.current;

    if (toggleBoxRef.isOpen() === false) {
        toggleBoxRef.toggle();
    }

    fieldToFocus?.scrollIntoView?.({behavior: 'smooth'});

    return Promise.reject();
};

/**
 * Function that handles editor changes using editor refs.
 * Execution is cancelled on the first encounter of an editor error.
 * If an error occurs the first encountered embedded planning editor and the first error field is focused.
 */
export const handleEmbeddedPlannings = async(
    editorType: EDITOR_TYPE,
    action: IEmbeddedPlanningsActionType,
) => {
    const planningsExposed = getEmbeddedPlanningExposed(editorType);
    let editorIndex = 0;
    let promiseResult = Promise.resolve();

    for (const planning of planningsExposed) {
        promiseResult = promiseResult.then(() => {
            if (planning.hasUnsavedChanges()) {
                if (action === 'SAVE') {
                    return planning.save().catch(() => handleErrors(editorType, editorIndex));
                } else if (action === 'DISCARD') {
                    return planning.discardUnsavedChanges();
                } else {
                    return planning.handleUnsavedChanges().catch(() => handleErrors(editorType, editorIndex));
                }
            }

            editorIndex++;
        });
    }

    return promiseResult;
};

export const embeddedPlanningHasUnsavedChanges = () => {
    return getEmbeddedPlanningExposed(EDITOR_TYPE.INLINE).some((x) => x?.hasUnsavedChanges?.());
};
