import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad} from '../utils/common';
import {AdvancedSearch} from '../page-object-models/planning';

test.describe('Search.Clear: advanced filter panel Clear button', () => {
    let search: AdvancedSearch;

    test.beforeEach(async ({page}) => {
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);

        await search.viewEventsAndPlanning();
        await search.toggleSearchPanel();
        await search.openAllToggleBoxes();
    });

    test('Clear resets every filled field, including text inputs', async () => {
        await search.searchFor({
            slugline: 'Original',
            name: 'Testing',
            subject: ['archaeology', 'music'],
        });

        await search.clickClear();

        // SDESK-7986: text inputs kept their typed value after Clear
        await search.fields.slugline.expect('');
        await search.fields.name.expect('');
        await search.fields.subject.expectEmpty();
    });

    test('Search keeps typed text and does not wipe the input', async () => {
        await search.enterSearchParams({slugline: 'Original'});
        await search.clickSearch();

        await search.fields.slugline.expect('Original');
    });
});
