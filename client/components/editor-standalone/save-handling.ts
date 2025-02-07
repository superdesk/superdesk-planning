import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';
import {AssociatedEventItem} from 'components/fields/editor/AssociatedEventItem';

type IRelatedItemRefs = {[id: string]: RelatedPlanningItem | AssociatedEventItem};
type ItemType = 'event' | 'planning';
export type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES' | 'DISCARD';

const getEmbeddedAuthoringRefs = (editorType: EDITOR_TYPE, itemType: ItemType) => {
    const fieldId = itemType === 'event' ? 'related_plannings' : 'associated_event';
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields[fieldId]?.current;
    const relatedItemRefs: IRelatedItemRefs = embeddedEditorRef?.relatedItemRefs;

    return relatedItemRefs;
};

const getEmbeddedItemsExposed = (
    editorType: EDITOR_TYPE,
    itemType: 'event' | 'planning',
): Array<IExposedFromAuthoring<void>> => {
    const relatedItemRefs = getEmbeddedAuthoringRefs(editorType, itemType);

    // Use Object.values instead of Object.keys because when refs are removed value becomes null and keys stay
    if (
        relatedItemRefs == null
        || Object.values(relatedItemRefs).filter(superdeskApi.helpers.notNullOrUndefined).length < 1
    ) {
        return [];
    }

    const exposedAuthoringArray = Object.values(relatedItemRefs).map((x) =>
        x?.authoringRef?.current?.getExposed?.() as unknown as IExposedFromAuthoring<void>
    );

    return exposedAuthoringArray;
};

const handleErrors = (editorType: EDITOR_TYPE, editorIndex: number, itemType: ItemType) => {
    const FIRST_ERROR = 0;
    const relatedItemRef = getEmbeddedAuthoringRefs(editorType, itemType)[editorIndex];
    const firstEditorRef = relatedItemRef.authoringRef.current;
    const fieldErrors = Object.keys(firstEditorRef.getExposed().getValidationErrors() ?? {});
    const fieldToFocus = firstEditorRef?.fieldRefs[fieldErrors[FIRST_ERROR]].current as HTMLDivElement;
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
export const handleEmbeddedItems = async(
    editorType: EDITOR_TYPE,
    action: IEmbeddedPlanningsActionType,
    itemType: ItemType,
) => {
    const itemExposed = getEmbeddedItemsExposed(editorType, itemType);
    let editorIndex = 0;
    let promiseResult = Promise.resolve();

    for (const planning of itemExposed) {
        promiseResult = promiseResult.then(() => {
            if (planning.hasUnsavedChanges()) {
                if (action === 'SAVE') {
                    return planning
                        .save()
                        .catch(() => handleErrors(editorType, editorIndex, itemType));
                } else if (action === 'DISCARD') {
                    return planning.discardUnsavedChanges();
                } else {
                    return planning
                        .handleUnsavedChanges()
                        .catch(() => handleErrors(editorType, editorIndex, itemType));
                }
            } else {
                editorIndex++;
                return Promise.resolve();
            }
        });
    }

    return promiseResult;
};

export const embeddedItemHasUnsavedChanges = (itemType: ItemType) => {
    const planningsExposed = getEmbeddedItemsExposed(EDITOR_TYPE.INLINE, itemType);

    return planningsExposed.some((x) => x.hasUnsavedChanges());
};
