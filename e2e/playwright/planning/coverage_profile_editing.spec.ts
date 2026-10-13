import {test} from '@playwright/test';

import {setup, login, waitForPageLoad} from '../utils/common';
import {ManageCoverageProfiles} from '../page-object-models/planning';

test.describe('Planning: coverage profile editing', () => {
    let profiles: ManageCoverageProfiles;

    test.beforeEach(async ({page}) => {
        profiles = new ManageCoverageProfiles(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('saves same-named profiles independently for different coverage types', async () => {
        await profiles.show();
        await profiles.selectType('Text');
        await profiles.getFieldListItem('slugline').click();
        await profiles.getEditorCheckbox('schema.required').type(true);
        await profiles.saveField();
        await profiles.saveAll();

        await profiles.show();
        await profiles.selectType('Picture');
        await profiles.getFieldListItem('ednote').click();
        await profiles.getEditorCheckbox('schema.required').type(true);
        await profiles.saveField();
        await profiles.saveAll();

        await profiles.show();
        await profiles.selectType('Text');
        await profiles.expectFieldRequired('slugline', true);
        await profiles.expectFieldRequired('ednote', false);

        await profiles.selectType('Picture');
        await profiles.expectFieldRequired('slugline', false);
        await profiles.expectFieldRequired('ednote', true);
    });
});