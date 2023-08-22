import {IVocabulary} from 'superdesk-api';
import {IPlanningAPI, IPlanningState} from '../interfaces';
import {planningApi} from '../superdeskApi';

function getCustomVocabularies(): Array<IVocabulary> {
    const state: IPlanningState = planningApi.redux.store.getState();

    return state.customVocabularies;
}

export const vocabularies: IPlanningAPI['vocabularies'] = {
    getCustomVocabularies,
};
