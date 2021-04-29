import {IEventOrPlanningItem, IPlanningAPI} from '../interfaces';
import {planningApi} from '../superdeskApi';
import * as actions from '../actions';

function getAutosaveItemById(
    type: IEventOrPlanningItem['type'],
    id: IEventOrPlanningItem['_id']
): Promise<IEventOrPlanningItem | null> {
    return planningApi.redux.store.dispatch<any>(
        actions.autosave.fetchById(type, id)
    );
}

function saveAutosaveItem(
    original: IEventOrPlanningItem | undefined,
    updates: Partial<IEventOrPlanningItem>
): Promise<IEventOrPlanningItem> {
    return planningApi.redux.store.dispatch<any>(
        actions.autosave.save(original, updates)
    );
}

function deleteAutosaveItem(item: IEventOrPlanningItem): Promise<void> {
    return planningApi.redux.store.dispatch<any>(
        actions.autosave.remove(item)
    );
}

export const autosave: IPlanningAPI['autosave'] = {
    getById: getAutosaveItemById,
    save: saveAutosaveItem,
    delete: deleteAutosaveItem,
};
