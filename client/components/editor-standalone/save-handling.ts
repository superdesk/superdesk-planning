import {notNullOrUndefined} from '@sourcefabric/common';
import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';
import {AssociatedEventItem} from 'components/fields/editor/AssociatedEventItem';

type IRelatedItemRefs = {[id: string]: RelatedPlanningItem | AssociatedEventItem};
type ItemType = 'event' | 'planning';
export type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES' | 'DISCARD';

const getEmbeddedAuthoringRefs = <T extends IEventItem | IPlanningItem | void>(
    editorType: EDITOR_TYPE,
    itemType: ItemType,
) => {
    const fieldId = itemType === 'event' ? 'related_plannings' : 'associated_event';
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields[fieldId]?.current;
    const relatedItemRefs: IRelatedItemRefs = embeddedEditorRef?.relatedItemRefs;

    return relatedItemRefs;
};

const getEmbeddedItemsExposed = <T extends IPlanningItem | IEventItem | void>(
    editorType: EDITOR_TYPE,
    itemType: 'event' | 'planning',
): Array<IExposedFromAuthoring<T>> => {
    const relatedItemRefs = getEmbeddedAuthoringRefs<T>(editorType, itemType);

    const exposedAuthoringArray = Object.values(relatedItemRefs ?? {})
        .map((x) =>
            x?.authoringRef?.current?.getExposed?.() as IExposedFromAuthoring<T>
        )
        .filter(notNullOrUndefined);

    return exposedAuthoringArray;
};

/**
 * Iterate over related items and perform chosen action.
 * Will stop on first error.
 * User will be prompted about the issue in the UI and is expected to try again.
 */
export const handleEmbeddedItems = async<T extends IEventItem | IPlanningItem | void>(
    editorType: EDITOR_TYPE,
    action: IEmbeddedPlanningsActionType,
    itemType: ItemType,
): Promise<Array<T> | void> => {
    const updatedItems: Array<T> = [];

    for (const exposed of getEmbeddedItemsExposed<T>(editorType, itemType)) {
        if (!exposed.hasUnsavedChanges()) {
            continue;
        }

        if (action === 'SAVE') {
            updatedItems.push(await exposed.save());
        } else if (action === 'DISCARD') {
            await exposed.discardUnsavedChanges();
        } else {
            updatedItems.push(await exposed.handleUnsavedChanges());
        }
    }

    return updatedItems;
};

export const embeddedItemHasUnsavedChanges = (itemType: ItemType) => {
    const planningsExposed = getEmbeddedItemsExposed(EDITOR_TYPE.INLINE, itemType);

    return planningsExposed.some((x) => x.hasUnsavedChanges());
};
