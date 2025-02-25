import {planningApi} from '../superdeskApi';
import {EDITOR_TYPE} from '../interfaces';
import {currentEditorType} from '../selectors/forms';

export function getOpenEditorType(): EDITOR_TYPE {
    return currentEditorType(planningApi.redux.store.getState());
}