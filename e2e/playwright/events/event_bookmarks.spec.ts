import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar} from '../utils/common';
import {EventEditor} from '../page-object-models/planning';

test.describe('Planning.Events: editor bookmarks', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
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
        await expect(editor.fields.anpa_category.addButton).toBeInViewport();

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
