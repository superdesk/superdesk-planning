import {test, expect} from '../fixtures';

import {login, waitForPageLoad, SubNavBar} from '../utils/common';
import {EventEditor} from '../utils/planning';

test.describe('Planning.Events: editor bookmarks', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;

    test.beforeEach(async ({page, backendApi}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);

        await backendApi.resetApp('planning_prepopulate_data');
        await page.goto('/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can scroll to each bookmark', async () => {
        await subnav.createEvent();
        await editor.waitTillOpen();

        await editor.clickBookmark('schedule');
        await expect(editor.fields.dates.start.date.element).toBeVisible();
        await expect(editor.fields.dates.start.date.element).toBeFocused();

        await editor.clickBookmark('description');
        await expect(editor.fields.slugline.element).toBeVisible();
        await expect(editor.fields.slugline.element).toBeFocused();

        await editor.clickBookmark('location');
        await expect(editor.fields.location.inputElement).toBeVisible();
        await expect(editor.fields.location.inputElement).toBeFocused();

        await editor.clickBookmark('details');
        await expect(editor.fields.anpa_category.addButton).toBeVisible();
        await expect(editor.fields.anpa_category.addButton).toBeFocused();

        await editor.clickBookmark('attachments');
        await expect(
            editor.getFormGroup('attachments').locator('.basic-drag-block')
        ).toBeVisible();
        await expect(
            editor.getFormGroup('attachments').locator('.basic-drag-block')
        ).toBeFocused();

        await editor.clickBookmark('links');
        await expect(editor.getFormGroup('links').getByTestId('event-links__add-new-button')).toBeVisible();
        await expect(editor.getFormGroup('links').getByTestId('event-links__add-new-button')).toBeFocused();

        await editor.clickBookmark('related_plannings');

        await expect(editor.getFormGroup('related_plannings')).toBeVisible();

        await expect(editor.element.getByTestId('editor--bookmarks__planning-0')).not.toBeAttached();
    });
});
