import {get} from 'lodash';
import {createSelector} from 'reselect';

import {IVocabularyItem} from 'superdesk-api';
import {IPlanningAppState} from '../interfaces';
import {
    PRIORITY_CONFIG,
    DEFAULT_PRIORITY_COLORS,
} from '../components/editor-standalone/field-definitions/priority-field';
import {
    URGENCY_CONFIG,
    DEFAULT_URGENCY_COLORS,
} from '../components/editor-standalone/field-definitions/urgency-field';

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

export const getPrioritiesForTreeSelect = createSelector<
    IPlanningAppState,
    Array<IVocabularyItem>,
    Array<{value: IVocabularyItem}>
>(
    getPriorities,
    (priorities) => {
        return priorities
            .sort((a, b) => String(a.qcode).localeCompare(String(b.qcode)))
            .map((priority) => ({
                value: {
                    ...priority,
                    color: priority.color ?? DEFAULT_PRIORITY_COLORS[priority.qcode],
                    fieldConfig: PRIORITY_CONFIG
                }
            }));
    }
);

export const getUrgenciesForTreeSelect = createSelector<
    IPlanningAppState,
    Array<IVocabularyItem>,
    Array<{value: IVocabularyItem}>
>(
    (state: IPlanningAppState) => state.vocabularies.urgency ?? EMPTY_ARRAY,
    (urgencies) => {
        return urgencies
            .sort((a, b) => String(a.qcode).localeCompare(String(b.qcode)))
            .map((urgency) => ({
                value: {
                    ...urgency,
                    color: urgency.color ?? DEFAULT_URGENCY_COLORS[urgency.qcode],
                    fieldConfig: URGENCY_CONFIG
                }
            }));
    }
);
