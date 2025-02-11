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

/**
 * Iterate over related items and perform chosen action.
 * Will stop on first error.
 * User will be prompted about the issue in the UI and is expected to try again.
 */
export const handleEmbeddedItems = async(
    editorType: EDITOR_TYPE,
    action: IEmbeddedPlanningsActionType,
    itemType: ItemType,
): Promise<void> => {
    for (const exposed of getEmbeddedItemsExposed(editorType, itemType)) {
        if (!exposed.hasUnsavedChanges()) {
            continue;
        }

        if (action === 'SAVE') {
            await exposed.save();
        } else if (action === 'DISCARD') {
            await exposed.discardUnsavedChanges();
        } else {
            await exposed.handleUnsavedChanges();
        }
    }
};

export const embeddedItemHasUnsavedChanges = (itemType: ItemType) => {
    const planningsExposed = getEmbeddedItemsExposed(EDITOR_TYPE.INLINE, itemType);

    return planningsExposed.some((x) => x.hasUnsavedChanges());
};
