import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar} from '../utils/common';
import {PlanningEditor} from '../page-object-models/planning';

test.describe('Planning.Events: planning bookmarks', () => {
    let editor: PlanningEditor;
    let subnav: SubNavBar;

    test.beforeEach(async ({page}) => {
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can scroll to each bookmark', async () => {
        await subnav.createPlanning();
        await editor.waitTillOpen();

        await editor.clickBookmark('title');
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeFocused();

        await editor.clickBookmark('schedule');
        await expect(editor.fields.planning_date.date.element).toBeVisible();
        await expect(editor.fields.planning_date.date.element).toBeFocused();

        await editor.clickBookmark('description');
        await expect(editor.fields.description_text.element).toBeVisible();
        await expect(editor.fields.description_text.element).toBeFocused();

        await editor.clickBookmark('details');
        await expect(editor.fields.ednote.element).toBeVisible();
        await expect(editor.fields.ednote.element).toBeFocused();

        await editor.clickBookmark('add_coverage');
    });
});
