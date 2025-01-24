import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';

type IRelatedPlanningRefs = {[id: string]: RelatedPlanningItem};
type ItemType = 'event' | 'planning';
export type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES' | 'DISCARD';

const getEmbeddedAuthoringRefs = (editorType: EDITOR_TYPE, itemType: ItemType) => {
    const fieldId = itemType === 'event' ? 'related_plannings' : 'associated_event';
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields[fieldId]?.current;
    const relatedItemRefs: IRelatedPlanningRefs = embeddedEditorRef?.relatedItemRefs;

    return relatedItemRefs ?? [];
};

const getEmbeddedPlanningExposed = (
    editorType: EDITOR_TYPE,
    itemType: 'event' | 'planning',
): Array<IExposedFromAuthoring<void>> => {
    const relatedItemRefs = getEmbeddedAuthoringRefs(editorType, itemType);

    // Crashes whenever there's no embedded plannings
    const exposedAuthoringArray = Object.values(relatedItemRefs).map((x) =>
        x?.standaloneEditorRef?.current?.editorRef?.current?.editorRef?.current?.getExposed?.(),
    );

    return exposedAuthoringArray;
};


const handleErrors = (editorType: EDITOR_TYPE, editorIndex: number, itemType: ItemType) => {
    const FIRST_ERROR = 0;
    const relatedItemRef = getEmbeddedAuthoringRefs(editorType, itemType)[editorIndex];
    const firstEditorRef =
        relatedItemRef.standaloneEditorRef.current.editorRef.current.editorRef.current;
    const fieldErrors = firstEditorRef.getExposed().getValidationErrors();
    const fieldToFocus = firstEditorRef?.fieldRefs[Object.keys(fieldErrors)[FIRST_ERROR]].current as HTMLDivElement;
    const toggleBoxRef = relatedItemRef.toggleBoxRef.current;

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
    itemType: ItemType,
) => {
    const planningsExposed = getEmbeddedPlanningExposed(editorType, itemType);
    let editorIndex = 0;
    let promiseResult = Promise.resolve();

    for (const planning of planningsExposed) {
        promiseResult = promiseResult.then(() => {
            if (planning.hasUnsavedChanges()) {
                if (action === 'SAVE') {
                    return planning.save().catch(() => handleErrors(editorType, editorIndex, itemType));
                } else if (action === 'DISCARD') {
                    return planning.discardUnsavedChanges();
                } else {
                    return planning.handleUnsavedChanges().catch(() => handleErrors(editorType, editorIndex, itemType));
                }
            }

            editorIndex++;
        });
    }

    return promiseResult;
};

export const embeddedPlanningHasUnsavedChanges = (itemType: ItemType) => {
    const planningsExposed = getEmbeddedPlanningExposed(EDITOR_TYPE.INLINE, itemType);

    return (planningsExposed ?? []).some((x) => x.hasUnsavedChanges());
};
