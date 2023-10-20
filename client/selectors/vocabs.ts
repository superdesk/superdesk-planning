import {get} from 'lodash';
import {createSelector} from 'reselect';

import {IVocabularyItem} from 'superdesk-api';
import {IPlanningAppState} from '../interfaces';

const EMPTY_ARRAY = [];

export const coverageProviders = (state) => get(state, 'vocabularies.coverage_providers', EMPTY_ARRAY);
export const locators = (state) => get(state, 'vocabularies.locators', EMPTY_ARRAY);
export const categories = (state) => get(state, 'vocabularies.categories', EMPTY_ARRAY);
export const subjects = (state) => get(state, 'subjects', EMPTY_ARRAY);
export const urgencyLabel = (state) => get(state, 'urgency.label', 'Urgency');
export const eventOccurStatuses = (state) => get(state, 'vocabularies.eventoccurstatus', EMPTY_ARRAY);
export const getContactTypes = (state) => get(state, 'vocabularies.contact_type', EMPTY_ARRAY);
export const getLanguages = (state) => get(state, 'vocabularies.languages', EMPTY_ARRAY);

export const getLanguagesForTreeSelectInput = createSelector<
    IPlanningAppState,
    Array<IVocabularyItem>,
    Array<{value: IVocabularyItem}>
>(
    [getLanguages],
    (languages) => (languages.map((language) => ({value: language})))
);

export const getPriorities = (state: IPlanningAppState) => state.vocabularies.priority ?? EMPTY_ARRAY;

export const getPriorityQcodes = createSelector<
    IPlanningAppState,
    Array<IVocabularyItem>,
    Array<number>
>(
    getPriorities,
    (priorities) => (
        priorities
            .map((item) => parseInt(item.qcode, 10))
            .sort()
    )
);
