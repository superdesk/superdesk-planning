import {isNullOrUndefined} from 'core/helpers/typescript-helpers';
import {EDITOR_TYPE} from 'interfaces';
import {IExposedFromAuthoring} from 'superdesk-api';
import {planningApi} from '../../superdeskApi';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';

type IRelatedPlanningRefs = {[id: string]: RelatedPlanningItem};

export const handleUnsavedChanges = (editorType: EDITOR_TYPE) => {
    const embeddedEditorRef = planningApi.editor(editorType).dom.fields['related_plannings']?.current;

    // Check if we're there's related plannings
    if (embeddedEditorRef == null) {
        return Promise.resolve();
    }

    const relatedPlanningsRefs: IRelatedPlanningRefs = embeddedEditorRef.relatedPlanningRefs;
    const exposedAuthoringArray = Object.values(relatedPlanningsRefs)
        .map((x) => {
            try {
                return x.standaloneEditorRef.current.planningEditorRef.current.editorRef.current.getExposed();
            } catch {
                return null;
            }
        })
        .filter(isNullOrUndefined);

    return exposedAuthoringArray.reduce<Promise<any>>(
        (promise, x: IExposedFromAuthoring<any>) => promise.then(() => {
            if (x.hasUnsavedChanges()) {
                return x.handleUnsavedChanges();
            }

            return Promise.resolve();
        }),
        Promise.resolve(),
    );
};
