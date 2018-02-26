import {get} from 'lodash';

export const coverageProviders = (state) => get(state, 'vocabularies.coverage_providers', []);
export const locators = (state) => get(state, 'vocabularies.locators', []);
export const categories = (state) => get(state, 'vocabularies.categories', []);
export const subjects = (state) => get(state, 'subjects', []);
