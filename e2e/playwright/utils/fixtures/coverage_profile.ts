import type {APIRequestContext} from '@playwright/test';
import {addItems} from '../common';

// The coverage editor reads field config from the `planning_types` "coverage"
// profile merged over the defaults, so a partial editor override is enough.
export async function enableCoverageExtraFields(request: APIRequestContext) {
    await addItems(request, 'planning_types', [{
        name: 'coverage',
        editor: {
            priority: {enabled: true, index: 10},
            headline: {enabled: true, index: 11},
        },
    }]);
}
