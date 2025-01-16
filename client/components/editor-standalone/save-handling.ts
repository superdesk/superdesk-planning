import {isNullOrUndefined} from 'core/helpers/typescript-helpers';
import {EDITOR_TYPE} from '../../interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';

type IRelatedPlanningRefs = {[id: string]: RelatedPlanningItem};
type IEmbeddedPlanningsActionType = 'SAVE' | 'HANDLE_UNSAVED_CHANGES';

const getEmbeddedPlanningExposed = (editorType: EDITOR_TYPE): Array<IExposedFromAuthoring<void>> => {
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields['related_plannings']?.current;
    const relatedPlanningsRefs: IRelatedPlanningRefs = embeddedEditorRef?.relatedPlanningRefs;
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

export const handleEmbeddedPlannings = (editorType: EDITOR_TYPE, action: IEmbeddedPlanningsActionType) => {
    const exposedAuthorings = getEmbeddedPlanningExposed(editorType);

    return exposedAuthorings.reduce<Promise<any>>(
        (promise, x) => promise.then(() => {
            if (x.hasUnsavedChanges()) {
                return action === 'SAVE' ? x.save() : x.handleUnsavedChanges();
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
