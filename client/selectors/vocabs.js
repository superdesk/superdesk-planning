import {get} from 'lodash';

export const coverageProviders = (state) => get(state, 'vocabularies.coverage_providers', []);
export const locators = (state) => get(state, 'vocabularies.locators', []);
export const categories = (state) => get(state, 'vocabularies.categories', []);
export const subjects = (state) => get(state, 'subjects', []);
export const urgencyLabel = (state) => get(state, 'urgency.label', 'Urgency');
export const eventOccurStatuses = (state) => get(state, 'vocabularies.eventoccurstatus', []);
